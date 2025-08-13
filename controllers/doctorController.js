// controllers/doctorController.js
const User = require('../models/User'); // User model is used for doctors
const Hospital = require('../models/Hospital');
const Specialty = require('../models/Specialty');
const DoctorAvailability = require('../models/DoctorAvailability');
const asyncHandler = require('express-async-handler');

// @desc    Get all doctors (with filters)
// @route   GET /api/doctors
// @access  Public
const getDoctors = asyncHandler(async (req, res) => {
    const { specialty, hospitalId, name, city } = req.query;
    const query = { role: 'doctor' };

    if (specialty) {
        // Find specialty ID
        const specialtyObj = await Specialty.findOne({ name: { $regex: specialty, $options: 'i' } });
        if (specialtyObj) {
            query['profile.specialties'] = specialtyObj.name; // Assuming specialties in profile are strings
        }
    }
    if (hospitalId) {
        query['profile.hospitalAffiliations'] = hospitalId;
    }
    if (name) {
        query['$or'] = [
            { 'profile.firstName': { $regex: name, $options: 'i' } },
            { 'profile.lastName': { $regex: name, $options: 'i' } }
        ];
    }
    // For city, it's more complex as doctor profiles don't directly store city.
    // This would require linking to hospitals in that city, or doctors having a primary clinic address.
    // For simplicity, let's assume if hospitalId is used, it covers the location.
    // A more advanced solution would query hospitals by city and then filter doctors affiliated with those.

    const doctors = await User.find(query)
        .select('-password -isActive') // Don't send password hash or isActive status
        .populate({
            path: 'profile.hospitalAffiliations',
            select: 'name address city'
        }); // Populate hospital details

    res.json(doctors);
});

// @desc    Get a single doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = asyncHandler(async (req, res) => {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' })
        .select('-password -isActive')
        .populate({
            path: 'profile.hospitalAffiliations',
            select: 'name address city'
        });

    if (doctor) {
        res.json(doctor);
    } else {
        res.status(404).json({ message: 'Doctor not found' });
    }
});

// --- Doctor Availability Management ---

// @desc    Create/Update doctor's availability for a specific date and hospital
// @route   POST /api/doctors/availability
// @access  Private/Doctor, Hospital_Admin
const setDoctorAvailability = asyncHandler(async (req, res) => {
    const { hospitalId, date, timeSlots } = req.body;
    const doctorId = req.user._id; // Current authenticated doctor

    if (!hospitalId || !date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
        return res.status(400).json({ message: 'Please provide hospitalId, date, and timeSlots array.' });
    }

    // Optional: Validate if the doctor is affiliated with this hospital
    const doctor = await User.findById(doctorId);
    if (!doctor.profile.hospitalAffiliations.includes(hospitalId)) {
        return res.status(403).json({ message: 'Doctor is not affiliated with this hospital.' });
    }

    const isoDate = new Date(date).setHours(0, 0, 0, 0); // Normalize date to start of day

    const availability = await DoctorAvailability.findOneAndUpdate(
        { doctorId, hospitalId, date: isoDate },
        { $set: { timeSlots, isPublished: true } }, // Default to published when setting
        { new: true, upsert: true, runValidators: true } // Create if not exists, return new doc
    );

    res.status(200).json(availability);
});

// @desc    Get doctor's availability for a specific date and hospital
// @route   GET /api/doctors/:id/availability/:hospitalId/:date
// @access  Public
const getDoctorAvailability = asyncHandler(async (req, res) => {
    const { id: doctorId, hospitalId, date } = req.params;

    const isoDate = new Date(date).setHours(0, 0, 0, 0); // Normalize date

    const availability = await DoctorAvailability.findOne({
        doctorId,
        hospitalId,
        date: isoDate,
        isPublished: true // Only show published schedules to public
    });

    if (availability) {
        res.json(availability);
    } else {
        res.status(404).json({ message: 'Doctor availability not found for this date/hospital' });
    }
});

// @desc    Get doctor's availability for a date range (for their own view)
// @route   GET /api/doctors/my-availability?startDate=...&endDate=...
// @access  Private/Doctor, Hospital_Admin
const getMyAvailability = asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Please provide start and end dates.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include end date fully

    const availabilities = await DoctorAvailability.find({
        doctorId,
        date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(availabilities);
});

// @desc    Toggle publication status of doctor's availability
// @route   PUT /api/doctors/availability/:id/publish
// @access  Private/Doctor, Hospital_Admin
const toggleAvailabilityPublishStatus = asyncHandler(async (req, res) => {
    const { id } = req.params; // DoctorAvailability document ID
    const { isPublished } = req.body;
    const doctorId = req.user._id;

    const availability = await DoctorAvailability.findOne({ _id: id, doctorId }); // Ensure doctor owns this availability

    if (!availability) {
        return res.status(404).json({ message: 'Availability record not found or unauthorized.' });
    }

    if (typeof isPublished !== 'boolean') {
        return res.status(400).json({ message: 'Invalid value for isPublished.' });
    }

    availability.isPublished = isPublished;
    await availability.save();

    res.json({ message: `Availability status updated to ${isPublished ? 'published' : 'draft'}` });
});


module.exports = {
    getDoctors,
    getDoctorById,
    setDoctorAvailability,
    getDoctorAvailability,
    getMyAvailability,
    toggleAvailabilityPublishStatus
};