// controllers/medicalRecordController.js
const MedicalRecord = require('../models/MedicalRecord');
const asyncHandler = require('express-async-handler');
const fs = require('fs'); // Node's file system module for deleting local files
const path = require('path');

// @desc    Get all medical records for authenticated user (patient/doctor/admin)
// @route   GET /api/medicalrecords
// @access  Private
const getMedicalRecords = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role === 'patient') {
        query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
        // Doctors can see records they uploaded or records where access is granted to them
        query = {
            $or: [
                { doctorId: req.user._id },
                { accessGrantedTo: req.user._id }
            ]
        };
    } else if (req.user.role === 'admin') {
        // Admin can see all
    } else {
        return res.status(403).json({ message: 'Not authorized to view medical records.' });
    }

    const records = await MedicalRecord.find(query)
        .populate('patientId', 'profile.firstName profile.lastName email')
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties')
        .populate('accessGrantedTo', 'profile.firstName profile.lastName'); // Populate who can access

    res.json(records);
});

// @desc    Get single medical record by ID
// @route   GET /api/medicalrecords/:id
// @access  Private (Owner or Authorized)
const getMedicalRecordById = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id)
        .populate('patientId', 'profile.firstName profile.lastName email')
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties');

    if (!record) {
        return res.status(404).json({ message: 'Medical record not found.' });
    }

    // Authorization: Patient owner, doctor who uploaded/granted access, or admin
    const isOwner = record.patientId.equals(req.user._id);
    const isUploader = record.doctorId && record.doctorId.equals(req.user._id);
    const hasAccess = record.accessGrantedTo.some(id => id.equals(req.user._id));
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isUploader && !hasAccess && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this medical record.' });
    }

    res.json(record);
});

// @desc    Upload a new medical record
// @route   POST /api/medicalrecords
// @access  Private/Patient, Doctor
const uploadMedicalRecord = asyncHandler(async (req, res) => {
    // `req.file` is available due to multer middleware
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { patientId, title, description, type } = req.body;
    const { _id: uploaderId, role: uploaderRole } = req.user;

    // Determine who the record belongs to and who uploaded it
    let recordPatientId;
    let recordDoctorId = null;

    if (uploaderRole === 'patient') {
        recordPatientId = uploaderId; // Patient uploads their own record
    } else if (uploaderRole === 'doctor') {
        // Doctor uploads for a specific patient
        if (!patientId) {
            fs.unlinkSync(req.file.path); // Delete the uploaded file if patientId is missing
            return res.status(400).json({ message: 'Patient ID is required for doctors uploading records.' });
        }
        recordPatientId = patientId;
        recordDoctorId = uploaderId;
    } else if (uploaderRole === 'admin') {
        // Admin uploads for a specific patient
         if (!patientId) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Patient ID is required for admins uploading records.' });
        }
        recordPatientId = patientId;
    } else {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Unauthorized role for uploading records.' });
    }

    // Basic validation
    if (!title || !type) {
        fs.unlinkSync(req.file.path); // Delete the uploaded file if validation fails
        return res.status(400).json({ message: 'Title and type are required for the medical record.' });
    }

    const record = new MedicalRecord({
        patientId: recordPatientId,
        doctorId: recordDoctorId,
        title,
        description,
        type,
        fileUrl: `/uploads/${req.file.filename}`, // Store path to the uploaded file
        uploadDate: new Date(),
        accessGrantedTo: [recordDoctorId].filter(Boolean) // If doctor uploaded, grant them access by default
    });

    const createdRecord = await record.save();
    res.status(201).json(createdRecord);
});

// @desc    Update a medical record (title, description, access)
// @route   PUT /api/medicalrecords/:id
// @access  Private (Owner or Admin)
const updateMedicalRecord = asyncHandler(async (req, res) => {
    const { title, description, type, accessGrantedTo } = req.body;
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
        return res.status(404).json({ message: 'Medical record not found.' });
    }

    // Authorization: Only patient owner or admin can update metadata (file itself is not updated via PUT)
    const isOwner = record.patientId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to update this medical record.' });
    }

    if (title) record.title = title;
    if (description !== undefined) record.description = description;
    if (type) record.type = type;

    if (accessGrantedTo && Array.isArray(accessGrantedTo)) {
        // Ensure doctors in accessGrantedTo exist and are actual doctors
        const validDoctors = await Promise.all(accessGrantedTo.map(async (docId) => {
            if (!Types.ObjectId.isValid(docId)) return null;
            const user = await User.findById(docId);
            return (user && user.role === 'doctor') ? user._id : null;
        }));
        record.accessGrantedTo = validDoctors.filter(Boolean); // Filter out nulls
    }

    const updatedRecord = await record.save();
    res.json(updatedRecord);
});

// @desc    Delete a medical record
// @route   DELETE /api/medicalrecords/:id
// @access  Private (Owner or Admin)
const deleteMedicalRecord = asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
        return res.status(404).json({ message: 'Medical record not found.' });
    }

    // Authorization: Only patient owner or admin can delete
    const isOwner = record.patientId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to delete this medical record.' });
    }

    // Delete the associated file from local storage
    if (record.fileUrl && record.fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', record.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Error deleting file: ${filePath}`, err);
            });
        }
    }

    await record.deleteOne();
    res.json({ message: 'Medical record and associated file removed.' });
});

module.exports = {
    getMedicalRecords,
    getMedicalRecordById,
    uploadMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord
};