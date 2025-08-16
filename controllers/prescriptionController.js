// controllers/prescriptionController.js
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // To verify doctor role and pharmacy_admin profile

// @desc    Get all prescriptions for authenticated user (patient/doctor/admin/pharmacy_admin)
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = asyncHandler(async (req, res) => {
    let query = {};
    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === 'patient') {
        query.patientId = userId;
    } else if (userRole === 'doctor') {
        query.doctorId = userId;
    } else if (userRole === 'admin') {
        // Admin can see all prescriptions, so no specific query filter is needed here.
    } else if (userRole === 'pharmacy_admin') { // <-- ADDED THIS BLOCK
        // Pharmacy admin can only see prescriptions associated with their managed pharmacy
        if (!req.user.profile || !req.user.profile.managedPharmacyId) {
            return res.status(403).json({ message: "Pharmacy admin profile missing managed pharmacy ID." });
        }
        query.pharmacyId = req.user.profile.managedPharmacyId;
    } else {
        return res.status(403).json({ message: 'Not authorized to view prescriptions.' });
    }

    const prescriptions = await Prescription.find(query)
        .populate('patientId', 'profile.firstName profile.lastName')
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties')
        .populate('appointmentId', 'date startTime') // Populate relevant appointment details
        .populate('pharmacyId', 'name address'); // Populate pharmacy details if available

    res.json(prescriptions);
});

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Owner or Admin or Pharmacy_Admin for their pharmacy)
const getPrescriptionById = asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id)
        .populate('patientId', 'profile.firstName profile.lastName')
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties')
        .populate('appointmentId', 'date startTime')
        .populate('pharmacyId', 'name address'); // Populate pharmacy details if available

    if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Authorization: Only patient, doctor, admin, or pharmacy_admin (for their pharmacy) can view
    const isOwner = prescription.patientId.equals(req.user._id) || prescription.doctorId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    const isPharmacyAdminForThisPrescription = req.user.role === 'pharmacy_admin' &&
                                                 req.user.profile && req.user.profile.managedPharmacyId &&
                                                 prescription.pharmacyId && prescription.pharmacyId.equals(req.user.profile.managedPharmacyId);


    if (!isOwner && !isAdmin && !isPharmacyAdminForThisPrescription) {
        return res.status(403).json({ message: 'Not authorized to view this prescription.' });
    }

    res.json(prescription);
});

// @desc    Create a new prescription (by doctor)
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = asyncHandler(async (req, res) => {
    const { appointmentId, medications, instructions, validUntil, pharmacyId } = req.body; // Added pharmacyId
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
        validUntil,
        pharmacyId: pharmacyId || null // Allow doctor to assign to a pharmacy during creation
    });

    const createdPrescription = await prescription.save();

    // TODO: Trigger notification for patient about new prescription
    // TODO: Trigger notification for pharmacy if assigned a pharmacyId
    // TODO: Update appointment status to reflect prescription issued (optional)

    res.status(201).json(createdPrescription);
});

// @desc    Update a prescription (by doctor or admin or pharmacy_admin)
// @route   PUT /api/prescriptions/:id
// @access  Private/Doctor, Admin, Pharmacy_Admin (for status/pharmacy-specific fields)
const updatePrescription = asyncHandler(async (req, res) => {
    const { medications, instructions, status, pharmacyId, validUntil } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found.' });
    }

    // Authorization:
    const userRole = req.user.role;
    const userId = req.user._id;

    const isDoctorOfPrescription = prescription.doctorId.equals(userId);
    const isAdmin = userRole === 'admin';
    const isPharmacyAdminForThisPrescription = userRole === 'pharmacy_admin' &&
                                                 req.user.profile && req.user.profile.managedPharmacyId &&
                                                 prescription.pharmacyId && prescription.pharmacyId.equals(req.user.profile.managedPharmacyId);

    // Doctors can update medications, instructions, validUntil.
    // Admins can update anything.
    // Pharmacy_admins can update status or pharmacyId for prescriptions assigned to them.
    if (!(isDoctorOfPrescription || isAdmin || isPharmacyAdminForThisPrescription)) {
        return res.status(403).json({ message: 'Not authorized to update this prescription.' });
    }

    // Prevent doctors from changing pharmacyId or status unless explicitly allowed
    // Doctors should primarily manage the medical aspects.
    // Pharmacy admins should manage fulfillment status and potentially assign themselves.
    if (isDoctorOfPrescription) {
        if (status !== undefined || pharmacyId !== undefined) {
            // Doctors are generally not supposed to set status or pharmacyId directly,
            // unless your workflow dictates it. This allows them to update other fields.
        }
        if (medications && Array.isArray(medications) && medications.length > 0) prescription.medications = medications;
        if (instructions !== undefined) prescription.instructions = instructions;
        if (validUntil !== undefined) prescription.validUntil = validUntil;
    }
    else if (isPharmacyAdminForThisPrescription) {
        // Pharmacy admins can update status and potentially assign/unassign to their pharmacy
        if (status) prescription.status = status;
        // Allows pharmacy admin to claim/unclaim this prescription (if it's not already assigned to another)
        // Or confirm it's for their pharmacy by setting pharmacyId to their own managedPharmacyId
        if (pharmacyId !== undefined) {
             // Basic check: only allow if setting to their own ID or clearing
            if (pharmacyId === null || pharmacyId === req.user.profile.managedPharmacyId.toString()) {
                prescription.pharmacyId = pharmacyId;
            } else {
                return res.status(403).json({ message: 'Pharmacy admin can only assign prescriptions to their own pharmacy or nullify.' });
            }
        }
    }
    else if (isAdmin) {
        // Admin can update all fields
        if (medications && Array.isArray(medications) && medications.length > 0) prescription.medications = medications;
        if (instructions !== undefined) prescription.instructions = instructions;
        if (status) prescription.status = status;
        if (pharmacyId !== undefined) prescription.pharmacyId = pharmacyId;
        if (validUntil) prescription.validUntil = validUntil;
    }


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

    // No need for a role check here as the route middleware (routes/prescriptionRoutes.js)
    // already restricts this to 'admin' using authorizeRoles('admin').
    // If you ever remove that middleware, add the check here:
    // if (req.user.role !== 'admin') { return res.status(403).json({ message: 'Not authorized.' }); }


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