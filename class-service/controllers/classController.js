const GymClass = require('../models/GymClass');

const createClass = async (req, res) => {
  try {
    const { className, trainer, schedule, capacity, status } = req.body;

    const gymClass = await GymClass.create({
      className,
      trainer,
      schedule,
      capacity,
      status
    });

    res.status(201).json({
      message: 'Gym class created successfully',
      gymClass
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const getClasses = async (req, res) => {
  try {
    const classes = await GymClass.find();

    res.json(classes);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

const updateClass = async (req, res) => {
  try {
    const gymClass = await GymClass.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    if (!gymClass) {
      return res.status(404).json({
        message: 'Gym class not found'
      });
    }

    res.json({
      message: 'Gym class updated successfully',
      gymClass
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Internal server error'
    });
  }
};

module.exports = { createClass, getClasses, updateClass };
