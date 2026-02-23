import express from "express";
import {
  addPatient,
  assignPatient,
  authUser,
  getDoctorsList,
  getMyStatus,
  getPatientDashboard,
  getPatientsList,
  getUserProfile,
  logoutUser,
  registerUser,
  updateUserProfile,
  getDoctorDashboard
} from "../controllers/userController.js";
import { doctor, protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.get("/patient-dashboard", protect, getPatientDashboard);
router.get("/doctor-dashboard", protect, doctor, getDoctorDashboard);
router.get("/my-status", protect, getMyStatus);
router.get("/patients", protect, getPatientsList);
router.get("/doctors", protect, getDoctorsList);
router.post("/add-patient", protect, addPatient);
router.put("/assign-patient", protect, assignPatient);

export default router;
