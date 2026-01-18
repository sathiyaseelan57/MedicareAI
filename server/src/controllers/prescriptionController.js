import asyncHandler from 'express-async-handler';
import Prescription from '../models/Prescription.js';

// @desc    Create new prescription (and deactivate old one)
// @route   POST /api/prescriptions
// @access  Private/Doctor
export const addPrescription = asyncHandler(async (req, res) => {
    const { patientId, appointmentId, medicines } = req.body;

    if (!medicines || medicines.length === 0) {
        res.status(400);
        throw new Error('No medicines provided');
    }

    // 1. Core Logic: Deactivate any existing active prescription for this patient
    await Prescription.updateMany(
        { patient: patientId, isActive: true },
        { isActive: false }
    );

    // 2. Create the new prescription with multiple medicines
    const prescription = await Prescription.create({
        patient: patientId,
        doctor: req.user._id,
        appointment: appointmentId,
        medicines // Expects an array of objects
    });

    res.status(201).json(prescription);
});

// @desc    Get the currently active prescription for the logged-in patient
// @route   GET /api/prescriptions/my-checklist
// @access  Private/Patient
export const getActivePrescription = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findOne({
        patient: req.user._id,
        isActive: true
    }).populate('doctor', 'name');

    if (!prescription) {
        return res.json({ message: "No active medications found", medicines: [] });
    }

    res.json(prescription);
});