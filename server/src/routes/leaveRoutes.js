// routes/leaveRoutes.js
import express from 'express';
import { addDoctorLeave, getMyLeaves } from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, addDoctorLeave);

router.route('/my-leaves')
  .get(protect, getMyLeaves);

export default router;