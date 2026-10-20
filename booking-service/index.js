const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

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

const Booking = mongoose.model('Booking', bookingSchema);

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Token required'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
};

app.get('/', (req, res) => {
  res.json({
    message: 'Booking Service is running'
  });
});

app.post('/bookings', verifyToken, async (req, res) => {
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
});

app.get('/bookings/:userId', verifyToken, async (req, res) => {
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
});

app.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
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
});

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});