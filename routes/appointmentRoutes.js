// routes/appointmentRoutes.js
const express = require('express');
const {
    getAppointments,
    getAppointmentById,
    bookAppointment,
    updateAppointmentStatus,
    addAppointmentNotes
} = require('../controllers/appointmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { bookAppointmentValidation, updateAppointmentStatusValidation } = require('../middleware/validationMiddleware'); // <-- Import here

const router = express.Router();

router.route('/')
    .get(protect, getAppointments)
    .post(protect, authorizeRoles('patient'), bookAppointmentValidation, bookAppointment); // <-- Added validation

router.route('/:id')
    .get(protect, getAppointmentById);

router.route('/:id/status')
    .put(protect, authorizeRoles('patient', 'doctor', 'admin'), updateAppointmentStatusValidation, updateAppointmentStatus); // <-- Added validation

router.route('/:id/notes')
    .put(protect, authorizeRoles('doctor'), addAppointmentNotes); // No specific validation for notes here, but could add body('notes').notEmpty()

module.exports = router;