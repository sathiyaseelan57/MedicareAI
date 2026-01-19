import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import PatientProfile from "../models/PatientProfile.js";
import DoctorProfile from "../models/DoctorProfile.js";

// @desc    Register a new user (Doctor or Patient)
// @route   POST /api/users
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create the base authentication account
  const user = await User.create({ name, email, password, role });

  if (user) {
    // Initialize their medical profile
    if (user.role === "PATIENT") {
      await PatientProfile.create({
        user: user._id,
      });
    }

    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      role: user.role,
      message:
        user.role === "PATIENT"
          ? "Patient registered and profile created"
          : "User registered",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email }).select("+password");
  console.log(user);
  // 2. Check if user exists AND password matches
  if (user && (await user.matchPassword(password))) {
    // 3. Issue the secure cookie
    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    // 4. If something is wrong, send a 401 (Unauthorized)
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Logout - delete the cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), // Set expiration to the past to delete it
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  let profile;
  // console.log(req);
  if (req.user.role === "DOCTOR") {
    profile = await DoctorProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email"
    );
  } else if (req.user.role === "PATIENT") {
    profile = await PatientProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email"
    );
    console.log(profile);
  } else {
    // For ADMIN or other roles without a profile table
    return res.json(req.user);
  }

  if (profile) {
    res.json(profile);
  } else {
    res.status(404);
    throw new Error("Profile not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // 1. Update Core User Data
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password; // Middleware will hash this automatically
    }
    const updatedUser = await user.save();

    // 2. Update Role-Specific Profile Data
    if (user.role === "PATIENT") {
      await PatientProfile.findOneAndUpdate(
        { user: user._id },
        {
          bloodGroup: req.body.bloodGroup,
          emergencyContact: req.body.emergencyContact,
        },
        { new: true }
      );
    } else if (user.role === "DOCTOR") {
      await DoctorProfile.findOneAndUpdate(
        { user: user._id },
        {
          specialization: req.body.specialization,
          licenseNumber: req.body.licenseNumber,
        },
        { new: true }
      );
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      message: "Profile updated successfully",
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Assign a patient to a doctor
// @route   PUT /api/users/assign-patient
// @access  Private/Doctor
export const assignPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.body;
  const doctorId = req.user._id;

  // 1. Update the Patient's assignedDoctor field
  const patient = await User.findByIdAndUpdate(
    patientId,
    { assignedDoctor: doctorId },
    { new: true }
  );

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // 2. Add the Patient to the Doctor's myPatients array (if not already there)
  await User.findByIdAndUpdate(
    doctorId,
    { $addToSet: { myPatients: patientId } } // $addToSet prevents duplicates
  );

  res.json({
    message: "Patient assigned successfully",
    patientName: patient.name,
    doctorName: req.user.name,
  });
});

// @desc    Get all patients assigned to the logged-in doctor
// @route   GET /api/users/my-patients
// @access  Private/Doctor
export const getMyPatients = asyncHandler(async (req, res) => {
  const doctor = await User.findById(req.user._id).populate(
    "myPatients",
    "name email createdAt"
  );

  res.json(doctor.myPatients);
});

// @desc    Get patient's full medical status (Doctor, Appt, Meds)
// @route   GET /api/users/my-status
// @access  Private/Patient
export const getMyStatus = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  // 1. Get Assigned Doctor
  const patient = await User.findById(patientId).populate(
    "assignedDoctor",
    "name email"
  );

  // 2. Get Today's Appointment
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayAppointment = await Appointment.findOne({
    patient: patientId,
    appointmentDate: { $gte: startOfToday, $lte: endOfToday },
    status: "Scheduled",
  }).populate("doctor", "name");

  // 3. Get Active Prescription & Checklist
  const activePrescription = await Prescription.findOne({
    patient: patientId,
    isActive: true,
  }).populate("doctor", "name");

  // Send everything back in one go
  res.json({
    doctor: patient.assignedDoctor || "No doctor assigned yet",
    appointment: todayAppointment || "No appointment today",
    prescription: activePrescription || "No active medications",
  });
});
