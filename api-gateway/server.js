require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);

  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
