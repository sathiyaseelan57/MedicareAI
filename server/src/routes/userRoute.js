import express from "express";
import { registerUser } from "../controllers/userController.js";

const router = express.Router();

// This maps to POST /api/users
router.post("/", registerUser);
router.post("/login", authUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

export default router;
