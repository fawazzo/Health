// controllers/prescriptionController.js
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // To verify doctor role

// @desc    Get all prescriptions for authenticated user (patient/doctor)
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role === 'patient') {
        query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
        query.doctorId = req.user._id;
    } else if (req.user.role === 'admin') {
        // Admin can see all prescriptions
    } else {
        return res.status(403).json({ message: 'Not authorized to view prescriptions.' });
    }

    const prescriptions = await Prescription.find(query)
        .populate('patientId', 'profile.firstName profile.lastName')
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties')
        .populate('appointmentId', 'date startTime'); // Populate relevant appointment details

    res.json(prescriptions);
});

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Owner or Admin)
const getPrescriptionById = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id)
        .populate('patientId', 'profile.firstName profile.lastName')
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties')
        .populate('appointmentId', 'date startTime');

    if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Authorization: Only patient, doctor, or admin involved can view
    const isOwner = prescription.patientId._id.equals(req.user._id) || prescription.doctorId._id.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this prescription.' });
    }

    res.json(prescription);
});

// @desc    Create a new prescription (by doctor)
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = asyncHandler(async (req, res) => {
    const { appointmentId, medications, instructions, validUntil } = req.body;
    const doctorId = req.user._id;

    if (!appointmentId || !medications || !Array.isArray(medications) || medications.length === 0) {
        return res.status(400).json({ message: 'Appointment ID and at least one medication are required.' });
    }

    // 1. Verify appointment and doctor's relation
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || !appointment.doctorId.equals(doctorId)) {
        return res.status(403).json({ message: 'Not authorized to issue prescription for this appointment.' });
    }

    // 2. Ensure only one prescription per appointment (or handle updates if needed)
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
        return res.status(400).json({ message: 'A prescription already exists for this appointment. Use PUT to update it.' });
    }

    // 3. Create prescription
    const prescription = new Prescription({
        appointmentId,
        doctorId,
        patientId: appointment.patientId, // Get patient from the appointment
        medications,
        instructions,
        validUntil
    });

    const createdPrescription = await prescription.save();

    // TODO: Notify patient about new prescription
    // TODO: Update appointment status to reflect prescription issued (optional)

    res.status(201).json(createdPrescription);
});

// @desc    Update a prescription (by doctor)
// @route   PUT /api/prescriptions/:id
// @access  Private/Doctor
const updatePrescription = asyncHandler(async (req, res) => {
    const { medications, instructions, status, pharmacyId, validUntil } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Only the doctor who issued it can update
    if (!prescription.doctorId.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to update this prescription.' });
    }

    if (medications && Array.isArray(medications) && medications.length > 0) prescription.medications = medications;
    if (instructions !== undefined) prescription.instructions = instructions;
    if (status) prescription.status = status;
    if (pharmacyId !== undefined) prescription.pharmacyId = pharmacyId; // Can be null to clear
    if (validUntil) prescription.validUntil = validUntil;

    const updatedPrescription = await prescription.save();
    res.json(updatedPrescription);
});

// @desc    Delete a prescription (Admin only)
// @route   DELETE /api/prescriptions/:id
// @access  Private/Admin
const deletePrescription = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found.' });
    }

    await prescription.deleteOne();
    res.json({ message: 'Prescription removed.' });
});

module.exports = {
    getPrescriptions,
    getPrescriptionById,
    createPrescription,
    updatePrescription,
    deletePrescription
};