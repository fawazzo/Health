// controllers/pharmacyController.js
const Pharmacy = require('../models/Pharmacy');
const asyncHandler = require('express-async-handler');

// @desc    Get all pharmacies (with filters/search)
// @route   GET /api/pharmacies
// @access  Public
const getPharmacies = asyncHandler(async (req, res) => {
    const { city, name, latitude, longitude, maxDistance } = req.query;
    let query = {};

    if (city) {
        query.city = { $regex: city, $options: 'i' };
    }
    if (name) {
        query.name = { $regex: name, $options: 'i' };
    }

    // Geospatial query for nearby pharmacies
    if (latitude && longitude && maxDistance) {
        const radiusInMeters = parseFloat(maxDistance) * 1000; // Convert km to meters
        query.location = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                $maxDistance: radiusInMeters
            }
        };
    }

    const pharmacies = await Pharmacy.find(query);
    res.json(pharmacies);
});

// @desc    Get single pharmacy by ID
// @route   GET /api/pharmacies/:id
// @access  Public
const getPharmacyById = asyncHandler(async (req, res) => {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (pharmacy) {
        res.json(pharmacy);
    } else {
        res.status(404).json({ message: 'Pharmacy not found' });
    }
});

// @desc    Create a pharmacy
// @route   POST /api/pharmacies
// @access  Private/Admin
const createPharmacy = asyncHandler(async (req, res) => {
    const { name, address, city, state, zipCode, phoneNumber, website, latitude, longitude, services } = req.body;

    const pharmacyExists = await Pharmacy.findOne({ name });
    if (pharmacyExists) {
        return res.status(400).json({ message: 'Pharmacy with this name already exists' });
    }

    const pharmacy = new Pharmacy({
        name,
        address,
        city,
        state,
        zipCode,
        phoneNumber,
        website,
        location: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)] // [longitude, latitude]
        },
        services
    });

    const createdPharmacy = await pharmacy.save();
    res.status(201).json(createdPharmacy);
});

// @desc    Update a pharmacy
// @route   PUT /api/pharmacies/:id
// @access  Private/Admin, Pharmacy_Admin (future role)
const updatePharmacy = asyncHandler(async (req, res) => {
    const { name, address, city, state, zipCode, phoneNumber, website, latitude, longitude, services } = req.body;

    const pharmacy = await Pharmacy.findById(req.params.id);

    if (pharmacy) {
        pharmacy.name = name || pharmacy.name;
        pharmacy.address = address || pharmacy.address;
        pharmacy.city = city || pharmacy.city;
        pharmacy.state = state || pharmacy.state;
        pharmacy.zipCode = zipCode || pharmacy.zipCode;
        pharmacy.phoneNumber = phoneNumber || pharmacy.phoneNumber;
        pharmacy.website = website || pharmacy.website;
        if (latitude && longitude) {
            pharmacy.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }
        pharmacy.services = services || pharmacy.services;

        const updatedPharmacy = await pharmacy.save();
        res.json(updatedPharmacy);
    } else {
        res.status(404).json({ message: 'Pharmacy not found' });
    }
});

// @desc    Delete a pharmacy
// @route   DELETE /api/pharmacies/:id
// @access  Private/Admin
const deletePharmacy = asyncHandler(async (req, res) => {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (pharmacy) {
        await pharmacy.deleteOne();
        res.json({ message: 'Pharmacy removed' });
    } else {
        res.status(404).json({ message: 'Pharmacy not found' });
    }
});

module.exports = {
    getPharmacies,
    getPharmacyById,
    createPharmacy,
    updatePharmacy,
    deletePharmacy
};