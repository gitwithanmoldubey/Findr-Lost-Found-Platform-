const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  lostItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  foundItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
