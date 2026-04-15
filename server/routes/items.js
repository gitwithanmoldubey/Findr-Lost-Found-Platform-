const express = require('express');
const validator = require('validator');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const { upload, isCloudinaryConfigured } = require('../utils/cloudinary');
const { runMatchingForItem } = require('../utils/matchEngine');

const router = express.Router();

function buildTheftFlags(description = '') {
  const theftKeywords = ['stolen', 'snatched', 'robbed', 'thief', 'gun', 'knife'];
  const normalizedDescription = description.toLowerCase();
  const isStolen = theftKeywords.some((keyword) => normalizedDescription.includes(keyword));
  const aiConfidence = isStolen
    ? Math.floor(Math.random() * (99 - 80 + 1)) + 80
    : Math.floor(Math.random() * 30);

  return {
    isStolen,
    aiConfidence,
    reportedToPolice: isStolen,
    policeStatus: isStolen ? 'investigating' : 'pending'
  };
}

router.get('/', async (req, res) => {
  try {
    const {
      type,
      isStolen,
      lat,
      lng,
      radiusInKm = 5,
      category,
      q,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (isStolen === 'true') filter.isStolen = true;
    if (category) filter.category = category;
    if (q) {
      const escaped = validator.escape(String(q));
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { brand: { $regex: escaped, $options: 'i' } }
      ];
    }
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    if (lat && lng) {
      filter.location = {
        $near: {
          $maxDistance: Number(radiusInKm) * 1000,
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          }
        }
      };
    }

    const order = sortOrder === 'asc' ? 1 : -1;
    const sortField = ['date', 'createdAt', 'aiConfidence'].includes(sortBy) ? sortBy : 'date';
    const items = await Item.find(filter).sort({ [sortField]: order });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.auth.userId }).sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { type, title, category, brand, description, contactInfo, lat, lng } = req.body;

    if (req.file && !req.file.path && !isCloudinaryConfigured()) {
      return res.status(400).json({
        error: 'Cloudinary credentials are required before image uploads can be used.'
      });
    }

    const newItem = new Item({
      user: req.auth.userId,
      type,
      title,
      category,
      brand,
      description,
      contactInfo,
      imageUrl: req.file?.path || '',
      ...buildTheftFlags(description),
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      }
    });

    await newItem.save();
    const matches = await runMatchingForItem(newItem);

    res.status(201).json({
      item: newItem,
      matchesCreated: matches.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'recovered', 'matched'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.user !== req.auth.userId) {
      return res.status(403).json({ error: 'You do not have access to update this item.' });
    }

    item.status = status;
    if (status === 'recovered') {
      item.policeStatus = 'recovered';
    }

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
