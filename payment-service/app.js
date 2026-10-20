const express = require('express');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Payment Service is running'
  });
});

app.use('/payments', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
