import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Protect routes - requires a valid JWT in cookie 'jwt'
const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  token = req.cookies?.jwt;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

// Require DOCTOR role
const doctor = (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }
  if (req.user.role !== "DOCTOR") {
    res.status(403);
    throw new Error("Not authorized as a doctor");
  }
  next();
};

// Require PATIENT role
const patient = (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }
  if (req.user.role !== "PATIENT") {
    res.status(403);
    throw new Error("Not authorized as a patient");
  }
  next();
};

export { protect, doctor, patient };
