const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  createBooking,
  getBookingsByUser,
  cancelBooking
} = require('../controllers/bookingController');

const router = express.Router();

router.post('/', verifyToken, createBooking);
router.get('/:userId', verifyToken, getBookingsByUser);
router.patch('/:id/cancel', verifyToken, cancelBooking);

module.exports = router;
