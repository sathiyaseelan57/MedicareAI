import asyncHandler from "express-async-handler";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import PatientProfile from "../models/PatientProfile.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";

// @desc    Register a new user (Doctor or Patient)
// @route   POST /api/users
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, code } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  if (role === "DOCTOR" && code !== process.env.AUTHORIZATION_KEY) {
    res.status(400);
    throw new Error("Invalid authorization code");
  }

  // Create the base authentication account
  const user = await User.create({ name, email, password, role });

  if (user) {
    // Initialize their medical profile
    if (user.role === "PATIENT") {
      await PatientProfile.create({
        user: user._id,
      });
    } else if (user.role === "DOCTOR") {
      await DoctorProfile.create({
        user: user._id,
      });
    }

    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message:
        user.role === "PATIENT"
          ? "Patient registered and profile created"
          : user.role === "DOCTOR"
          ? "Doctor registered and profile created"
          : "User registered",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Add Patient
// @route   POST /api/users/add-patient
// @access  Private (Doctor Only)
export const addPatient = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    age,
    gender,
    bloodGroup,
    contactNumber,
    heightCm,
    weightKg,
    currentStatus,
    emergencyContact,
    allergies,
    currentMedications,
  } = req.body;

  // 1. Validation
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User with this email already exists");
  }

  // 2. Create the User Account (Role: PATIENT)
  // We assign the doctor's ID (from req.user) to the patient's assignedDoctor field
  const patientUser = await User.create({
    name,
    email,
    password, // This will be hashed automatically by your pre-save hook
    role: "PATIENT",
    assignedDoctor: req.user._id,
  });

  if (!patientUser) {
    res.status(400);
    throw new Error("Invalid patient user data");
  }

  // 3. Create the Patient Profile (Clinical Data)
  const patientProfile = await PatientProfile.create({
    user: patientUser._id,
    age,
    gender,
    bloodGroup,
    contactNumber,
    heightCm,
    weightKg,
    currentStatus,
    emergencyContact,
    allergies,
    currentMedications,
  });

  // 4. Link the Patient to the Doctor's "myPatients" list
  await User.findByIdAndUpdate(req.user._id, {
    $push: { myPatients: patientUser._id },
  });

  if (patientProfile) {
    res.status(201).json({
      success: true,
      message: "Patient registered and profile created successfully",
      data: {
        _id: patientUser._id,
        name: patientUser.name,
        email: patientUser.email,
        mrn: patientProfile.medicalRecordNumber,
      },
    });
  } else {
    // Cleanup: If profile fails, remove the created user to prevent "ghost" accounts
    await User.findByIdAndDelete(patientUser._id);
    res.status(400);
    throw new Error("Failed to create patient medical profile");
  }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { loginId, password, role } = req.body;

  let authenticatedUser = null;

  // 1. Logic for DOCTOR (Direct check on User collection)
  if (role === "DOCTOR") {
    const user = await User.findOne({ email: loginId }).select("+password");

    if (user && (await user.matchPassword(password))) {
      authenticatedUser = user;
    }
  }

  // 2. Logic for PATIENT (Check Profile first, then User)
  else if (role === "PATIENT") {
    // Find the profile by MRN
    const profile = await PatientProfile.findOne({
      medicalRecordNumber: loginId,
    });

    if (profile) {
      // Find the associated User object using the ID stored in the profile
      // Assuming your profile field is called 'user' or 'userId'
      const user = await User.findById(profile.user).select("+password");

      if (user && (await user.matchPassword(password))) {
        authenticatedUser = user;
      }
    }
  }

  // 3. Final Verification and Response
  if (authenticatedUser) {
    generateToken(res, authenticatedUser._id);

    res.json({
      _id: authenticatedUser._id,
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      // You can also send the MRN back if needed
      mrn: role === "PATIENT" ? loginId : null,
    });
  } else {
    res.status(401);
    throw new Error(
      "Invalid credentials. Please check your MRN/Email and Password."
    );
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

export const getUserProfile = asyncHandler(async (req, res) => {
  let profileData = null;

  if (req.user.role === "DOCTOR") {
    profileData = await DoctorProfile.findOne({ user: req.user._id }).populate("user", "name email role");
  } else if (req.user.role === "PATIENT") {
    profileData = await PatientProfile.findOne({ user: req.user._id }).populate("user", "name email role");
  }

  // If profile doc doesn't exist yet, return basic user info 
  // so the user can still see the page and create their profile
  if (!profileData) {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    // Return a consistent structure
    return res.json({ user, isNewProfile: true });
  }

  res.json(profileData);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 1. Update User Document
  user.name = req.body.user?.name || req.body.name || user.name;
  
  // Only update password if a new one is provided
  if (req.body.password && req.body.password.trim() !== "") {
    user.password = req.body.password; 
  }
  
  const updatedUser = await user.save();

  // 2. Update Profile Document (Doctor or Patient)
  let updatedProfile = null;

  if (user.role === "DOCTOR") {
    updatedProfile = await DoctorProfile.findOneAndUpdate(
      { user: user._id },
      { 
        specialization: req.body.specialization,
        licenseNumber: req.body.licenseNumber,
        contactNumber: req.body.contactNumber,
        practiceLocation: req.body.practiceLocation,
      },
      { new: true, upsert: true }
    );
  } else if (user.role === "PATIENT") {
    updatedProfile = await PatientProfile.findOneAndUpdate(
      { user: user._id },
      { 
        age: req.body.age,
        gender: req.body.gender,
        bloodGroup: req.body.bloodGroup,
        contactNumber: req.body.contactNumber,
        heightCm: req.body.heightCm,
        weightKg: req.body.weightKg,
        emergencyContact: {
          name: req.body.emergencyContact?.name,
          relationship: req.body.emergencyContact?.relationship,
          phone: req.body.emergencyContact?.phone,
        }
      },
      { new: true, upsert: true }
    );
  }

  // 3. Construct flattened response
  res.json({
    ...updatedProfile._doc,
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    }
  });
});

