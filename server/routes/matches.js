const express = require('express');
const Match = require('../models/Match');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { runMatchingForUser } = require('../utils/matchEngine');
const { notifyUser } = require('../utils/notifier');

const router = express.Router();

async function getUserItemIds(userId) {
  const items = await Item.find({ user: userId }).select('_id');
  return items.map((item) => item._id);
}

router.get('/', auth, async (req, res) => {
  try {
    const userItemIds = await getUserItemIds(req.auth.userId);
    const matches = await Match.find({
      $or: [
        { lostItem: { $in: userItemIds } },
        { foundItem: { $in: userItemIds } }
      ]
    })
      .populate('lostItem')
      .populate('foundItem')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/run', auth, async (req, res) => {
  try {
    const matches = await runMatchingForUser(req.auth.userId);
    res.json({ count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/confirm', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('lostItem').populate('foundItem');
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    const isParticipant = [match.lostItem.user, match.foundItem.user].includes(req.auth.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not allowed to confirm this match.' });
    }

    match.status = 'confirmed';
    await match.save();

    await Item.findByIdAndUpdate(match.lostItem._id, { status: 'matched' });
    await Item.findByIdAndUpdate(match.foundItem._id, { status: 'matched' });

    const recipient = match.lostItem.user === req.auth.userId ? match.foundItem.user : match.lostItem.user;
    await notifyUser({
      userId: recipient,
      email: null,
      event: 'match:claimed',
      title: 'Item claim activity',
      body: 'The other party confirmed this match. Review claim details next.',
      data: { matchId: match._id.toString() }
    });

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
