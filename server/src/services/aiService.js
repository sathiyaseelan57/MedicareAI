import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";
import Report from "../models/Report.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getPatientContext = async (patientId) => {
  // 1. Fetch all relevant data in parallel for speed
  const [patient, prescription, logs, reports] = await Promise.all([
    User.findById(patientId),
    Prescription.findOne({ patient: patientId, isActive: true }),
    MedicationLog.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .limit(20),
    Report.find({ patient: patientId }).sort({ createdAt: -1 }).limit(3),
  ]);

  // 2. Format the data into a readable "Story" for the AI
  return {
    profile: {
      name: patient.name,
      age: patient.age,
      allergies: patient.allergies || "None reported",
      conditions: patient.medicalConditions || "None",
    },
    currentTreatment: prescription
      ? prescription.medicines
      : "No active prescription",
    recentHistory: logs.map(
      (log) => `${log.medicineName}: ${log.status} on ${log.date}`
    ),
    labLinks: reports.map((r) => r.fileUrl), // Gemini will use these URLs to "see" the reports
  };
};
