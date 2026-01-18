import express from 'express';
const router = express.Router();
import { 
    addPrescription, 
    getActivePrescription 
} from '../controllers/prescriptionController.js';
import { protect, doctor } from '../middleware/authMiddleware.js';

// Route for the Doctor to prescribe during/after appointment
router.post('/', protect, doctor, addPrescription);

// Route for the Patient to see their current checklist
router.get('/my-checklist', protect, getActivePrescription);

export default router;