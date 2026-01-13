import User from "../models/User.js";
import asyncHandler from "express-async-handler"; // Recommended for handling errors automatically

// @desc    Register a new user (Doctor or Patient)
// @route   POST /api/users
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1. Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // 2. Create the User
  // Note: The hashing happens automatically in the User model pre-save hook!
  const user = await User.create({
    name,
    email,
    password,
    role, // 'DOCTOR' or 'PATIENT'
  });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});
