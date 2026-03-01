import asyncHandler from "express-async-handler";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Prescription from "../models/Prescription.js";
import Report from "../models/Report.js";

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (Patient or Doctor)
// Notes:
// - If a patient books: req.user must be PATIENT, provide doctorId and appointmentDate.
// - If a doctor books (on behalf of a patient): req.user must be DOCTOR and provide patientId.
export const bookAppointment = asyncHandler(async (req, res) => {
  const {
    doctorId,
    patientId,
    appointmentDate,
    reason,
    medicines,
  } = req.body;

  const apptDate = appointmentDate ? new Date(appointmentDate) : new Date();
  if (isNaN(apptDate.getTime())) {
    res.status(400);
    throw new Error("Invalid appointment date");
  }

  let finalPatientId;
  let finalDoctorId;

  // Role-based logic to determine participants
  if (req.user.role === "PATIENT") {
    finalPatientId = req.user._id;
    finalDoctorId = doctorId; // Passed from frontend (their assigned doctor)
  } else if (req.user.role === "ADMIN" || req.user.role === "DOCTOR") {
    if (!patientId || !doctorId) {
      res.status(400);
      throw new Error("Admin/Doctor must provide both patientId and doctorId");
    }
    finalPatientId = patientId;
    finalDoctorId = doctorId;
  } else {
    res.status(403);
    throw new Error("Unauthorized to book appointments");
  }

  // Validation: Check if doctor exists
  const doctor = await User.findById(finalDoctorId);
  if (!doctor || doctor.role !== "DOCTOR") {
    res.status(400);
    throw new Error("Valid Doctor ID is required");
  }

  const appointment = await Appointment.create({
    patient: finalPatientId,
    doctor: finalDoctorId,
    appointmentDate: apptDate,
    status: "Scheduled",
    reason: reason || "Standard Consultation",
    referredBy: req.user._id, // Track who created the record
  });

  // Handle Prescription (Doctor only)
  if (req.user.role === "DOCTOR" && medicines?.length > 0) {
    await Prescription.updateMany(
      { patient: finalPatientId, isActive: true },
      { isActive: false }
    );
    await Prescription.create({
      patient: finalPatientId,
      doctor: req.user._id,
      appointment: appointment._id,
      medicines,
      isActive: true,
    });
  }

  res.status(201).json(appointment);
});

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = asyncHandler(async (req, res) => {
  // 1. Fetch the appointment with explicit population
  const appointment = await Appointment.findById(req.params.id)
    .populate({
      path: "patient",
      select: "name email gender age"
    })
    .populate({
      path: "doctor",
      select: "name email specialization"
    })
    .populate({
      path: "prescription",
      model: "Prescription", // Explicitly naming the model helps if registration is delayed
    });

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // 2. Fetch Reports manually using the appointment ID
  // This is the most reliable way since the Report model already has 'appointment' field
  const reports = await Report.find({ appointment: req.params.id }).lean();

  // 3. Manually construct the response to ensure nothing is stripped out
  // We use .toObject() or ._doc to get the raw data from the Mongoose document
  const appointmentData = appointment.toObject();

  res.status(200).json({
    ...appointmentData,
    reports: reports || [], // Inject the reports array here
  });
});

// @desc    Get list of appointments for logged-in user with full clinical details
// @route   GET /api/appointments
// @access  Private
export const getMyAppointments = asyncHandler(async (req, res) => {
  let query = {};

  // Define filter based on role
  if (req.user.role === "DOCTOR") {
    query = { doctor: req.user._id };
  } else if (req.user.role === "PATIENT") {
    query = { patient: req.user._id };
  }

  // Fetch appointments with deep population
  const appointments = await Appointment.find(query)
    .populate("patient", "name email gender age") // Basic patient info
    .populate("doctor", "name email specialization") // Basic doctor info
    .populate({
      path: "prescription", // Populate the Prescription model
      populate: {
        path: "medicines", // If medicines is a sub-document or ref, it gets pulled
      }
    })
    .populate("reports") // Populate the array of Reports
    .sort({ appointmentDate: -1 });

  res.json(appointments);
});

// @desc    Complete Consultation
// @route   PUT /api/appointments/:id/complete
export const completeConsultation = asyncHandler(async (req, res) => {
  const { 
    diagnosis, notes, vitalsAtVisit, followUpDate,
    medicines, reports 
  } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // 1. Calculate the Prescription End Date
  // We take the medicine with the longest duration to set the overall expiry
  let maxDuration = 0;
  if (medicines && medicines.length > 0) {
    maxDuration = Math.max(...medicines.map(m => m.durationDays || 0));
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + maxDuration);

  // 2. Manage Prescription Status
  let savedPrescription = null;
  if (medicines && medicines.length > 0) {
    // Deactivate old meds
    await Prescription.updateMany(
      { patient: appointment.patient, isActive: true },
      { $set: { isActive: false } }
    );

    // Create new active prescription
    savedPrescription = await Prescription.create({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointment._id,
      medicines,
      startDate,
      endDate: followUpDate ? new Date(followUpDate) : endDate, // Use follow-up or max duration
      isActive: true,
    });
  }

  // 3. Update Appointment
  appointment.status = "Completed";
  appointment.diagnosis = diagnosis;
  appointment.notes = notes;
  appointment.vitalsAtVisit = vitalsAtVisit;
  appointment.followUpDate = followUpDate;
  if (savedPrescription) appointment.prescription = savedPrescription._id;
  await appointment.save();

  // 4. Handle Reports
  if (reports && reports.length > 0) {
    const reportDocs = reports.map(rep => ({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointment._id,
      reportName: rep.reportName,
      fileUrl: rep.fileUrl,
      publicId: rep.publicId,
      status: "Analyzed" 
    }));
    await Report.insertMany(reportDocs);
  }

  res.status(200).json({ message: "Consultation finalized. Prescription active until follow-up." });
});

// @desc    Update appointment status/notes (Doctor only)
// @route   PUT /api/appointments/:id
// @access  Private/Doctor
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Only assigned doctor can update
  if (String(appointment.doctor) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You are not authorized to update this appointment");
  }

  appointment.status = status || appointment.status;
  appointment.notes = notes || appointment.notes;

  const updatedAppointment = await appointment.save();
  res.json(updatedAppointment);
});

// @desc    Get appointments within a specific date range (Doctor only)
// @route   GET /api/appointments/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private/Doctor
export const getAppointmentsByRange = asyncHandler(async (req, res) => {
  if (req.user.role !== "DOCTOR") {
    res.status(403);
    throw new Error("Not authorized");
  }

  const { start, end } = req.query;

  // Logic: If no dates provided, maybe default to "This Month"
  // but for now, we'll keep your requirement for providing dates.
  if (!start || !end) {
    res.status(400);
    throw new Error("Please provide both start and end dates");
  }

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctor: req.user._id,
    appointmentDate: { $gte: startDate, $lte: endDate },
  })
    .sort({ appointmentDate: -1 }) // -1 gives you Newest First
    .populate({
      path: "patient",
      select: "name email",
      // If you want clinical details from the PatientProfile model:
      // populate: { path: "profile", select: "age gender mrn" }
    });

  res.json(appointments);
});

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Patient or Doctor)
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Authorization check: Only the patient or doctor involved can cancel
    if (
      appointment.patientId.toString() !== req.user._id.toString() &&
      appointment.doctorId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to cancel this appointment" });
    }

    // Update status instead of deleting
    appointment.status = "Cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
