// utils/validator.js
const { isValidObjectId } = require('mongoose').Types;

const validator = {
    // Checks if a string is a valid MongoDB ObjectId
    isMongoId: (id) => {
        return isValidObjectId(id);
    },

    // Checks if a string is a valid email format
    isEmail: (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    // Checks if a string represents a valid time in HH:MM format
    isValidTime: (time) => {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    },

    // Basic check for valid date string (could be more robust)
    isValidDateString: (dateString) => {
        try {
            const date = new Date(dateString);
            return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
        } catch (error) {
            return false;
        }
    },

    // Example: Validate doctor's profile fields
    validateDoctorProfile: (profile) => {
        if (!profile || typeof profile !== 'object') {
            return { isValid: false, message: 'Doctor profile is required.' };
        }
        if (!profile.firstName || !profile.lastName) {
            return { isValid: false, message: 'Doctor first name and last name are required.' };
        }
        if (!profile.medicalLicenseNumber) {
            return { isValid: false, message: 'Doctor medical license number is required.' };
        }
        if (!Array.isArray(profile.specialties) || profile.specialties.length === 0) {
            return { isValid: false, message: 'Doctor must have at least one specialty.' };
        }
        // Add more checks: e.g., if hospitalAffiliations are valid IDs
        return { isValid: true };
    },

    // Example: Validate patient's profile fields
    validatePatientProfile: (profile) => {
        if (!profile || typeof profile !== 'object') {
            return { isValid: false, message: 'Patient profile is required.' };
        }
        if (!profile.firstName || !profile.lastName || !profile.dateOfBirth || !profile.phoneNumber) {
            return { isValid: false, message: 'Patient first name, last name, date of birth, and phone number are required.' };
        }
        // More specific checks for phone format, date format etc.
        return { isValid: true };
    },

    // Add more custom validation functions as needed
};

module.exports = validator;