// @desc    Assign a patient to a doctor
// @route   PUT /api/users/assign-patient
// @access  Private/Doctor
export const assignPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.body;

  // Only doctors can assign patients
  if (req.user.role !== "DOCTOR") {
    res.status(403);
    throw new Error("Only doctors can assign patients");
  }

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== "PATIENT") {
    res.status(400);
    throw new Error("Invalid patient id");
  }

  // Update patient's assignedDoctor and doctor's myPatients if not already present
  patient.assignedDoctor = req.user._id;
  await patient.save();

  const doctor = await User.findById(req.user._id);
  if (!doctor.myPatients.map(String).includes(String(patient._id))) {
    doctor.myPatients.push(patient._id);
    await doctor.save();
  }

  res.json({ message: "Patient successfully assigned to doctor" });
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

// @desc    Get all available doctors (for referral/selection)
// @route   GET /api/users/doctors
// @access  Private
export const getDoctorsList = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: "DOCTOR" })
    .select("name email department specialization") // Add relevant fields
    .sort({ name: 1 });

  res.status(200).json(doctors);
});

// @desc    Get all patients (for appointment creation)
// @route   GET /api/users/patients
// @access  Private/Doctor
export const getPatientsList = asyncHandler(async (req, res) => {
  // If you want ALL patients in the system:
  const patients = await User.find({ role: "PATIENT" })
    .select("name email contactNumber")
    .sort({ createdAt: -1 });

  res.status(200).json(patients);
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

export const getPatientDashboard = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const selectedDate = date ? new Date(date) : new Date();
  selectedDate.setHours(0, 0, 0, 0);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // 1. Fetch data as usual
  const lastAppointment = await Appointment.findOne({
    patient: req.user._id,
    status: "Completed",
    followUpDate: { $exists: true }
  }).sort({ appointmentDate: -1 }).populate("doctor", "name");

  const activePrescriptions = await Prescription.find({
    patient: req.user._id,
    isActive: true,
    startDate: { $lte: selectedDate },
    $or: [{ endDate: null }, { endDate: { $gte: selectedDate } }]
  }).populate("doctor", "name");

  const actualLogs = await MedicationLog.find({
    patient: req.user._id,
    date: selectedDate
  });

  // 2. GENERATE VIRTUAL LOGS
  // We combine actual database logs with "Calculated Missed" logs for the UI
  const processedLogs = [];

  activePrescriptions.forEach(presc => {
    presc.medicines.forEach(med => {
      med.timing.forEach(time => {
        const existingLog = actualLogs.find(l => 
          l.medicineName === med.name && l.timing === time
        );

        if (existingLog) {
          processedLogs.push(existingLog);
        } else if (selectedDate < now) {
          // If the date has passed and there's no log, it's VIRTUAL MISSED
          processedLogs.push({
            medicineName: med.name,
            timing: time,
            status: "Missed",
            date: selectedDate,
            isVirtual: true // Flag for frontend
          });
        }
      });
    });
  });

  // 3. ADHERENCE CALCULATION (Fixed)
  // Calculate total doses that SHOULD have been taken from startDate to YESTERDAY
  let totalTaken = await MedicationLog.countDocuments({ 
    patient: req.user._id, 
    status: "Taken" 
  });

  let totalExpected = 0;
  const allUserPrescriptions = await Prescription.find({ patient: req.user._id });

  allUserPrescriptions.forEach(p => {
    const start = new Date(p.startDate);
    start.setHours(0,0,0,0);
    
    // We only count expected doses up to the current moment
    const endCount = (p.endDate && p.endDate < now) ? p.endDate : now;
    const diffDays = Math.max(0, Math.ceil((endCount - start) / (1000 * 60 * 60 * 24)));
    
    p.medicines.forEach(m => {
      totalExpected += (m.timing.length * diffDays);
    });
  });

  res.json({
    nextFollowUp: lastAppointment ? lastAppointment.followUpDate : null,
    assignedDoctor: lastAppointment ? lastAppointment.doctor : null,
    activePrescriptions,
    logs: processedLogs, // Send the combined actual + virtual logs
    adherenceScore: totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 100
  });
});