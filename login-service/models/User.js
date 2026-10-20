const mongoose = require('mongoose');

// Shares the users collection written by the registration service
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

module.exports = mongoose.model('User', userSchema);
