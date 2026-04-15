const express = require('express');
const Item = require('../models/Item');
const Match = require('../models/Match');

const router = express.Router();

router.get('/admin', async (req, res) => {
  try {
    const [lostCount, foundCount, totalUsers, totalMatches, confirmedMatches, heatmap] = await Promise.all([
      Item.countDocuments({ type: 'Lost' }),
      Item.countDocuments({ type: 'Found' }),
      Item.distinct('user'),
      Match.countDocuments(),
      Match.countDocuments({ status: 'confirmed' }),
      Item.aggregate([
        {
          $project: {
            location: 1,
            month: { $month: '$createdAt' }
          }
        },
        {
          $group: {
            _id: '$month',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      totalLostItems: lostCount,
      totalFoundItems: foundCount,
      activeUsers: totalUsers.length,
      totalMatches,
      matchSuccessRate: totalMatches ? Math.round((confirmedMatches / totalMatches) * 100) : 0,
      locationHeatmap: heatmap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
