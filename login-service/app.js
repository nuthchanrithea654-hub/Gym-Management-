const express = require('express');
const loginRoutes = require('./routes/loginRoutes');

const app = express();

// Readiness must reflect Atlas connectivity without restarting on a database outage.
app.get('/readyz', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready });
});

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
