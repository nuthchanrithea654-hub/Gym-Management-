const Booking = require('../models/Booking');

const createBooking = async (req, res) => {
  try {
    const { classId } = req.body;

    if (req.user.role !== 'member') {
      return res.status(403).json({
        message: 'Only members can book gym classes'
      });
    }

    if (!classId) {
      return res.status(400).json({
        message: 'Class ID is required'
      });
    }

    const existingBooking = await Booking.findOne({
      userId: req.user.userId,
      classId,
      status: 'booked'
    });

    if (existingBooking) {
      return res.status(409).json({
        message: 'You already booked this class'
      });
    }

    const booking = await Booking.create({
      userId: req.user.userId,
      classId
    });

    res.status(201).json({
      message: 'Class booked successfully',
      booking
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const getBookingsByUser = async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.userId !== req.params.userId
    ) {
      return res.status(403).json({
        message: 'Unauthorized access'
      });
    }

    const bookings = await Booking.find({
      userId: req.params.userId
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    if (
      req.user.role !== 'admin' &&
      booking.userId !== req.user.userId
    ) {
      return res.status(403).json({
        message: 'Unauthorized access'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

module.exports = { createBooking, getBookingsByUser, cancelBooking };
