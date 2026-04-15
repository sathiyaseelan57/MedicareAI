import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import { sendReminderSMS } from "./smsService.js";
import PatientProfile from "../models/PatientProfile.js";

// REUSABLE LOGIC
export const sendAllReminders = async () => {
  const tomorrowStart = new Date();
  tomorrowStart.setHours(24, 0, 0, 0);
  const tomorrowEnd = new Date();
  tomorrowEnd.setHours(47, 59, 59, 999);

  // 1. Get all appointments for tomorrow
  const appointments = await Appointment.find({
    appointmentDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
  }).populate("patient"); // This joins the USER schema

  for (const appt of appointments) {
    const userId = appt.patient._id;

    // 2. Now find the PatientProfile linked to this User ID
    const profile = await PatientProfile.findOne({ user: userId });

    if (profile && profile.contactNumber) {
      const patientName = appt.patient.name; // From the User join
      const time = new Date(appt.appointmentDate)
        .toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " at");
      await sendReminderSMS(profile.contactNumber, patientName, time);
    } else {
      console.log(`No profile or number found for ${appt.patient.name}`);
    }
  }
};

// INITIALIZATION FUNCTION
const initCronJobs = () => {
  // 1. Run IMMEDIATELY on app start for testing/demo
  console.log("🚀 Server started: Initial reminder sweep...");
  sendAllReminders();

  // 2. Schedule to run DAILY at 9:00 AM
  cron.schedule("0 9 * * *", () => {
    console.log("Scheduled 9AM run started...");
    sendAllReminders();
  });
};

export default initCronJobs;
