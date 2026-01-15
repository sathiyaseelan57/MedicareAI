import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      default: "General Physician",
    },
    licenseNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DoctorProfile", doctorProfileSchema);
