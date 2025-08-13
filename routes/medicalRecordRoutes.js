// routes/medicalRecordRoutes.js
const express = require('express');
const {
    getMedicalRecords,
    getMedicalRecordById,
    uploadMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord
} = require('../controllers/medicalRecordController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Multer for file upload

const router = express.Router();

router.route('/')
    .get(protect, getMedicalRecords)
    .post(protect, authorizeRoles('patient', 'doctor', 'admin'), upload.single('medicalRecordFile'), uploadMedicalRecord); // 'medicalRecordFile' is the field name for the file in the form

router.route('/:id')
    .get(protect, getMedicalRecordById)
    .put(protect, authorizeRoles('patient', 'admin'), updateMedicalRecord) // Doctors can't update metadata, only upload
    .delete(protect, authorizeRoles('patient', 'admin'), deleteMedicalRecord);

module.exports = router;