const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  plan: {
    type: String,
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  }
});

module.exports = mongoose.model('Membership', membershipSchema);
