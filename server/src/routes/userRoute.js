import express from 'express';
import { registerUser } from '../controllers/userController.js';

const router = express.Router();

// This maps to POST /api/users
router.post('/', registerUser);

export default router;