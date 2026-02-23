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
    profileData = await DoctorProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email role"
    );
  } else if (req.user.role === "PATIENT") {
    profileData = await PatientProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email role"
    );
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
        },
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
    },
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

  // 1. Fetch Latest Completed Appointment for Follow-up & Doctor Info
  const lastAppointment = await Appointment.findOne({
    patient: req.user._id,
    status: "Completed",
    followUpDate: { $exists: true },
  })
    .sort({ appointmentDate: -1 })
    .populate("doctor", "name");

  // 2. Fetch Active Prescriptions valid for the selected date
  const activePrescriptions = await Prescription.find({
    patient: req.user._id,
    isActive: true,
    startDate: { $lte: selectedDate },
    $or: [{ endDate: null }, { endDate: { $gte: selectedDate } }],
  }).populate("doctor", "name");

  // 3. Fetch Actual Logs from Database for the selected date
  const actualLogs = await MedicationLog.find({
    patient: req.user._id,
    date: selectedDate,
  });

  // 4. GENERATE VIRTUAL LOGS & MERGE
  const processedLogs = [];

  activePrescriptions.forEach((presc) => {
    presc.medicines.forEach((med) => {
      // Logic: Only show medicine if selectedDate is within its durationDays
      const startDate = new Date(presc.startDate);
      startDate.setHours(0, 0, 0, 0);
      const diffTime = selectedDate - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < med.durationDays) {
        med.timing.forEach((time) => {
          const existingLog = actualLogs.find(
            (l) => l.medicineName === med.name && l.timing === time
          );

          if (existingLog) {
            processedLogs.push(existingLog);
          } else {
            // Determine if it's "Missed" or "Pending" based on date
            const status = selectedDate < now ? "Missed" : "Pending";
            processedLogs.push({
              prescription: presc._id,
              medicineName: med.name,
              timing: time,
              status: status,
              date: selectedDate,
              isVirtual: true, // Frontend can use this to show a greyed out "Pending" or red "Missed"
            });
          }
        });
      }
    });
  });

  // 5. CALCULATE ACCURATE ADHERENCE SCORE
  // (Total Taken Logs) / (Total Expected Doses from StartDate to Today)
  let totalTaken = await MedicationLog.countDocuments({
    patient: req.user._id,
    status: "Taken",
  });

  let totalExpected = 0;
  const allUserPrescriptions = await Prescription.find({
    patient: req.user._id,
  });

  allUserPrescriptions.forEach((p) => {
    const pStart = new Date(p.startDate);
    pStart.setHours(0, 0, 0, 0);

    // Calculate how many days have passed since the prescription started (up to today)
    const endCountDate =
      p.endDate && p.endDate < now ? new Date(p.endDate) : now;
    const daysActive = Math.max(
      0,
      Math.ceil((endCountDate - pStart) / (1000 * 60 * 60 * 24))
    );

    p.medicines.forEach((m) => {
      // Only count days up to the medicine's specific duration
      const actualDoseDays = Math.min(daysActive, m.durationDays);
      totalExpected += m.timing.length * actualDoseDays;
    });
  });

  res.json({
    nextFollowUp: lastAppointment ? lastAppointment.followUpDate : null,
    assignedDoctor: lastAppointment ? lastAppointment.doctor : null,
    activePrescriptions,
    logs: processedLogs,
    adherenceScore:
      totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 100,
    stats: { totalExpected, totalTaken }, // Useful for debugging
  });
});

