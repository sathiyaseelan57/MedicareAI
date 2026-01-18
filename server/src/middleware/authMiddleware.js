import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Read the JWT from the 'jwt' cookie
  token = req.cookies.jwt;

  if (token) {
    try {
      // 2. Decode the token using our Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get the User from DB (excluding password) and attach to 'req'
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Move to the next function/controller
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

const doctor = (req, res, next) => {
  // Check if user exists and if their role is DOCTOR
  if (req.user && req.user.role === 'DOCTOR') {
    next(); // They are a doctor, let them through!
  } else {
    res.status(401);
    throw new Error('Not authorized as a doctor');
  }
};

export { protect, doctor };
