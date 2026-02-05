import axios from "axios";
import expressAsyncHandler from "express-async-handler";

// Helper to turn Cloudinary URL into Base64 for Gemini
async function fileToGenerativePart(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return {
    inlineData: {
      data: Buffer.from(response.data).toString("base64"),
      mimeType: "image/jpeg", // or "application/pdf"
    },
  };
}

export const askMedicalAI = expressAsyncHandler(async (req, res) => {
  const { prompt, mode, reportId } = req.body;
  const context = await getPatientContext(req.user._id);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let parts = [
    { text: `Context: ${JSON.stringify(context)}\nQuestion: ${prompt}` },
  ];

  // If the user is asking about a specific report, we attach it
  if (reportId) {
    const report = await Report.findById(reportId);
    const imagePart = await fileToGenerativePart(report.fileUrl);
    parts.push(imagePart);
  }

  const result = await model.generateContent(parts);
  res.json({ answer: result.response.text() });
});
