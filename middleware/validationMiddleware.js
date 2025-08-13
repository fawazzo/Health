// middleware/validationMiddleware.js
const { body, param, query, validationResult } = require('express-validator');

// Reusable middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param || err.path]: err.msg }));

    return res.status(422).json({
        errors: extractedErrors,
        message: 'Validation failed'
    });
};

// --- AUTH Validation ---
const registerValidation = [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['patient', 'doctor', 'admin', 'hospital_admin', 'pharmacy_admin']).withMessage('Invalid user role'),
    // Add more validation for profile based on role in controller or more specific middleware
    validate
];

const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

// --- USER Validation ---
const updateUserValidation = [
    param('id').isMongoId().withMessage('Invalid User ID format'),
    body('email').optional().isEmail().withMessage('Please enter a valid email address'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    // Add specific profile validations in the controller or more granular middleware
    validate
];

// --- HOSPITAL Validation ---
const createHospitalValidation = [
    body('name').notEmpty().withMessage('Hospital name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('phoneNumber').optional().matches(/^\+?\d{10,15}$/).withMessage('Please enter a valid phone number'),
    validate
];

const updateHospitalValidation = [
    param('id').isMongoId().withMessage('Invalid Hospital ID format'),
    body('name').optional().notEmpty().withMessage('Hospital name cannot be empty'),
    // ... add more for other fields
    validate
];

// --- SPECIALTY Validation ---
const createSpecialtyValidation = [
    body('name').notEmpty().withMessage('Specialty name is required'),
    validate
];

const updateSpecialtyValidation = [
    param('id').isMongoId().withMessage('Invalid Specialty ID format'),
    body('name').optional().notEmpty().withMessage('Specialty name cannot be empty'),
    validate
];

// --- DOCTOR Availability Validation ---
const setAvailabilityValidation = [
    body('hospitalId').isMongoId().withMessage('Invalid Hospital ID format'),
    body('date').isISO8601().toDate().withMessage('Invalid date format (YYYY-MM-DD)'),
    body('timeSlots').isArray({ min: 1 }).withMessage('Time slots must be an array with at least one slot'),
    body('timeSlots.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
    body('timeSlots.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
    validate
];

// --- APPOINTMENT Validation ---
const bookAppointmentValidation = [
    body('doctorId').isMongoId().withMessage('Invalid Doctor ID format'),
    body('hospitalId').isMongoId().withMessage('Invalid Hospital ID format'),
    body('date').isISO8601().toDate().withMessage('Invalid date format (YYYY-MM-DD)'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
    body('type').isIn(['in-person', 'telemedicine']).withMessage('Invalid appointment type'),
    body('reasonForVisit').notEmpty().withMessage('Reason for visit is required'),
    body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a non-negative number'),
    validate
];

const updateAppointmentStatusValidation = [
    param('id').isMongoId().withMessage('Invalid Appointment ID format'),
    body('status').isIn(['booked', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no-show']).withMessage('Invalid appointment status'),
    validate
];

// --- PRESCRIPTION Validation ---
const createPrescriptionValidation = [
    body('appointmentId').isMongoId().withMessage('Invalid Appointment ID format'),
    body('medications').isArray({ min: 1 }).withMessage('Medications must be an array with at least one item'),
    body('medications.*.name').notEmpty().withMessage('Medication name is required'),
    body('medications.*.dosage').notEmpty().withMessage('Medication dosage is required'),
    body('medications.*.frequency').notEmpty().withMessage('Medication frequency is required'),
    body('medications.*.duration').notEmpty().withMessage('Medication duration is required'),
    validate
];

// --- MEDICAL RECORD Validation ---
const uploadMedicalRecordValidation = [
    body('patientId').optional().isMongoId().withMessage('Invalid Patient ID format (required for doctors/admins)'), // Patient can omit, doctor/admin must provide
    body('title').notEmpty().withMessage('Medical record title is required'),
    body('type').isIn(['lab_result', 'imaging_scan', 'consultation_note', 'prescription_copy', 'other']).withMessage('Invalid medical record type'),
    validate
];

const updateMedicalRecordValidation = [
    param('id').isMongoId().withMessage('Invalid Medical Record ID format'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('type').optional().isIn(['lab_result', 'imaging_scan', 'consultation_note', 'prescription_copy', 'other']).withMessage('Invalid medical record type'),
    body('accessGrantedTo').optional().isArray().withMessage('Access Granted To must be an array of user IDs'),
    body('accessGrantedTo.*').optional().isMongoId().withMessage('Invalid User ID in access granted list'),
    validate
];

// --- REVIEW Validation ---
const createReviewValidation = [
    body('doctorId').isMongoId().withMessage('Invalid Doctor ID format'),
    body('appointmentId').isMongoId().withMessage('Invalid Appointment ID format'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
    validate
];

// --- PHARMACY Validation ---
const createPharmacyValidation = [
    body('name').notEmpty().withMessage('Pharmacy name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('phoneNumber').optional().matches(/^\+?\d{10,15}$/).withMessage('Please enter a valid phone number'),
    body('latitude').isFloat().withMessage('Latitude must be a number'),
    body('longitude').isFloat().withMessage('Longitude must be a number'),
    validate
];

// Add similar validation for other updates and specific routes as needed.

module.exports = {
    // Auth
    registerValidation,
    loginValidation,
    // Users (update is covered by common param validation, specific profile update handled in controller)
    updateUserValidation,
    // Hospitals
    createHospitalValidation,
    updateHospitalValidation,
    // Specialties
    createSpecialtyValidation,
    updateSpecialtyValidation,
    // Doctor Availability
    setAvailabilityValidation,
    // Appointments
    bookAppointmentValidation,
    updateAppointmentStatusValidation,
    // Prescriptions
    createPrescriptionValidation,
    // Medical Records
    uploadMedicalRecordValidation,
    updateMedicalRecordValidation,
    // Reviews
    createReviewValidation,
    // Pharmacies
    createPharmacyValidation,
};