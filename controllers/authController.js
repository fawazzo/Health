// controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // Utility to generate JWT token
const passwordUtils = require('../utils/passwordUtils'); // Utility for password hashing/comparison
const asyncHandler = require('express-async-handler');
const validator = require('../utils/validator'); // For deeper profile validation
const Hospital = require('../models/Hospital'); // <-- ADD THIS LINE
const Pharmacy = require('../models/Pharmacy'); // <-- ADD THIS LINE
const { Types } = require('mongoose'); // For ObjectId checks, though validator might handle it


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { email, password, role, profile } = req.body;

    // Validate profile object based on the role
    let profileValidationResult = { isValid: true }; // Default to true if no specific validation needed

    if (role === 'doctor') {
        profileValidationResult = validator.validateDoctorProfile(profile);
    } else if (role === 'patient') {
        profileValidationResult = validator.validatePatientProfile(profile);
    } else if (role === 'hospital_admin') { // <-- ADDED THIS BLOCK
        profileValidationResult = validator.validateHospitalAdminProfile(profile);
    } else if (role === 'pharmacy_admin') { // <-- ADDED THIS BLOCK
        profileValidationResult = validator.validatePharmacyAdminProfile(profile);
    }
    // Admin role might not need a detailed profile for registration.

    if (!profileValidationResult.isValid) {
        return res.status(400).json({ message: profileValidationResult.message });
    }

    // --- NEW: Additional backend validation for managed IDs ---
    if (role === 'hospital_admin' && profile && profile.managedHospitalId) {
        if (!Types.ObjectId.isValid(profile.managedHospitalId)) {
            return res.status(400).json({ message: 'Invalid Hospital ID format for hospital admin profile.' });
        }
        const hospital = await Hospital.findById(profile.managedHospitalId);
        if (!hospital) {
            return res.status(400).json({ message: 'Hospital specified for hospital admin does not exist.' });
        }
    }

    if (role === 'pharmacy_admin' && profile && profile.managedPharmacyId) {
        if (!Types.ObjectId.isValid(profile.managedPharmacyId)) {
            return res.status(400).json({ message: 'Invalid Pharmacy ID format for pharmacy admin profile.' });
        }
        const pharmacy = await Pharmacy.findById(profile.managedPharmacyId);
        if (!pharmacy) {
            return res.status(400).json({ message: 'Pharmacy specified for pharmacy admin does not exist.' });
        }
    }
    // --- END NEW VALIDATION ---


    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Create user
    const user = await User.create({
        email,
        password,
        role,
        profile: profile || {}, // Ensure profile is an object, even if empty
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data provided.' });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await passwordUtils.comparePasswords(password, user.password);

    if (user && isMatch) {
        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

// @desc    Get authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'User data not found for authenticated session.' });
    }
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};