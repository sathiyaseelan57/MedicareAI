// controllers/reportController.js
import Report from "../models/Report.js";
import asyncHandler from "express-async-handler";

// @desc    Get logged in patient's reports
// @route   GET /api/reports/my-reports
// @access  Private/Patient
export const getMyReports = asyncHandler(async (req, res) => {
  // Find reports where the 'patient' field matches the logged-in user's ID
  const reports = await Report.find({ patient: req.user._id })
    .populate("doctor", "name email") // Get doctor name and email only
    .populate("appointment", "appointmentDate status") // Get basic appointment info
    .sort({ createdAt: -1 }); // Newest first (Descending)

  if (reports) {
    res.json(reports);
  } else {
    res.status(404);
    throw new Error("No reports found");
  }
});