// models/PatientProfile.js
import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true,
    unique: true
  },
  medicalRecordNumber: {
    type: String,
    unique: true,
    // The 6-digit logic we discussed
    default: () => `MRN-${Math.floor(100000 + Math.random() * 900000)}`
  },
  age: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: String,
  currentStatus: { 
    type: String, 
    enum: ['OUT_PATIENT', 'ADMITTED', 'UNDER_OBSERVATION', 'DISCHARGED'], 
    default: 'OUT_PATIENT' 
  },
  assignedWard: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ward' 
  }
}, { timestamps: true });

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);
export default PatientProfile;