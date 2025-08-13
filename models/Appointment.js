// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
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
        required: true
    },
    startTime: { // e.g., "09:00"
        type: String,
        required: true
    },
    endTime: { // e.g., "09:30"
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['in-person', 'telemedicine'],
        required: true
    },
    status: {
        type: String,
        enum: ['booked', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show'],
        default: 'booked'
    },
    reasonForVisit: {
        type: String,
        required: true
    },
    notes: { // Doctor's notes after consultation
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    consultationFee: {
        type: Number,
        min: 0,
        default: 0
    },
    videoCallLink: { // For telemedicine appointments
        type: String,
        match: [/^(https?:\/\/[^\s$.?#].[^\s]*)$/, 'Please enter a valid URL'],
        default: null
    }
}, {
    timestamps: true
});

appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ hospitalId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);