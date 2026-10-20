const express = require('express');
const loginRoutes = require('./routes/loginRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Login Service is running'
  });
});

app.use('/login', loginRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
