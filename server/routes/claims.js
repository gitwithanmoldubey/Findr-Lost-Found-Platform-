const express = require('express');
const validator = require('validator');
const auth = require('../middleware/auth');
const Claim = require('../models/Claim');
const Match = require('../models/Match');
const { notifyUser } = require('../utils/notifier');
const { applyReputationDelta } = require('../utils/reputation');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const claims = await Claim.find({
      $or: [{ claimant: req.auth.userId }, { owner: req.auth.userId }]
    }).populate({
      path: 'matchId',
      populate: [{ path: 'lostItem' }, { path: 'foundItem' }]
    }).sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId).populate('lostItem').populate('foundItem');
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    const participants = [match.lostItem.user, match.foundItem.user];
    if (!participants.includes(req.auth.userId)) {
      return res.status(403).json({ error: 'You are not allowed to claim this match.' });
    }

    const owner = match.lostItem.user;
    const proofText = validator.escape(String(req.body.proofText || '').trim());
    if (!proofText || proofText.length < 10) {
      return res.status(400).json({ error: 'Proof details must be at least 10 characters.' });
    }

    const claim = await Claim.create({
      matchId: match._id,
      claimant: req.auth.userId,
      owner,
      proofText,
      proofDocumentUrl: String(req.body.proofDocumentUrl || ''),
      additionalPhotoUrl: String(req.body.additionalPhotoUrl || ''),
      verificationSteps: {
        proofSubmitted: true,
        ownerReviewed: false,
        finalDecision: false
      }
    });

    await notifyUser({
      userId: owner,
      email: null,
      event: 'claim:submitted',
      title: 'Someone wants to claim an item',
      body: 'Review the submitted proof before sharing contact details.',
      data: { claimId: claim._id.toString(), matchId: match._id.toString() }
    });

    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:claimId/review', auth, async (req, res) => {
  try {
    const { decision, ownerRemark = '' } = req.body;
    if (!['approved', 'rejected', 'under_review'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid claim decision.' });
    }

    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ error: 'Claim not found.' });
    if (claim.owner !== req.auth.userId) {
      return res.status(403).json({ error: 'Only item owner can review this claim.' });
    }

    claim.status = decision;
    claim.ownerRemark = validator.escape(String(ownerRemark).trim());
    claim.verificationSteps = {
      proofSubmitted: true,
      ownerReviewed: true,
      finalDecision: ['approved', 'rejected'].includes(decision)
    };
    await claim.save();

    if (decision === 'approved') {
      await applyReputationDelta(claim.claimant, { scoreDelta: 20, successfulReturnsDelta: 1 });
      await applyReputationDelta(claim.owner, { scoreDelta: 10, successfulReturnsDelta: 1 });
    }
    if (decision === 'rejected') {
      await applyReputationDelta(claim.claimant, { scoreDelta: -10, fakeReportsDelta: 1 });
    }

    await notifyUser({
      userId: claim.claimant,
      email: null,
      event: 'claim:reviewed',
      title: `Your claim was ${decision}`,
      body: decision === 'approved'
        ? 'Owner approved your proof. You can now coordinate safely.'
        : 'Owner did not approve the claim. Add stronger proof and retry.',
      data: { claimId: claim._id.toString(), decision }
    });

    res.json(claim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
