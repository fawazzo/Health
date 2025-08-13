// routes/pharmacyRoutes.js
const express = require('express');
const {
    getPharmacies,
    getPharmacyById,
    createPharmacy,
    updatePharmacy,
    deletePharmacy
} = require('../controllers/pharmacyController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getPharmacies)
    .post(protect, authorizeRoles('admin'), createPharmacy);

router.route('/:id')
    .get(getPharmacyById)
    .put(protect, authorizeRoles('admin', 'pharmacy_admin'), updatePharmacy) // Allow pharmacy admin to update their own in future
    .delete(protect, authorizeRoles('admin'), deletePharmacy);

module.exports = router;