export const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const now = new Date();

  // 1. Fetch Doctor's User document to get the 'myPatients' list
  // This is more efficient than searching all users for an assignedDoctor ID
  const doctorUser = await User.findById(doctorId).select("myPatients");

  // 2. Fetch Appointments & Populate Patient Profile
  // We need to populate 'patient' (User) and then 'patient profile' (PatientProfile)
  const upcomingAppointments = await Appointment.find({
    doctor: doctorId,
    status: "Scheduled",
    appointmentDate: { $gte: now }
  })
  .sort({ appointmentDate: 1, appointmentTime: 1 })
  .limit(6)
  .populate({
    path: "patient",
    select: "name email",
    populate: {
      path: "patientProfile", // Ensure you have a virtual or ref named this in User model, 
      model: "PatientProfile", // or we manually fetch below if not linked
      select: "age gender currentStatus"
    }
  });

  // 3. Statistical Aggregation
  const [pending, completed] = await Promise.all([
    Appointment.countDocuments({ doctor: doctorId, status: "Scheduled" }),
    Appointment.countDocuments({ doctor: doctorId, status: "Completed" }),
  ]);

  // 4. Fetch Detailed Patient List from Doctor's 'myPatients' array
  // We fetch the PatientProfile directly linked to those users
  const patientProfiles = await PatientProfile.find({
    user: { $in: doctorUser.myPatients }
  })
  .populate("user", "name email createdAt")
  .sort({ createdAt: -1 })
  .limit(8);

  // 5. Clean Data for UI
  const cleanedPatients = patientProfiles.map(profile => ({
    _id: profile.user?._id,
    name: profile.user?.name || "New Patient",
    email: profile.user?.email || "No Email",
    gender: profile.gender || "Not Specified",
    age: profile.age || "—",
    currentStatus: profile.currentStatus?.replace("_", " "),
    createdAt: profile.user?.createdAt
  }));

  res.json({
    stats: {
      pendingConsultations: pending,
      completedConsultations: completed,
      totalUniquePatients: doctorUser.myPatients.length,
    },
    appointments: upcomingAppointments,
    patients: cleanedPatients
  });
});

export const getPatientFullDetails = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // 1. Fetch User & Profile
  const patientUser = await User.findById(patientId).select("-password");
  if (!patientUser) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const profile = await PatientProfile.findOne({ user: patientId })
    .populate('assignedWard', 'name floor');

  // 2. Fetch Appointments (Descending)
  const appointments = await Appointment.find({ patient: patientId })
    .sort({ appointmentDate: -1, appointmentTime: -1 })
    .populate('doctor', 'name specialization');

  // 3. Fetch Prescriptions (Active vs Older)
  const prescriptions = await Prescription.find({ patient: patientId })
    .sort({ createdAt: -1 });

  // 4. Calculate Medication Adherence Log
  // We look at the last 30 days of logs
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await MedicationLog.find({
    patient: patientId,
    date: { $gte: thirtyDaysAgo }
  });

  const totalPossibleDoses = logs.length;
  const takenDoses = logs.filter(log => log.status === 'TAKEN').length;
  const adherencePercentage = totalPossibleDoses > 0 
    ? Math.round((takenDoses / totalPossibleDoses) * 100) 
    : 0;

  // 5. AI Summarization Logic (Placeholder)
  // Constructing a prompt for AI
  const summaryPrompt = `
    Patient Name: ${patientUser.name}, Age: ${profile?.age}, Gender: ${profile?.gender}.
    Medical History: ${profile?.medicalHistory?.map(h => h.condition).join(", ") || 'None'}.
    Recent Appointments: ${appointments.slice(0, 3).map(a => a.reason).join(", ")}.
    Current Medications: ${profile?.currentMedications?.map(m => m.name).join(", ") || 'None'}.
    Adherence: ${adherencePercentage}%.
    Please provide a 3-sentence clinical summary and risk assessment.
  `;

  // For now, we return a simulated AI response. 
  // You can replace this with: const aiSummary = await genAI.generate(summaryPrompt);
  const aiSummary = profile 
    ? `Patient is a ${profile.age}-year-old ${profile.gender} with a history of ${profile.medicalHistory[0]?.condition || 'general checkups'}. Clinical adherence is currently at ${adherencePercentage}%. Recent visits suggest stable progression, but medication compliance should be monitored.`
    : "No sufficient data for AI summarization.";

  res.json({
    basicDetails: {
      name: patientUser.name,
      email: patientUser.email,
      role: patientUser.role,
      ...profile?._doc // Spreads age, gender, bloodGroup, allergies, etc.
    },
    stats: {
      adherencePercentage,
      totalVisits: appointments.length
    },
    aiSummary,
    appointments,
    prescriptions: {
      active: prescriptions.filter(p => p.isActive),
      history: prescriptions.filter(p => !p.isActive)
    },
    reports: profile?.medicalHistory || [] // Or a separate Reports collection if you have one
  });
});