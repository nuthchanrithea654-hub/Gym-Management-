const express = require('express');
const membershipRoutes = require('./routes/membershipRoutes');
const serverRoutes = require('./routes/serverRoutes');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Membership Service is running'
  });
});

app.use('/memberships', membershipRoutes);
app.use('/server', serverRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

module.exports = app;
