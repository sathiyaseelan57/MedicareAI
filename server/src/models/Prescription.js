import mongoose from "mongoose";

// models/Medication.js
const medicineSchema = mongoose.Schema({
  name: { type: String, required: true },
  dosage: String, // e.g., "500mg" or "1 tablet"
  // Specific Timing Logic
  timing: { 
    type: String, 
    enum: ['Morning', 'Afternoon', 'Evening', 'Night'], 
    required: true 
  },
  relationToFood: { 
    type: String, 
    enum: ['Before Food', 'After Food', 'N/A'], 
    default: 'After Food' 
  },
  durationDays: Number // e.g., 7
});

const prescriptionSchema = mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  medicines: [medicineSchema], // This handles MULTIPLE medicines
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;