import express from "express";
import { protect, doctor } from "../middleware/authMiddleware.js";
import {
  bookAppointment,
  getAppointmentsByRange,
  getMyAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  completeConsultation,
  getAppointmentById,
} from "../controllers/appointmentController.js";

const router = express.Router();

// --- 1. GLOBAL & SPECIFIC ROUTES (Order is critical here) ---

// Specific route for the logged-in user's list (Patient or Doctor)
// This MUST stay above any "/:id" routes
router.get("/my-appointments", protect, getMyAppointments);

// Base route: POST to book, GET for range-based search (Doctor only)
router
  .route("/")
  .post(protect, bookAppointment)
  .get(protect, doctor, getAppointmentsByRange);


// --- 2. DYNAMIC PARAMETER ROUTES (/:id) ---

// Get specific details of one appointment
router.get("/:id", protect, getAppointmentById);

// Update status (e.g., Scheduled -> Confirmed)
router.put("/:id", protect, doctor, updateAppointmentStatus);

// Specialized action routes
router.put("/:id/cancel", protect, cancelAppointment);
router.put("/:id/complete", protect, doctor, completeConsultation);

export default router;