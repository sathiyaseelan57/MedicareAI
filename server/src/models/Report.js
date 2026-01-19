// models/Report.js
import mongoose from "mongoose";

const reportSchema = mongoose.Schema(
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
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }, // Linked Context
    reportName: { type: String, required: true },
    fileUrl: { type: String, required: true }, // The Cloudinary URL
    publicId: { type: String, required: true }, // Needed to delete/update the file later
    status: { type: String, enum: ["Pending", "Analyzed"], default: "Pending" },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
