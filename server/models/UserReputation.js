const mongoose = require('mongoose');

const userReputationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  score: {
    type: Number,
    default: 0
  },
  successfulReturns: {
    type: Number,
    default: 0
  },
  fakeReports: {
    type: Number,
    default: 0
  },
  badges: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserReputation', userReputationSchema);
