import express from "express";
const router = express.Router();
import upload from "../middleware/uploadMiddleware.js";
import { protect, doctor } from "../middleware/authMiddleware.js";
import { uploadReport } from "../controllers/reportController.js";
import { deleteReport } from "../controllers/reportController.js";

router.post("/", protect, doctor, upload.single("file"), uploadReport);
router.delete("/:id", protect, doctor, deleteReport);

export default router;
