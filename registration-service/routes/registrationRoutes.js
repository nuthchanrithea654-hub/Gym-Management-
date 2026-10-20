const express = require('express');
const { register } = require('../controllers/registrationController');

const router = express.Router();

router.post('/', register);

module.exports = router;
