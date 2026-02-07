import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { protect, doctor } from "../middleware/authMiddleware.js";
import { uploadReport } from "../controllers/reportController.js";
import { deleteReport } from "../controllers/reportController.js";

const router = express.Router();
router.post("/", protect, doctor, upload.single("file"), uploadReport);
router.delete("/:id", protect, doctor, deleteReport);

export default router;
