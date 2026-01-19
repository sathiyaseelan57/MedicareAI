import mongoose from 'mongoose';

const medicationLogSchema = mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  medicineName: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  timing: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night'] },
  status: { type: String, enum: ['Taken', 'Missed'], default: 'Taken' }
}, { timestamps: true });

const MedicationLog = mongoose.model('MedicationLog', medicationLogSchema);
export default MedicationLog;