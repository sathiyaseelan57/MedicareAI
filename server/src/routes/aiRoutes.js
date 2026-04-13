import express from "express";
import { getPatientAiSummary, getPatientFullDetails, handlePatientQuery } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// This endpoint will handle both Patient questions and Doctor summaries
// The 'mode' in the body will determine the AI personality
router.get("/patient-details/:patientId", protect, getPatientFullDetails);
router.get("/patient-details/ai-summary/:patientId", protect, getPatientAiSummary);
router.post("/ai-chat/:patientId", protect, handlePatientQuery)

export default router;
