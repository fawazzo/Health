// models/Prescription.js
const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g., "10mg", "2 tablets"
    frequency: { type: String, required: true }, // e.g., "Once daily", "Twice a day", "Every 8 hours"
    duration: { type: String, required: true }, // e.g., "7 days", "Until finished"
    notes: { type: String, default: '' } // Specific notes for this medication
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
        unique: true // Usually one prescription per consultation/appointment
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    medications: {
        type: [medicationSchema],
        required: [true, 'At least one medication is required for a prescription']
    },
    instructions: { // General instructions for the patient
        type: String
    },
    status: {
        type: String,
        enum: ['issued', 'sent_to_pharmacy', 'filled', 'archived'],
        default: 'issued'
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        default: null
    },
    validUntil: { // Optional: Date until prescription is valid
        type: Date
    }
}, {
    timestamps: true
});

prescriptionSchema.index({ patientId: 1, issueDate: -1 });
prescriptionSchema.index({ doctorId: 1, issueDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);