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

  // Normalize appointment date
  const apptDate = appointmentDate ? new Date(appointmentDate) : new Date();
  if (isNaN(apptDate.getTime())) {
    res.status(400);
    throw new Error("Invalid appointment date");
  }

  // If a patient is booking
  if (req.user.role === "PATIENT") {
    // Ensure doctorId provided
    if (!doctorId) {
      res.status(400);
      throw new Error("Please provide a doctorId");
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      res.status(400);
      throw new Error("Invalid doctorId");
    }

    // Prevent same user as doctor and patient
    if (String(req.user._id) === String(doctor._id)) {
      res.status(400);
      throw new Error("Doctor and patient cannot be the same user");
    }

    // In your backend bookAppointment controller
    const appointment = await Appointment.create({
      patient: patientId || req.user._id,
      doctor: doctorId,
      appointmentDate: apptDate,
      status: "Scheduled",
      reason: reason,
      referredBy: req.user.role === "DOCTOR" ? req.user._id : null, // Tracks who made the booking
    });

    res.status(201).json(appointment);
    return;
  }

  // If a doctor is creating the appointment (on behalf of a patient)
  if (req.user.role === "DOCTOR") {
    if (!patientId) {
      res.status(400);
      throw new Error("Please provide a patientId");
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "PATIENT") {
      res.status(400);
      throw new Error("Invalid patientId");
    }

    // Prevent same user
    if (String(req.user._id) === String(patient._id)) {
      res.status(400);
      throw new Error("Doctor and patient cannot be the same user");
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: req.user._id,
      appointmentDate: apptDate,
      status: "Scheduled", // doctor-submitted visit often completed immediately
      reason: reason || "First Consultation / Walk-in",
    });

    // If medicines provided, create prescription and deactivate previous ones
    if (medicines && medicines.length > 0) {
      await Prescription.updateMany(
        { patient: patient._id, isActive: true },
        { isActive: false }
      );

      await Prescription.create({
        patient: patient._id,
        doctor: req.user._id,
        appointment: appointment._id,
        medicines,
        isActive: true,
      });
    }

    res.status(201).json({
      message: "Visit recorded successfully",
      appointment,
    });
    return;
  }

  res.status(403);
  throw new Error("Only patients or doctors can book appointments");
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

  // 1. Manage Prescription Status & Creation
  let savedPrescription = null;
  if (medicines && medicines.length > 0) {
    
    // STEP A: Deactivate all previous prescriptions for this patient
    await Prescription.updateMany(
      { patient: appointment.patient, isActive: true },
      { $set: { isActive: false } }
    );

    // STEP B: Create the new prescription as the ONLY active one
    savedPrescription = await Prescription.create({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointment._id,
      medicines,
      startDate: new Date(),
      isActive: true, // Explicitly set to true
    });
  }

  // 2. Update Appointment
  appointment.status = "Completed";
  appointment.diagnosis = diagnosis;
  appointment.notes = notes;
  appointment.vitalsAtVisit = vitalsAtVisit;
  appointment.followUpDate = followUpDate;
  // Note: Keeping appointmentDate as the original scheduled date is usually better for records, 
  // but if you want to record the actual "completion time", use a separate field like completedAt.
  if (savedPrescription) appointment.prescription = savedPrescription._id;
  await appointment.save();

  // 3. Save Multiple Reports
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

  res.status(200).json({ 
    message: "Consultation finalized and medication updated",
    prescriptionId: savedPrescription ? savedPrescription._id : null 
  });
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

// @desc    Get doctor dashboard - restricted to doctors
// @route   GET /api/appointments/dashboard
// @access  Private/Doctor
export const getDoctorDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== "DOCTOR") {
    res.status(403);
    throw new Error("Not authorized");
  }

  const doctorId = req.user._id;

  // Today's range
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todaysAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: startOfToday, $lte: endOfToday },
  }).populate("patient", "name email");

  res.json({
    date: startOfToday,
    count: todaysAppointments.length,
    appointments: todaysAppointments,
  });
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
