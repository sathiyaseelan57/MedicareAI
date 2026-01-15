import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';

// @desc    Register a new user (Doctor or Patient)
// @route   POST /api/users
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create the base authentication account
  const user = await User.create({ name, email, password, role });

  if (user) {
    // Initialize their medical profile
    if (user.role === 'PATIENT') {
      await PatientProfile.create({
        user: user._id,
      });
    }

    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      role: user.role,
      message: user.role === 'PATIENT' ? 'Patient registered and profile created' : 'User registered'
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email });

  // 2. Check if user exists AND password matches
  if (user && (await user.matchPassword(password))) {
    // 3. Issue the secure cookie
    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    // 4. If something is wrong, send a 401 (Unauthorized)
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Logout - delete the cookie
// @route   POST /api/users/login
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), // Set expiration to the past to delete it
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  let profile;

  if (req.user.role === 'DOCTOR') {
    profile = await DoctorProfile.findOne({ user: req.user._id }).populate('user', 'name email');
  } else if (req.user.role === 'PATIENT') {
    profile = await PatientProfile.findOne({ user: req.user._id }).populate('user', 'name email');
  } else {
    // For ADMIN or other roles without a profile table
    return res.json(req.user);
  }

  if (profile) {
    res.json(profile);
  } else {
    res.status(404);
    throw new Error('Profile not found');
  }
});