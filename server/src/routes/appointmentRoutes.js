import express from "express";
import { protect, doctor } from "../middleware/authMiddleware.js";
import {
  bookAppointment,
  cancelAppointment,
  getAppointmentsByRange,
  getDoctorDashboard,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

const router = express.Router();

// Anyone authenticated (patient or doctor) can book. Controller enforces roles.
router
  .route("/")
  .post(protect, bookAppointment)
  .get(protect, getMyAppointments);

// Doctor-only endpoints
router.get("/dashboard", protect, doctor, getDoctorDashboard);
router.get("/range", protect, doctor, getAppointmentsByRange);

router.route("/:id").put(protect, doctor, updateAppointmentStatus);
router.put("/:id/cancel", protect, cancelAppointment);

export default router;
