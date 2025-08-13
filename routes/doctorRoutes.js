// routes/doctorRoutes.js
const express = require('express');
const {
    getDoctors,
    getDoctorById,
    setDoctorAvailability,
    getDoctorAvailability,
    getMyAvailability,
    toggleAvailabilityPublishStatus
} = require('../controllers/doctorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Public doctor routes
router.route('/')
    .get(getDoctors);

router.route('/:id')
    .get(getDoctorById);

// Public doctor availability (to find available slots for booking)
router.route('/:id/availability/:hospitalId/:date')
    .get(getDoctorAvailability);

// Doctor/Admin specific availability management
router.route('/availability')
    .post(protect, authorizeRoles('doctor', 'hospital_admin'), setDoctorAvailability);

router.route('/my-availability')
    .get(protect, authorizeRoles('doctor', 'hospital_admin'), getMyAvailability);

router.route('/availability/:id/publish')
    .put(protect, authorizeRoles('doctor', 'hospital_admin'), toggleAvailabilityPublishStatus);


module.exports = router;