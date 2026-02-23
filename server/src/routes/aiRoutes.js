import express from "express";
import { getPatientFullDetails } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// This endpoint will handle both Patient questions and Doctor summaries
// The 'mode' in the body will determine the AI personality
router.get("/patient-details/:patientId", protect, getPatientFullDetails);

export default router;
