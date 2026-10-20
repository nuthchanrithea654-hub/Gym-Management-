const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true
  },

  trainer: {
    type: String,
    required: true
  },

  schedule: {
    type: String,
    required: true
  },

  capacity: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['available', 'full', 'cancelled'],
    default: 'available'
  }
});

module.exports = mongoose.model('GymClass', classSchema);
