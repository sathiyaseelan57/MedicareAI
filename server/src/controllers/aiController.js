import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Prescription from "../models/Prescription.js";

// Initialize Gemini
// Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const askMedicalAI = async (req, res) => {
  try {
    const { prompt, mode } = req.body;
    const userId = req.user._id; // Taken from protect middleware

    // 1. Fetch Patient Context in Parallel for speed
    const [user, reports, prescriptions] = await Promise.all([
      User.findById(userId).select("name allergies medicalConditions"),
      Report.find({ patientId: userId }).sort({ createdAt: -1 }).limit(3),
      Prescription.find({ patientId: userId, isActive: true }),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User context not found" });
    }

    // 2. Format Context into a clean string for the AI
    const medicalContext = `
      Patient Name: ${user.name}
      Known Allergies: ${user.allergies?.join(", ") || "None reported"}
      Medical Conditions: ${
        user.medicalConditions?.join(", ") || "None reported"
      }
      Current Medications: ${
        prescriptions
          .map((p) => p.medicines.map((m) => m.name).join(", "))
          .join(" | ") || "No active prescriptions"
      }
      Recent Lab Reports: ${
        reports.map((r) => r.category).join(", ") || "No reports uploaded"
      }
    `;

    // 3. Define AI Personality based on 'mode'
    const systemInstruction =
      mode === "doctor"
        ? "You are a clinical assistant for doctors. Summarize patient data concisely, highlighting risks and adherence issues."
        : "You are a friendly medical assistant. Use simple language. Always advise consulting a doctor for final decisions.";

    // 4. Initialize Model (1.5-flash is best for speed/cost)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
    });

    // 5. Generate Content
    const fullPrompt = `Context: ${medicalContext}\n\nUser Question: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      success: true,
      answer: text,
    });
  } catch (error) {
    console.error("Gemini AI Error:", error.message);
    res.status(500).json({
      success: false,
      message: "AI service is currently unavailable. Please try again later.",
    });
  }
};
