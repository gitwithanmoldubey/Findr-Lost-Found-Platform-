const express = require('express');
const auth = require('../middleware/auth');
const UserReputation = require('../models/UserReputation');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const reputation = await UserReputation.findOne({ userId: req.auth.userId });
    res.json(reputation || {
      userId: req.auth.userId,
      score: 0,
      successfulReturns: 0,
      fakeReports: 0,
      badges: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
