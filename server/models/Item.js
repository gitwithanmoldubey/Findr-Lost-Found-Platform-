const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Lost', 'Found'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Phone', 'Wallet', 'ID/Document', 'Keys', 'Bag', 'Electronics', 'Jewellery', 'Other'],
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'recovered', 'matched'],
    default: 'active'
  },
  policeStatus: {
    type: String,
    enum: ['pending', 'investigating', 'recovered'],
    default: 'pending'
  },
  policeRemarks: {
    type: String,
    default: ''
  },
  jurisdiction: {
    type: String,
    default: 'Central'
  },
  brand: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  contactInfo: {
    type: String,
    required: true,
    trim: true
  },
  isStolen: {
    type: Boolean,
    default: false
  },
  reportedToPolice: {
    type: Boolean,
    default: false
  },
  aiConfidence: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
}, {
  timestamps: true
});

itemSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Item', itemSchema);
