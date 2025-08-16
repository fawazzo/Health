// models/Hospital.js
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Hospital name is required'],
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    phoneNumber: {
        type: String,
        // UPDATED REGEX: Allows digits, optional '+' at start, spaces, hyphens, and parentheses
        match: [/^\+?[\d\s\-\(\)]{10,20}$/, 'Please enter a valid phone number']
    },
    website: {
        type: String,
        match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 'Please enter a valid URL']
    },
    description: { type: String },
    services: [String], // Array of services offered by the hospital
    departments: [String] // Array of departments
}, {
    timestamps: true
});

// REMOVE THE FOLLOWING DUPLICATE INDEXES based on previous discussion
// hospitalSchema.index({ name: 1 }); // Remove this if unique: true is used in schema
hospitalSchema.index({ city: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);