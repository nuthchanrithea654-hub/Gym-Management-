const Membership = require('../models/Membership');

const createMembership = async (req, res) => {
  try {
    const { userId, plan, startDate, endDate, status } = req.body;

    const membership = await Membership.create({
      userId,
      plan,
      startDate,
      endDate,
      status
    });

    res.status(201).json({
      message: 'Membership created successfully',
      membership
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const getMembershipByUser = async (req, res) => {
  try {
    if (
      req.user.role !== 'admin' &&
      req.user.userId !== req.params.userId
    ) {
      return res.status(403).json({
        message: 'Unauthorized access'
      });
    }

    const membership = await Membership.findOne({
      userId: req.params.userId
    });

    if (!membership) {
      return res.status(404).json({
        message: 'Membership not found'
      });
    }

    res.json(membership);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const updateMembership = async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!membership) {
      return res.status(404).json({
        message: 'Membership not found'
      });
    }

    res.json({
      message: 'Membership updated successfully',
      membership
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// Shows which replica behind the nginx load balancer answered
const getServerInfo = (req, res) => {
  res.json({
    message: 'Membership Service is running',
    server: process.env.SERVER_NAME || 'membership-service'
  });
};

module.exports = {
  createMembership,
  getMembershipByUser,
  updateMembership,
  getServerInfo
};
