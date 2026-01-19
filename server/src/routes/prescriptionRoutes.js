import express from "express";
const router = express.Router();
import {
  addPrescription,
  getActivePrescription,
  getAdherenceScore,
} from "../controllers/prescriptionController.js";
import { protect, doctor } from "../middleware/authMiddleware.js";

router.post("/", protect, doctor, addPrescription);
router.get("/my-checklist", protect, getActivePrescription);

router.get("/adherence/:patientId", protect, getAdherenceScore);

export default router;
