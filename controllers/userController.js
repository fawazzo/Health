// controllers/userController.js
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Update user profile (Patient/Doctor/Admin)
// @route   PUT /api/users/:id
// @access  Private (User specific or Admin)
const updateUserProfile = asyncHandler(async (req, res) => {
    const { email, profile, isActive } = req.body;
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Authorization: A user can only update their own profile, unless they are an admin.
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this user profile.' });
    }

    // Update fields
    if (email) user.email = email;
    if (profile) user.profile = { ...user.profile, ...profile }; // Merge profile changes

    // Only admin can change isActive status
    if (req.user.role === 'admin' && typeof isActive === 'boolean') {
        user.isActive = isActive;
    }

    // TODO: Add more specific validation based on user role for profile updates.
    // For example, a patient can't update a doctor's license number.

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        profile: updatedUser.profile,
        isActive: updatedUser.isActive,
    });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne(); // Mongoose 6+ uses deleteOne() or deleteMany()
    res.json({ message: 'User removed' });
});

module.exports = {
    getAllUsers,
    getUserById,
    updateUserProfile,
    deleteUser
};