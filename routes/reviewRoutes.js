// routes/reviewRoutes.js
const express = require('express');
const {
    getDoctorReviews,
    getPatientReviews,
    createReview,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('patient'), createReview);

router.route('/doctor/:doctorId')
    .get(getDoctorReviews); // Publicly accessible to view doctor reviews

router.route('/patient/:patientId')
    .get(protect, authorizeRoles('patient', 'admin'), getPatientReviews);

router.route('/:id')
    .put(protect, authorizeRoles('patient'), updateReview)
    .delete(protect, authorizeRoles('patient', 'admin'), deleteReview);

module.exports = router;