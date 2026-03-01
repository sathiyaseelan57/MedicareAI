import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Protect routes - requires a valid JWT in cookie 'jwt'
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.jwt;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Check if the decoded ID is our static Admin ID
    if (decoded.id === "admin_001") {
      req.user = {
        _id: "admin_001",
        name: "System Administrator",
        email: process.env.ADMIN_USERNAME,
        role: "ADMIN",
      };
      return next();
    }

    // 2. Otherwise, look up the user in the database
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

// Require ADMIN role
const admin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as an admin");
  }
};

// Require DOCTOR role
const doctor = (req, res, next) => {
  if (req.user && req.user.role === "DOCTOR") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a doctor");
  }
};

// Require PATIENT role
const patient = (req, res, next) => {
  if (req.user && req.user.role === "PATIENT") {
    next();
  } else {
    res.status(403);
    throw new Error("Not authorized as a patient");
  }
};

export { protect, admin, doctor, patient };