const express = require('express');
const Match = require('../models/Match');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

async function getAuthorizedMatch(matchId, userId) {
  const match = await Match.findById(matchId).populate('lostItem').populate('foundItem');
  if (!match) {
    return { error: 'Match not found.', status: 404 };
  }

  const participants = [match.lostItem?.user, match.foundItem?.user].filter(Boolean);
  if (!participants.includes(userId)) {
    return { error: 'You are not allowed to access this chat.', status: 403 };
  }

  return { match };
}

router.get('/:matchId', auth, async (req, res) => {
  try {
    const authResult = await getAuthorizedMatch(req.params.matchId, req.auth.userId);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const messages = await Message.find({ matchId: req.params.matchId }).sort({ createdAt: 1 });
    res.json({ match: authResult.match, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:matchId', auth, async (req, res) => {
  try {
    const authResult = await getAuthorizedMatch(req.params.matchId, req.auth.userId);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const message = await Message.create({
      matchId: req.params.matchId,
      sender: req.auth.userId,
      text: req.body.text
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
