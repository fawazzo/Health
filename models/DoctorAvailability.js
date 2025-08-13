// models/DoctorAvailability.js
const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    startTime: {
        type: String, // e.g., "09:00", "14:30"
        required: true
    },
    endTime: {
        type: String, // e.g., "09:30", "15:00"
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null
    }
}, { _id: false }); // No _id for sub-documents by default

const doctorAvailabilitySchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        // Ensure only one availability entry per doctor, per hospital, per date
        unique: false // The compound index below ensures uniqueness
    },
    timeSlots: [timeSlotSchema],
    isPublished: { // Doctors/Admins can draft schedules before publishing
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure uniqueness for doctor, hospital, and date
doctorAvailabilitySchema.index({ doctorId: 1, hospitalId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);