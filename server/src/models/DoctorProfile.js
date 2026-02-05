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
    contactNumber: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Optional availability/reference info
    practiceLocation: String,
    notes: String,
  },
  { timestamps: true }
);

const DoctorProfile = mongoose.model("DoctorProfile", doctorProfileSchema);
export default DoctorProfile;
