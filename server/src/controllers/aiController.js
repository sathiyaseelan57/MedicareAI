import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";
import asyncHandler from "express-async-handler";

console.log("Gemini Key Loaded:", process.env.GEMINI_API_KEY);
// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getPatientFullDetails = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // 1. Fetch Core Data
  const [patientUser, profile, appointments, prescriptions, logs] = await Promise.all([
    User.findById(patientId).select("-password"),
    PatientProfile.findOne({ user: patientId }).populate('assignedWard'),
    Appointment.find({ patient: patientId }).sort({ appointmentDate: -1 }).populate('doctor', 'name'),
    Prescription.find({ patient: patientId }).sort({ createdAt: -1 }),
    MedicationLog.find({ 
      patient: patientId, 
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    })
  ]);

  if (!patientUser) return res.status(404).json({ message: "Patient not found" });

  // 2. Calculate Adherence
  const taken = logs.filter(l => l.status === 'TAKEN').length;
  const adherenceRate = logs.length > 0 ? Math.round((taken / logs.length) * 100) : 0;

  // 3. REAL GEMINI INTEGRATION
  let aiSummary = "Summary unavailable.";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      You are a medical AI assistant. Summarize this patient's status for a doctor:
      Patient: ${patientUser.name}, ${profile?.age}yo ${profile?.gender}.
      History: ${profile?.medicalHistory?.map(h => h.condition).join(", ") || "None"}.
      Medications: ${profile?.currentMedications?.map(m => m.name).join(", ") || "None"}.
      Adherence: ${adherenceRate}% in the last 30 days.
      Recent Appointments: ${appointments.slice(0, 2).map(a => a.reason).join("; ")}.
      
      Provide a concise 3-sentence summary: 1. Current Status, 2. Adherence/Risk, 3. Recommended Focus for today's visit.
    `;

    const result = await model.generateContent(prompt);
    aiSummary = result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    aiSummary = "AI service temporarily unavailable for summarization.";
  }

  // 4. Send Response
  res.json({
    basicDetails: {
      ...patientUser._doc,
      ...profile?._doc,
    },
    adherenceRate,
    aiSummary,
    appointments,
    prescriptions: {
      active: prescriptions.filter(p => p.isActive),
      history: prescriptions.filter(p => !p.isActive)
    },
    reports: profile?.medicalHistory || []
  });
});