// routes/hospitalRoutes.js
const express = require('express');
const {
    getHospitals,
    getHospitalById,
    createHospital,
    updateHospital,
    deleteHospital
} = require('../controllers/hospitalController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getHospitals) // Publicly accessible to view hospitals
    .post(protect, authorizeRoles('admin'), createHospital); // Only admin can create

router.route('/:id')
    .get(getHospitalById) // Publicly accessible to view single hospital
    .put(protect, authorizeRoles('admin'), updateHospital) // Only admin can update
    .delete(protect, authorizeRoles('admin'), deleteHospital); // Only admin can delete

module.exports = router;