// controllers/appointmentController.js
import asyncHandler from "express-async-handler";
import Appointment from "../models/Appointment.js";
import Leave from "../models/Leave.js";

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private/Patient
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, reason } = req.body;

  // 1. Convert the input date to a proper Date object
  const requestedDate = new Date(appointmentDate);

  // Inside bookAppointment
  const patient = await User.findById(req.user._id);

  if (
    patient.assignedDoctor &&
    patient.assignedDoctor.toString() !== doctorId
  ) {
    res.status(400);
    throw new Error("You can only book appointments with your assigned doctor");
  }

  // 2. CHECK: Is the Doctor on leave?
  const onLeave = await Leave.findOne({
    doctor: doctorId,
    startDate: { $lte: requestedDate },
    endDate: { $gte: requestedDate },
    status: "Approved",
  });

  if (onLeave) {
    res.status(400);
    throw new Error(
      `Doctor is on leave during this date/time ${appointmentDate}`
    );
  }

  // 3. CHECK: Is there a double-booking conflict?
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: requestedDate,
    status: "Scheduled", // Only care about active bookings
  });

  if (existingAppointment) {
    res.status(400);
    throw new Error("This time slot is already booked");
  }

  // 4. Create the appointment
  const appointment = await Appointment.create({
    patient: req.user._id, // From protect middleware
    doctor: doctorId,
    appointmentDate: requestedDate,
    reason,
  });

  res.status(201).json(appointment);
});

// @desc    Get appointment
// @route   GET /api/appointments
// @access  Private
export const getMyAppointments = asyncHandler(async (req, res) => {
  let appointments;

  if (req.user.role === "DOCTOR") {
    // Doctors see appointments where they are the 'doctor'
    appointments = await Appointment.find({ doctor: req.user._id }).populate(
      "patient",
      "name email"
    );
  } else {
    // Patients see appointments where they are the 'patient'
    appointments = await Appointment.find({ patient: req.user._id }).populate(
      "doctor",
      "name email"
    );
  }

  res.json(appointments);
});

// @desc    Update appointment status/notes
// @route   PUT /api/appointments/:id
// @access  Private/Doctor
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  console.log(status, notes);

  const appointment = await Appointment.findById(req.params.id);

  if (appointment) {
    // 1. Security check: Only the assigned doctor can update this
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to update this appointment");
    }

    // 2. Update fields
    appointment.status = status || appointment.status;
    appointment.notes = notes || appointment.notes;

    const updatedAppointment = await appointment.save();
    res.json(updatedAppointment);
  } else {
    res.status(404);
    throw new Error("Appointment not found");
  }
});

// @desc    Get doctor dashboard
// @route   GET /api/appointments/:id
// @access  Private/Doctor
export const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  // 1. Get Today's Date Range (00:00:00 to 23:59:59)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 2. Count Today's Appointments
  const todayCount = await Appointment.countDocuments({
    doctor: doctorId,
    appointmentDate: { $gte: startOfToday, $lte: endOfToday },
    status: "Scheduled",
  });

  // 3. Count Pending Appointments (All time)
  const pendingCount = await Appointment.countDocuments({
    doctor: doctorId,
    status: "Scheduled",
  });

  // 4. Get Unique Patient Count
  // .distinct() returns an array of unique IDs
  const uniquePatients = await Appointment.distinct("patient", {
    doctor: doctorId,
  });

  // 5. Get the Next Upcoming Appointment
  const nextAppointment = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: { $gte: new Date() },
    status: "Scheduled",
  })
    .sort({ appointmentDate: 1 }) // Closest to now
    .populate("patient", "name email");

  res.json({
    todayCount,
    pendingCount,
    totalUniquePatients: uniquePatients.length,
    nextAppointment,
  });
});

// @desc    Get appointments within a specific date range
// @route   GET /api/appointments/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private/Doctor
export const getAppointmentsByRange = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const doctorId = req.user._id;

  if (!start || !end) {
    res.status(400);
    throw new Error("Please provide both start and end dates");
  }

  // Set the time to start of day for 'start' and end of day for 'end'
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ appointmentDate: 1 }) // Chronological order
    .populate("patient", "name email");

  res.json({
    count: appointments.length,
    appointments,
  });
});

// @desc    Patient cancels their own appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private/Patient
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (appointment) {
    // Security: Is this the patient who booked it?
    if (appointment.patient.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Not authorized to cancel this appointment");
    }

    appointment.status = "Cancelled";
    await appointment.save();
    res.json({ message: "Appointment cancelled successfully" });
  } else {
    res.status(404);
    throw new Error("Appointment not found");
  }
});

export const createInstantVisit = asyncHandler(async (req, res) => {
  const { patientId, diagnosis, treatmentPlan, medicines } = req.body;

  // 1. Create the Appointment (Marked as Completed immediately)
  const appointment = await Appointment.create({
    patient: patientId,
    doctor: req.user._id, // The logged-in doctor
    appointmentDate: new Date(),
    status: "Completed",
    diagnosis,
    treatmentPlan,
    reason: "First Consultation / Walk-in",
  });

  // 2. Create the Prescription linked to this new appointment
  if (medicines && medicines.length > 0) {
    // Deactivate old ones just in case
    await Prescription.updateMany(
      { patient: patientId, isActive: true },
      { isActive: false }
    );

    await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
      appointment: appointment._id,
      medicines,
      isActive: true,
    });
  }

  res.status(201).json({
    message: "First visit recorded successfully",
    appointment,
  });
});
