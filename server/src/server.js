import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// 1. LOAD DOTENV FIRST (Before anything else)
dotenv.config(); 

// 2. DEBUG LOG (Check if key is visible to the process immediately)
console.log("-----------------------------------------");
console.log("Environment Check:");
console.log("PORT:", process.env.PORT);
console.log("Gemini Key Exists:", process.env.GEMINI_API_KEY ? "✅ YES" : "❌ NO");
console.log("-----------------------------------------");

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoute.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import morgan from "morgan"; // Ensure this is imported!

// Initialize DB
connectDB();

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is healthy" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));