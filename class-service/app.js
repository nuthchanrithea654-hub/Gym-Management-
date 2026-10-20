const express = require('express');
const classRoutes = require('./routes/classRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Gym Class Service is running'
  });
});

app.use('/classes', classRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
