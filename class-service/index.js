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

const GymClass = mongoose.model('GymClass', classSchema);

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
    message: 'Gym Class Service is running'
  });
});

app.post('/classes', verifyToken, adminOnly, async (req, res) => {
  try {
    const { className, trainer, schedule, capacity, status } = req.body;

    const gymClass = await GymClass.create({
      className,
      trainer,
      schedule,
      capacity,
      status
    });

    res.status(201).json({
      message: 'Gym class created successfully',
      gymClass
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.get('/classes', verifyToken, async (req, res) => {
  try {
    const classes = await GymClass.find();

    res.json(classes);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

app.patch('/classes/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const gymClass = await GymClass.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!gymClass) {
      return res.status(404).json({
        message: 'Gym class not found'
      });
    }

    res.json({
      message: 'Gym class updated successfully',
      gymClass
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Gym Class Service running on port ${PORT}`);
});