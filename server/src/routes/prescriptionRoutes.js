import express from "express";
const router = express.Router();
import {
  addPrescription,
  getAdherenceScore,
  getMyPrescriptions,
  logMedication,
} from "../controllers/prescriptionController.js";
import { protect, doctor } from "../middleware/authMiddleware.js";

router.post("/", protect, doctor, addPrescription);
router.get("/my-checklist", protect, getMyPrescriptions);

router.get("/adherence/:patientId", protect, getAdherenceScore);
router.post("/log-medication", protect, logMedication);

export default router;
