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

const Membership = mongoose.model('Membership', membershipSchema);

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
    message: 'Membership Service is running'
  });
});

app.post('/memberships', verifyToken, adminOnly, async (req, res) => {
  try {
    const { userId, plan, startDate, endDate, status } = req.body;

    const membership = await Membership.create({
      userId,
      plan,
      startDate,
      endDate,
      status
    });

    res.status(201).json({
      message: 'Membership created successfully',
      membership
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.get('/memberships/:userId', verifyToken, async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.userId !== req.params.userId
    ) {
      return res.status(403).json({
        message: 'Unauthorized access'
      });
    }

    const membership = await Membership.findOne({
      userId: req.params.userId
    });

    if (!membership) {
      return res.status(404).json({
        message: 'Membership not found'
      });
    }

    res.json(membership);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.patch('/memberships/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!membership) {
      return res.status(404).json({
        message: 'Membership not found'
      });
    }

    res.json({
      message: 'Membership updated successfully',
      membership
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 5003;

app.get('/server', verifyToken, (req, res) => {
  res.json({
    message: 'Membership Service is running',
    server: process.env.SERVER_NAME || 'membership-service'
  });
});

app.listen(PORT, () => {
  console.log(`Membership Service running on port ${PORT}`);
});