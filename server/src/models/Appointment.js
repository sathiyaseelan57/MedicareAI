// models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointmentDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["Scheduled", "Confirmed", "Completed", "Cancelled"], 
      default: "Scheduled" 
    },
    reason: { type: String },
    
    // --- ADD THESE FIELDS ---
    diagnosis: { type: String },
    notes: { type: String },
    vitalsAtVisit: {
      temp: String,
      bp: String,
      pulse: String,
      weightKg: String,
    },
    followUpDate: { type: Date },
    
    // Linking to other collections for Population
    prescription: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Prescription" 
    },
    reports: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Report" 
    }], 
    // ------------------------
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;