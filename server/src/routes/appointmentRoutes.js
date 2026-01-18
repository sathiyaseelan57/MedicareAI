// routes/appointmentRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  bookAppointment, 
  cancelAppointment, 
  getAppointmentsByRange, 
  getDoctorDashboard, 
  getMyAppointments,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';

const router = express.Router();

router.route('/')
  .post(protect, bookAppointment)
  .get(protect, getMyAppointments);
router.get('/dashboard', protect, getDoctorDashboard);
router.get('/range', protect, getAppointmentsByRange);
router.route('/:id')
  .put(protect, updateAppointmentStatus);
router.put('/:id/cancel', cancelAppointment);

export default router;