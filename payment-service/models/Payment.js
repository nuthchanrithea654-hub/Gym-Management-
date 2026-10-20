const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank'],
    required: true
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'paid'
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
