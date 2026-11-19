const express = require('express');
const proxyRoutes = require('./routes/proxyRoutes');
const accessLog = require('./middleware/accessLog');

const app = express();

app.set('trust proxy', true);
app.use(accessLog());

app.get('/', (req, res) => {
  res.json({
    message: 'Gym Management API Gateway is running'
  });
});

// No body parser here: request bodies are streamed straight to the services
app.use(proxyRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
