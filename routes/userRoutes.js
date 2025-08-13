// routes/userRoutes.js
const express = require('express');
const {
    getAllUsers,
    getUserById,
    updateUserProfile,
    deleteUser
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, authorizeRoles('admin'), getAllUsers); // Only admin can get all users

router.route('/:id')
    .get(protect, authorizeRoles('admin', 'patient', 'doctor', 'hospital_admin', 'pharmacy_admin'), getUserById) // Any authenticated user can get a user by ID (with potential future restrictions)
    .put(protect, updateUserProfile) // User can update their own, admin can update any
    .delete(protect, authorizeRoles('admin'), deleteUser); // Only admin can delete users

module.exports = router;