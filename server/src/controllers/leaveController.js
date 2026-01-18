// controllers/leaveController.js
import asyncHandler from 'express-async-handler';
import Leave from '../models/Leave.js';

// @desc    Create new leave record
// @route   POST /api/leaves
// @access  Private/Doctor
export const addDoctorLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  // 1. Ensure the user is a doctor
  if (req.user.role !== 'DOCTOR') {
    res.status(403);
    throw new Error('Only doctors can register leaves');
  }

  // 2. Prevent back-dating leaves
  if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
    res.status(400);
    throw new Error('Leave start date cannot be in the past');
  }

  // 3. Create the leave
  const leave = await Leave.create({
    doctor: req.user._id,
    startDate,
    endDate,
    reason,
  });

  res.status(201).json(leave);
});

// @desc    Get doctor's own leaves
// @route   GET /api/leaves/my-leaves
// @access  Private/Doctor
export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ doctor: req.user._id }).sort({ startDate: -1 });
  res.json(leaves);
});