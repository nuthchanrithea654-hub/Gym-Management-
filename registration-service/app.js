const express = require('express');
const registrationRoutes = require('./routes/registrationRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Registration Service is running'
  });
});

app.use('/register', registrationRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
