require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5003;

const start = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Membership Service running on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);

    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();
