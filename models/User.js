// models/User.js
const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs'); // REMOVE THIS LINE
const passwordUtils = require('../utils/passwordUtils'); // <-- ADD THIS LINE

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't return password by default on queries
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin', 'hospital_admin', 'pharmacy_admin'],
        default: 'patient',
        required: true
    },
    profile: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// --- Pre-save hook for password hashing ---
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    // Use the utility function
    this.password = await passwordUtils.hashPassword(this.password); // <-- UPDATED
    next();
});

// --- Method to compare passwords ---
userSchema.methods.matchPassword = async function(enteredPassword) {
    // Use the utility function
    return await passwordUtils.comparePasswords(enteredPassword, this.password); // <-- UPDATED
};

// --- Indexes ---
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);