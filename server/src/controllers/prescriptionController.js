import asyncHandler from "express-async-handler";
import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";

// @desc    Create new prescription (and deactivate old one)
// @route   POST /api/prescriptions
// @access  Private/Doctor
export const addPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, medicines, startDate, endDate, notes } =
    req.body;

  // 1. Basic Check
  if (!medicines || medicines.length === 0) {
    res.status(400);
    throw new Error("A prescription must contain at least one medicine");
  }

  // 2. Date Validation - convert to Date objects
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && end && end <= start) {
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

  // 4. Deactivate Old & Create New
  await Prescription.updateMany(
    { patient: patientId, isActive: true },
    { isActive: false }
  );

  const prescription = await Prescription.create({
    patient: patientId,
    doctor: req.user._id,
    appointment: appointmentId,
    medicines,
    startDate: start,
    endDate: end,
    notes,
    isActive: true,
  });

  res.status(201).json(prescription);
});

// @desc    Get active and historical prescriptions for patient
// @route   GET /api/prescriptions/my-checklist
export const getMyPrescriptions = asyncHandler(async (req, res) => {
  // 1. Get the current active one
  const active = await Prescription.findOne({
    patient: req.user._id,
    isActive: true,
  }).populate("doctor", "name specialization").sort({ createdAt: -1 });

  // 2. Get all others (History)
  const history = await Prescription.find({
    patient: req.user._id,
    isActive: false,
  }).populate("doctor", "name").sort({ createdAt: -1 });

  res.json({ active, history });
});

// @desc    Mark a medicine as taken for the day
// @route   POST /api/prescriptions/log
// @access  Private/Patient
export const logMedication = asyncHandler(async (req, res) => {
  const { prescriptionId, medicineName, timing } = req.body;

  // Normalize "today" to midnight UTC-local by zeroing hours - keeps day semantics consistent.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already logged for today to prevent double entries
  const existingLog = await MedicationLog.findOne({
    patient: req.user._id,
    prescription: prescriptionId,
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

// @desc    Calculate medication adherence percentage for the last N days (default 7)
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
  const medsCount = Array.isArray(prescription.medicines)
    ? prescription.medicines.length
    : 0;
  if (medsCount === 0) {
    return res.json({ score: 0, message: "Prescription has no medicines" });
  }
  const totalExpectedDoses = medsCount * daysToTrack;

  // 3. Count how many logs exist for the last N days using the normalized date field
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (daysToTrack - 1));

  const logsCount = await MedicationLog.countDocuments({
    patient: patientId,
    prescription: prescription._id,
    status: "Taken",
    date: { $gte: startDate },
  });

  // 4. Calculate Percentage
  const adherenceRate =
    totalExpectedDoses > 0 ? (logsCount / totalExpectedDoses) * 100 : 0;

  res.json({
    patientId,
    adherenceRate: Math.min(adherenceRate, 100).toFixed(2) + "%",
    totalLogs: logsCount,
    expectedDoses: totalExpectedDoses,
    status: adherenceRate >= 80 ? "Good" : "Needs Attention",
  });
});
