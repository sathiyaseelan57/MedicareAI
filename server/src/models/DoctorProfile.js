// models/DoctorProfile.js
import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  experience: Number,
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
export default DoctorProfile;