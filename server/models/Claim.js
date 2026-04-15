const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  claimant: {
    type: String,
    required: true,
    index: true
  },
  owner: {
    type: String,
    required: true,
    index: true
  },
  proofText: {
    type: String,
    required: true,
    trim: true
  },
  proofDocumentUrl: {
    type: String,
    default: ''
  },
  additionalPhotoUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationSteps: {
    proofSubmitted: { type: Boolean, default: false },
    ownerReviewed: { type: Boolean, default: false },
    finalDecision: { type: Boolean, default: false }
  },
  ownerRemark: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Claim', claimSchema);
