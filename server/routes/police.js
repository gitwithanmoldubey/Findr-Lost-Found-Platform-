const express = require('express');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

const simulatedStations = [
  { name: 'Connaught Place Police Station', lat: 28.6315, lng: 77.2167, distanceKm: 1.8 },
  { name: 'Tilak Marg Police Station', lat: 28.6229, lng: 77.2404, distanceKm: 2.6 },
  { name: 'Mandir Marg Police Station', lat: 28.6353, lng: 77.2011, distanceKm: 3.4 }
];

router.get('/incidents', async (req, res) => {
  try {
    const filter = { isStolen: true, reportedToPolice: true };
    if (req.query.jurisdiction) filter.jurisdiction = req.query.jurisdiction;
    const incidents = await Item.find(filter).sort({ date: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/incidents/:id', auth, async (req, res) => {
  try {
    const { policeStatus, policeRemarks = '' } = req.body;
    if (!['investigating', 'recovered'].includes(policeStatus)) {
      return res.status(400).json({ error: 'Invalid police status.' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        policeStatus,
        policeRemarks: String(policeRemarks).trim(),
        status: policeStatus === 'recovered' ? 'recovered' : 'active'
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Incident not found.' });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/nearest', async (req, res) => {
  const { lat, lng } = req.query;
  const anchor = {
    lat: Number(lat) || 28.6139,
    lng: Number(lng) || 77.209
  };

  res.json({
    simulated: true,
    anchor,
    nearestStation: simulatedStations[0],
    alternatives: simulatedStations.slice(1)
  });
});

router.post('/report/:itemId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    item.reportedToPolice = true;
    item.policeStatus = 'investigating';
    await item.save();

    res.json({
      pushedToSimulatedPoliceApi: true,
      caseId: `SIM-${Date.now()}`,
      itemId: item._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
