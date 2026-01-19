import asyncHandler from "express-async-handler";
import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";

// @desc    Create new prescription (and deactivate old one)
// @route   POST /api/prescriptions
// @access  Private/Doctor
export const addPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, medicines, startDate, endDate } = req.body;

  // 1. Basic Check
  if (!medicines || medicines.length === 0) {
    res.status(400);
    throw new Error("A prescription must contain at least one medicine");
  }

  // 2. Date Validation
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    res.status(400);
    throw new Error("End date must be after the start date");
  }

  // 3. Medicine Detail Validation
  const validTimings = ["Morning", "Afternoon", "Evening", "Night"];
  const validFoodRelation = ["Before Food", "After Food", "N/A"];

  for (const med of medicines) {
    if (!validTimings.includes(med.timing)) {
      res.status(400);
      throw new Error(
        `Invalid timing: ${med.timing}. Must be one of ${validTimings.join(
          ", "
        )}`
      );
    }
    if (!validFoodRelation.includes(med.relationToFood)) {
      res.status(400);
      throw new Error(`Invalid food relation for ${med.name}`);
    }
  }

  // 4. Deactivate Old & Create New (Existing logic)
  await Prescription.updateMany(
    { patient: patientId, isActive: true },
    { isActive: false }
  );

  const prescription = await Prescription.create({
    patient: patientId,
    doctor: req.user._id,
    appointment: appointmentId,
    medicines,
    startDate,
    endDate,
    isActive: true,
  });

  res.status(201).json(prescription);
});

// @desc    Get the currently active prescription for the logged-in patient
// @route   GET /api/prescriptions/my-checklist
// @access  Private/Patient
export const getActivePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({
    patient: req.user._id,
    isActive: true,
  }).populate("doctor", "name");

  if (!prescription) {
    return res.json({ message: "No active medications found", medicines: [] });
  }

  res.json(prescription);
});

// @desc    Mark a medicine as taken for the day
// @route   POST /api/prescriptions/log
// @access  Private/Patient
export const logMedication = asyncHandler(async (req, res) => {
  const { prescriptionId, medicineName, timing } = req.body;
  const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD

  // Check if already logged for today to prevent double-clicks
  const existingLog = await MedicationLog.findOne({
    patient: req.user._id,
    medicineName,
    date: today,
    timing,
  });

  if (existingLog) {
    res.status(400);
    throw new Error("Already marked as taken for this timing");
  }

  const log = await MedicationLog.create({
    patient: req.user._id,
    prescription: prescriptionId,
    medicineName,
    date: today,
    timing,
    status: "Taken",
  });

  res.status(201).json(log);
});

// @desc    Calculate medication adherence percentage for the last 7 days
// @route   GET /api/prescriptions/adherence/:patientId
// @access  Private/Doctor
export const getAdherenceScore = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const daysToTrack = 7;

  // 1. Get the current active prescription
  const prescription = await Prescription.findOne({
    patient: patientId,
    isActive: true,
  });
  if (!prescription) {
    return res.json({ score: 0, message: "No active prescription found" });
  }

  // 2. Calculate how many doses SHOULD have been taken
  // (Number of meds in prescription) * (days)
  const totalExpectedDoses = prescription.medicines.length * daysToTrack;

  // 3. Count how many logs exist for the last 7 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToTrack);

  const logsCount = await MedicationLog.countDocuments({
    patient: patientId,
    prescription: prescription._id,
    status: "Taken",
    createdAt: { $gte: startDate },
  });

  // 4. Calculate Percentage
  const adherenceRate = (logsCount / totalExpectedDoses) * 100;

  res.json({
    patientId,
    adherenceRate: Math.min(adherenceRate, 100).toFixed(2) + "%",
    totalLogs: logsCount,
    expectedDoses: totalExpectedDoses,
    status: adherenceRate >= 80 ? "Good" : "Needs Attention",
  });
});
