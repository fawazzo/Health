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
        match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number']
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

hospitalSchema.index({ name: 1 });
hospitalSchema.index({ city: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);