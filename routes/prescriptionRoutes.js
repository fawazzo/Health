// routes/prescriptionRoutes.js
const express = require('express');
const {
    getPrescriptions,
    getPrescriptionById,
    createPrescription,
    updatePrescription,
    deletePrescription
} = require('../controllers/prescriptionController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getPrescriptions)
    .post(protect, authorizeRoles('doctor'), createPrescription);

router.route('/:id')
    .get(protect, getPrescriptionById)
    .put(protect, authorizeRoles('doctor'), updatePrescription)
    .delete(protect, authorizeRoles('admin'), deletePrescription);

module.exports = router;