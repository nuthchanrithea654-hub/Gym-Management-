const express = require('express');
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  createPayment,
  getPaymentsByUser,
  updatePayment
} = require('../controllers/paymentController');

const router = express.Router();

router.post('/', verifyToken, adminOnly, createPayment);
router.get('/:userId', verifyToken, getPaymentsByUser);
router.patch('/:id', verifyToken, adminOnly, updatePayment);

module.exports = router;
