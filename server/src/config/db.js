import mongoose from 'mongoose';

// Function for connecting Mongo DB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

// src/controllers/authController.js
import User from '../models/User.js';

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email (we must explicitly 'select' the password here 
    // because we hid it in the schema for security)
    const user = await User.findOne({ email }).select('+password');

    // 2. TRIGGER the compare method
    // If user exists AND the passwords match
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: "GENERATED_JWT_TOKEN_HERE" // We will do this next!
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error); // Sends to our 4-parameter error handler!
  }
};