import express from "express";
import { askMedicalAI } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// This endpoint will handle both Patient questions and Doctor summaries
// The 'mode' in the body will determine the AI personality
router.post("/chat", protect, askMedicalAI);

export default router;
