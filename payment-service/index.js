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

const Payment = mongoose.model('Payment', paymentSchema);

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

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Unauthorized: Admin access required'
    });
  }

  next();
};

app.get('/', (req, res) => {
  res.json({
    message: 'Payment Service is running'
  });
});

app.post('/payments', verifyToken, adminOnly, async (req, res) => {
  try {
    const { userId, amount, paymentMethod, status } = req.body;

    const payment = await Payment.create({
      userId,
      amount,
      paymentMethod,
      status
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.get('/payments/:userId', verifyToken, async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.userId !== req.params.userId
    ) {
      return res.status(403).json({
        message: 'Unauthorized access'
      });
    }

    const payments = await Payment.find({
      userId: req.params.userId
    });

    res.json(payments);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.patch('/payments/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found'
      });
    }

    res.json({
      message: 'Payment updated successfully',
      payment
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});