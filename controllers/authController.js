// controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // Utility to generate JWT token
const passwordUtils = require('../utils/passwordUtils'); // Utility for password hashing/comparison
const asyncHandler = require('express-async-handler'); // Simple wrapper for async errors to avoid try/catch blocks in every controller

// IMPORTANT: Profile validation based on role is crucial here.
// For a robust system, you'd have more specific validation for each role's profile.
// We'll use the generic validator from utils for demonstration.
const validator = require('../utils/validator'); // For deeper profile validation

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // validationMiddleware will handle basic email, password, and role format.
    // Additional business logic validation for 'profile' object based on 'role'.
    const { email, password, role, profile } = req.body;

    // Validate profile object based on the role
    let profileValidationResult = { isValid: true }; // Default to true if no specific validation needed

    if (role === 'doctor') {
        profileValidationResult = validator.validateDoctorProfile(profile);
    } else if (role === 'patient') {
        profileValidationResult = validator.validatePatientProfile(profile);
    }
    // Add more else if blocks for 'hospital_admin', 'pharmacy_admin' if they have specific profile requirements
    // Admin role might not need a detailed profile for registration.

    if (!profileValidationResult.isValid) {
        return res.status(400).json({ message: profileValidationResult.message });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Create user
    // The password hashing will automatically happen in the User model's pre('save') hook
    const user = await User.create({
        email,
        password,
        role,
        profile: profile || {}, // Ensure profile is an object, even if empty
    });

    if (user) {
        // Successful registration
        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id), // Generate and send JWT token
        });
    } else {
        // This case should ideally be caught by validation or DB errors,
        // but it's a fallback for unexpected issues.
        res.status(400).json({ message: 'Invalid user data provided.' });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    // validationMiddleware handles checking if email and password are provided and formatted correctly.
    const { email, password } = req.body;

    // Check for user by email (explicitly select password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        // Using generic message for security, don't indicate if email or password was wrong
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare passwords using the utility function
    const isMatch = await passwordUtils.comparePasswords(password, user.password);

    if (user && isMatch) {
        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id), // Generate and send JWT token
        });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

// @desc    Get authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    // req.user is populated by the `protect` middleware
    if (req.user) {
        // Return user data (password is already excluded by .select('-password') in protect middleware)
        res.json(req.user);
    } else {
        // This case should ideally not happen if 'protect' middleware works correctly
        res.status(404).json({ message: 'User data not found for authenticated session.' });
    }
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};