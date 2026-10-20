const express = require('express');
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  createMembership,
  getMembershipByUser,
  updateMembership
} = require('../controllers/membershipController');

const router = express.Router();

router.post('/', verifyToken, adminOnly, createMembership);
router.get('/:userId', verifyToken, getMembershipByUser);
router.patch('/:id', verifyToken, adminOnly, updateMembership);

module.exports = router;
