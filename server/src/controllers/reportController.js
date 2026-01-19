// controllers/reportController.js
import Report from "../models/Report.js";
import asyncHandler from "express-async-handler";

export const uploadReport = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, reportName } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error("File upload failed. Please try again.");
  }

  const report = await Report.create({
    patient: patientId,
    doctor: req.user._id,
    appointment: appointmentId,
    reportName,
    fileUrl: req.file.path,
    publicId: req.file.filename,
  });

  res.status(201).json(report);
});

export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  // 1. Remove the file from Cloudinary
  // report.publicId was saved during the upload step
  const cloudinaryRes = await cloudinary.uploader.destroy(report.publicId);

  if (cloudinaryRes.result !== "ok") {
    // Note: 'not found' is also a valid result if it was already gone
    console.log("Cloudinary deletion status:", cloudinaryRes.result);
  }

  // 2. Remove the record from MongoDB
  await report.deleteOne();

  res.json({ message: "Medical report and file permanently deleted" });
});
