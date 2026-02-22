import express from "express";
import { protect, doctor, patient } from "../middleware/authMiddleware.js";
import { getMyReports } from "../controllers/reportController.js";

const router = express.Router();
router.get("/my-reports", protect, patient, getMyReports);

export default router;
