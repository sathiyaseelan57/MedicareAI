import mongoose from "mongoose";

const medicationLogSchema = mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
    },
    medicineName: { type: String, required: true },
    // Store as a Date representing the day (time zeroed). Makes range queries and indices reliable.
    date: { type: Date, required: true },
    timing: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "Night"],
      required: true,
    },
    status: { type: String, enum: ["Taken", "Missed"], default: "Taken" },
  },
  { timestamps: true }
);

// Prevent duplicates: one log per patient/prescription/medicine/date/timing
medicationLogSchema.index(
  { patient: 1, prescription: 1, medicineName: 1, date: 1, timing: 1 },
  { unique: true, background: true }
);

const MedicationLog = mongoose.model("MedicationLog", medicationLogSchema);
export default MedicationLog;
