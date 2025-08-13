// routes/specialtyRoutes.js
const express = require('express');
const {
    getSpecialties,
    getSpecialtyById,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty
} = require('../controllers/specialtyController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getSpecialties)
    .post(protect, authorizeRoles('admin'), createSpecialty);

router.route('/:id')
    .get(getSpecialtyById)
    .put(protect, authorizeRoles('admin'), updateSpecialty)
    .delete(protect, authorizeRoles('admin'), deleteSpecialty);

module.exports = router;