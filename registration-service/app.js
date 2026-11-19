const express = require('express');
const registrationRoutes = require('./routes/registrationRoutes');

const app = express();

// Readiness must reflect Atlas connectivity without restarting on a database outage.
app.get('/readyz', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

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
