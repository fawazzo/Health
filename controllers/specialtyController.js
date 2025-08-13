// controllers/specialtyController.js
const Specialty = require('../models/Specialty');
const asyncHandler = require('express-async-handler');

// @desc    Get all specialties
// @route   GET /api/specialties
// @access  Public
const getSpecialties = asyncHandler(async (req, res) => {
    const specialties = await Specialty.find({});
    res.json(specialties);
});

// @desc    Get single specialty by ID
// @route   GET /api/specialties/:id
// @access  Public
const getSpecialtyById = asyncHandler(async (req, res) => {
    const specialty = await Specialty.findById(req.params.id);
    if (specialty) {
        res.json(specialty);
    } else {
        res.status(404).json({ message: 'Specialty not found' });
    }
});

// @desc    Create a specialty
// @route   POST /api/specialties
// @access  Private/Admin
const createSpecialty = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const specialtyExists = await Specialty.findOne({ name });
    if (specialtyExists) {
        return res.status(400).json({ message: 'Specialty with this name already exists' });
    }

    const specialty = new Specialty({ name, description });
    const createdSpecialty = await specialty.save();
    res.status(201).json(createdSpecialty);
});

// @desc    Update a specialty
// @route   PUT /api/specialties/:id
// @access  Private/Admin
const updateSpecialty = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const specialty = await Specialty.findById(req.params.id);

    if (specialty) {
        specialty.name = name || specialty.name;
        specialty.description = description || specialty.description;

        const updatedSpecialty = await specialty.save();
        res.json(updatedSpecialty);
    } else {
        res.status(404).json({ message: 'Specialty not found' });
    }
});

// @desc    Delete a specialty
// @route   DELETE /api/specialties/:id
// @access  Private/Admin
const deleteSpecialty = asyncHandler(async (req, res) => {
    const specialty = await Specialty.findById(req.params.id);

    if (specialty) {
        await specialty.deleteOne();
        res.json({ message: 'Specialty removed' });
    } else {
        res.status(404).json({ message: 'Specialty not found' });
    }
});

module.exports = {
    getSpecialties,
    getSpecialtyById,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty
};