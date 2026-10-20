const express = require('express');
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  createClass,
  getClasses,
  updateClass
} = require('../controllers/classController');

const router = express.Router();

router.post('/', verifyToken, adminOnly, createClass);
router.get('/', verifyToken, getClasses);
router.patch('/:id', verifyToken, adminOnly, updateClass);

module.exports = router;
