// models/Pharmacy.js
const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Pharmacy name is required'],
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
    location: { // GeoJSON Point for location-based queries
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: { // [longitude, latitude]
            type: [Number],
            required: true
        }
    },
    services: [String] // e.g., "Delivery", "24/7", "Vaccinations"
}, {
    timestamps: true
});

// REMOVE THE FOLLOWING DUPLICATE INDEXES based on previous discussion
// pharmacySchema.index({ name: 1 }); // Remove this if unique: true is used in schema
pharmacySchema.index({ city: 1 });
pharmacySchema.index({ location: '2dsphere' }); // For geospatial queries

module.exports = mongoose.model('Pharmacy', pharmacySchema);