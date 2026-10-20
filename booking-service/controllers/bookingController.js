const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const isDuplicateKeyError = (error) => error?.code === 11000;

const sendServerError = (res, error) => {
  // Keep request data and database details out of the API response.
  console.error('Booking request failed:', error);
  return res.status(500).json({ message: 'Internal server error' });
};

const createBooking = async (req, res) => {
  if (req.user?.role !== 'member') {
    return res.status(403).json({ message: 'Only members can book gym classes' });
  }

  const classId = req.body?.classId;
  if (typeof classId !== 'string' || classId.trim().length === 0) {
    return res.status(400).json({ message: 'A valid class ID is required' });
  }

  if (typeof req.user.userId !== 'string' || req.user.userId.length === 0) {
    return res.status(401).json({ message: 'Invalid user token' });
  }

  try {
    const booking = await Booking.create({
      userId: req.user.userId,
      classId: classId.trim()
    });

    return res.status(201).json({
      message: 'Class booked successfully',
      booking
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ message: 'You already booked this class' });
    }

    return sendServerError(res, error);
  }
};

const getBookingsByUser = async (req, res) => {
  const { userId } = req.params;

  if (req.user?.role !== 'admin' && req.user?.userId !== userId) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  const page = Number.parseInt(req.query.page, 10);
  const limit = Number.parseInt(req.query.limit, 10);

  if (
    (req.query.page !== undefined && (!Number.isInteger(page) || page < 1)) ||
    (req.query.limit !== undefined && (!Number.isInteger(limit) || limit < 1))
  ) {
    return res.status(400).json({ message: 'Page and limit must be positive integers' });
  }

  const currentPage = req.query.page === undefined ? 1 : page;
  const pageSize = Math.min(
    req.query.limit === undefined ? DEFAULT_PAGE_SIZE : limit,
    MAX_PAGE_SIZE
  );

  try {
    const [bookings, total] = await Promise.all([
      Booking.find({ userId })
        .sort({ bookingDate: -1, _id: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Booking.countDocuments({ userId })
    ]);

    res.set({
      'X-Page': String(currentPage),
      'X-Page-Size': String(pageSize),
      'X-Total-Count': String(total),
      'X-Total-Pages': String(Math.ceil(total / pageSize))
    });
    return res.json(bookings);
  } catch (error) {
    return sendServerError(res, error);
  }
};

const cancelBooking = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid booking ID' });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user?.role !== 'admin' && booking.userId !== req.user?.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (booking.status === 'cancelled') {
      return res.status(409).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = { createBooking, getBookingsByUser, cancelBooking };
