const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  classId: {
    type: String,
    required: true
  },

  bookingDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
