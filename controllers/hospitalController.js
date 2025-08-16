// controllers/hospitalController.js
const Hospital = require('../models/Hospital');
const asyncHandler = require = require('express-async-handler');
const User = require('../models/User'); // Import User model to access managedHospitalId from profile

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
const getHospitals = asyncHandler(async (req, res) => {
    const hospitals = await Hospital.find({});
    res.json(hospitals);
});

// @desc    Get single hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = asyncHandler(async (req, res) => {
    const hospital = await Hospital.findById(req.params.id);
    if (hospital) {
        res.json(hospital);
    } else {
        res.status(404).json({ message: 'Hospital not found' });
    }
});

// @desc    Create a hospital
// @route   POST /api/hospitals
// @access  Private/Admin
const createHospital = asyncHandler(async (req, res) => {
    const { name, address, city, state, zipCode, phoneNumber, website, description, services, departments } = req.body;

    const hospitalExists = await Hospital.findOne({ name });
    if (hospitalExists) {
        return res.status(400).json({ message: 'Hospital with this name already exists' });
    }

    const hospital = new Hospital({
        name, address, city, state, zipCode, phoneNumber, website, description, services, departments
    });

    const createdHospital = await hospital.save();
    res.status(201).json(createdHospital);
});

// @desc    Update a hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin, Hospital_Admin
const updateHospital = asyncHandler(async (req, res) => {
    const { name, address, city, state, zipCode, phoneNumber, website, description, services, departments } = req.body;

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
        return res.status(404).json({ message: 'Hospital not found' });
    }

    // --- NEW AUTHORIZATION LOGIC FOR HOSPITAL ADMIN ---
    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === 'hospital_admin') {
        // First, verify that the hospital admin has a managedHospitalId in their profile
        // And that the ID matches the hospital they are trying to update
        if (!req.user.profile || !req.user.profile.managedHospitalId || !req.user.profile.managedHospitalId.equals(hospital._id)) {
            return res.status(403).json({ message: 'Not authorized to update this hospital.' });
        }
    }
    // Admin role ('admin') is already authorized by the route middleware
    // No specific check needed here, as they can update any hospital.
    // --- END NEW AUTHORIZATION LOGIC ---


    hospital.name = name || hospital.name;
    hospital.address = address || hospital.address;
    hospital.city = city || hospital.city;
    hospital.state = state || hospital.state;
    hospital.zipCode = zipCode || hospital.zipCode;
    hospital.phoneNumber = phoneNumber || hospital.phoneNumber;
    hospital.website = website || hospital.website;
    hospital.description = description || hospital.description;
    hospital.services = services || hospital.services;
    hospital.departments = departments || hospital.departments;

    const updatedHospital = await hospital.save();
    res.json(updatedHospital);
});

// @desc    Delete a hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
const deleteHospital = asyncHandler(async (req, res) => {
    const hospital = await Hospital.findById(req.params.id);

    if (hospital) {
        await hospital.deleteOne();
        res.json({ message: 'Hospital removed' });
    } else {
        res.status(404).json({ message: 'Hospital not found' });
    }
});

module.exports = {
    getHospitals,
    getHospitalById,
    createHospital,
    updateHospital,
    deleteHospital
};