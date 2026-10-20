const Payment = require('../models/Payment');

const createPayment = async (req, res) => {
  try {
    const { userId, amount, paymentMethod, status } = req.body;

    const payment = await Payment.create({
      userId,
      amount,
      paymentMethod,
      status
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const getPaymentsByUser = async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.userId !== req.params.userId
    ) {
      return res.status(403).json({
        message: 'Unauthorized access'
      });
    }

    const payments = await Payment.find({
      userId: req.params.userId
    });

    res.json(payments);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found'
      });
    }

    res.json({
      message: 'Payment updated successfully',
      payment
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

module.exports = { createPayment, getPaymentsByUser, updatePayment };
