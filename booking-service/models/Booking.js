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

bookingSchema.index(
  { userId: 1, classId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'booked' },
    name: 'one_active_booking_per_user_and_class'
  }
);

bookingSchema.index(
  { userId: 1, bookingDate: -1, _id: -1 },
  { name: 'bookings_by_user_and_date' }
);

module.exports = mongoose.model('Booking', bookingSchema);
