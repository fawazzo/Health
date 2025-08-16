// models/Specialty.js
const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Specialty name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('Specialty', specialtySchema);