import mongoose from "mongoose";

const medicineSchema = mongoose.Schema({
  name: { type: String, required: true },
  dosage: String, // e.g., "500mg" or "1 tablet"
  timing: {
    type: String,
    enum: ["Morning", "Afternoon", "Evening", "Night"],
    required: true,
  },
  relationToFood: {
    type: String,
    enum: ["Before Food", "After Food", "N/A"],
    default: "After Food",
  },
  durationDays: Number, // e.g., 7
});

const prescriptionSchema = mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    medicines: [medicineSchema], // Multiple medicines handled as embedded docs
    isActive: { type: Boolean, default: true },
    // Persist start and end dates so the controller's validation and UI can rely on them
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String }, // optional free text
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
