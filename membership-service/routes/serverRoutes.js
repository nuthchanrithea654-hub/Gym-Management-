const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getServerInfo } = require('../controllers/membershipController');

const router = express.Router();

router.get('/', verifyToken, getServerInfo);

module.exports = router;
