const express = require('express');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Booking Service is running'
  });
});

app.use('/bookings', bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
