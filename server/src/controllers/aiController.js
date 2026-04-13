import Groq from "groq-sdk";
import User from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import MedicationLog from "../models/MedicationLog.js";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getPatientFullDetails = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const [patientUser, profile, appointments, prescriptions, logs] =
    await Promise.all([
      User.findById(patientId).select("-password"),
      PatientProfile.findOne({ user: patientId }).populate("assignedWard"),
      Appointment.find({ patient: patientId })
        .sort({ appointmentDate: -1 })
        .populate("doctor", "name"),
      Prescription.find({ patient: patientId }).sort({ createdAt: -1 }),
      MedicationLog.find({
        patient: patientId,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

  if (!patientUser)
    return res.status(404).json({ message: "Patient not found" });

  // --- PRECISE ADHERENCE CALCULATION ---
  let totalExpectedDoses = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  prescriptions.forEach((p) => {
    const start = p.startDate ? new Date(p.startDate) : new Date(p.createdAt);
    start.setHours(0, 0, 0, 0);

    p.medicines.forEach((m) => {
      const diffTime = today - start;
      let daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (m.durationDays) daysElapsed = Math.min(daysElapsed, m.durationDays);

      if (daysElapsed > 0) {
        totalExpectedDoses += daysElapsed * (m.timing?.length || 0);
      }
    });
  });

  const totalTakenDoses = logs.filter((l) => l.status === "Taken").length;
  const adherenceRate =
    totalExpectedDoses > 0
      ? Math.round((totalTakenDoses / totalExpectedDoses) * 100)
      : 0;

  res.json({
    basicDetails: { ...patientUser._doc, ...profile?._doc },
    adherenceRate,
    totalExpectedDoses,
    totalTakenDoses,
    appointments,
    prescriptions: {
      active: prescriptions.filter((p) => p.isActive),
      history: prescriptions.filter((p) => !p.isActive),
    },
  });
});

export const getPatientAiSummary = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // We only fetch the minimal data needed for the prompt
  const [patientUser, appointments, prescriptions, logs] = await Promise.all([
    User.findById(patientId).select("name"),
    Appointment.find({ patient: patientId })
      .sort({ appointmentDate: -1 })
      .limit(3),
    Prescription.find({ patient: patientId }).sort({ createdAt: -1 }).limit(1),
    MedicationLog.find({
      patient: patientId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  if (!patientUser)
    return res.status(404).json({ message: "Patient not found" });

  // Recalculate adherence for AI context (or pass from frontend to save DB hits)
  // Simplified adherence calculation for context
  const totalTakenDoses = logs.filter((l) => l.status === "Taken").length;

  const clinicalHistory = appointments
    .map(
      (appt) =>
        `[${appt.appointmentDate?.toLocaleDateString()}] ${
          appt.diagnosis || "No Diagnosis"
        }: ${appt.notes || "No notes"}`
    )
    .join(" | ");

  const medicineList =
    prescriptions[0]?.medicines.map((m) => m.name).join(", ") || "None";

  try {
    const prompt = `Analyze: Patient ${patientUser.name}. 
    Recent Doses Taken (last 30 days): ${totalTakenDoses}. 
    Clinical History: ${clinicalHistory}. 
    Active Meds: ${medicineList}.
    Provide a 3-sentence professional briefing: 1. Status, 2. Compliance/Risk, 3. Focus for today.`;

    const chat = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a senior medical consultant AI. Provide concise clinical briefings.",
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 300,
    });

    res.json({
      aiSummary: chat.choices[0]?.message?.content || "Analysis complete.",
    });
  } catch (err) {
    console.error("Groq Error:", err);
    res
      .status(500)
      .json({ aiSummary: "AI briefing service currently unavailable." });
  }
});

export const handlePatientQuery = asyncHandler(async (req, res) => {
  // 1. Destructure 'history' from the body
  const { query, history } = req.body;
  const { patientId } = req.params;

  const [patientUser, appointments, prescriptions] = await Promise.all([
    User.findById(patientId).select("name allergies medicalConditions"),
    Appointment.find({ patient: patientId })
      .sort({ appointmentDate: -1 })
      .limit(3),
    Prescription.find({ patient: patientId }).sort({ createdAt: -1 }).limit(1),
  ]);

  if (!patientUser)
    return res.status(404).json({ message: "Patient not found" });

  const clinicalHistory = appointments
    .map(
      (appt) =>
        `[${appt.appointmentDate?.toLocaleDateString()}] ${
          appt.diagnosis || "General"
        }`
    )
    .join(" | ");

  const patientAllergies =
    patientUser.allergies?.length > 0
      ? patientUser.allergies.join(", ")
      : "No known allergies.";

  const systemPrompt = `
    You are "MediGuide," an AI health assistant for ${patientUser.name}.
    CONTEXT: Allergies: ${patientAllergies}. History: ${clinicalHistory}.
    RULES: If user says 'Yes' or 'Sure', look at the chat history to see what they are agreeing to. 
    Keep responses under 4 sentences.
  `;

  // 2. Build the message array with history
  // Format: [{role: "user", content: "..."}, {role: "assistant", content: "..."}]
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...history, // This inserts the previous back-and-forth
    { role: "user", content: query }, // This is the new message (e.g., "Yes")
  ];

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      temperature: 0.4,
    });

    res.status(200).json({
      reply: response.choices[0]?.message?.content,
    });
  } catch (error) {
    res.status(500).json({ reply: "I lost my train of thought. Try again?" });
  }
});
