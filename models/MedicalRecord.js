// models/MedicalRecord.js
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    doctorId: { // Doctor who uploaded it (optional, patient can also upload)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    title: {
        type: String,
        required: [true, 'Record title is required'],
        trim: true
    },
    description: {
        type: String
    },
    type: { // e.g., 'lab_result', 'imaging_scan', 'consultation_note', 'other'
        type: String,
        enum: ['lab_result', 'imaging_scan', 'consultation_note', 'prescription_copy', 'other'],
        required: true
    },
    fileUrl: { // Path to the uploaded file
        type: String,
        required: [true, 'File URL is required']
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    // For patient to manage who can view their records
    accessGrantedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

medicalRecordSchema.index({ patientId: 1, uploadDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);