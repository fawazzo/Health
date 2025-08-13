// controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const DoctorAvailability = require('../models/DoctorAvailability');
const User = require('../models/User'); // For patient and doctor details
const Hospital = require('../models/Hospital');
const asyncHandler = require('express-async-handler');
const { Types } = require('mongoose'); // For ObjectId checks

// @desc    Get all appointments (Admin/Doctor/Patient based on role)
// @route   GET /api/appointments
// @access  Private
const getAppointments = asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role === 'patient') {
        query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
        query.doctorId = req.user._id;
    } else if (req.user.role === 'hospital_admin') {
        // Find hospitals managed by this admin (assuming hospital_admin's profile has a hospitalId or a list)
        // For simplicity, let's assume hospital_admin can see all for now or is tied to one hospital
        // OR: req.user.profile.managedHospitalId. In a multi-hospital admin scenario, it's an array.
        // For now, only admin role can get all.
        // For hospital admin, you'd need to add hospitalId in their profile and filter by it.
        // For demonstration, let's allow admin to see all.
        if (!req.user.profile.managedHospitalId) {
             return res.status(403).json({ message: "Hospital admin profile missing managed hospital ID." });
        }
        query.hospitalId = req.user.profile.managedHospitalId;
    }

    const appointments = await Appointment.find(query)
        .populate('patientId', 'email profile.firstName profile.lastName profile.phoneNumber')
        .populate('doctorId', 'email profile.firstName profile.lastName profile.specialties')
        .populate('hospitalId', 'name address');

    res.json(appointments);
});

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (Owner or Admin)
const getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate('patientId', 'email profile.firstName profile.lastName profile.phoneNumber')
        .populate('doctorId', 'email profile.firstName profile.lastName profile.specialties')
        .populate('hospitalId', 'name address');

    if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
    }

    // Authorization: Only patient, doctor, or admin involved in this appointment can view
    const isOwner = appointment.patientId._id.equals(req.user._id) || appointment.doctorId._id.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    const isHospitalAdmin = req.user.role === 'hospital_admin' && appointment.hospitalId._id.equals(req.user.profile.managedHospitalId);

    if (!isOwner && !isAdmin && !isHospitalAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    res.json(appointment);
});

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private/Patient
const bookAppointment = asyncHandler(async (req, res) => {
    const { doctorId, hospitalId, date, startTime, endTime, type, reasonForVisit, consultationFee } = req.body;
    const patientId = req.user._id;

    // 1. Basic Validation
    if (!doctorId || !hospitalId || !date || !startTime || !endTime || !type || !reasonForVisit) {
        return res.status(400).json({ message: 'Missing required appointment details.' });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0); // Normalize date for availability lookup

    // 2. Find and Lock Availability Slot (Atomically)
    // Find the specific availability document for the doctor, hospital, and date
    const availability = await DoctorAvailability.findOne({
        doctorId,
        hospitalId,
        date: bookingDate,
        'timeSlots.startTime': startTime, // Match the specific slot
        'timeSlots.endTime': endTime,
        'timeSlots.isBooked': false, // Ensure it's not already booked
        isPublished: true // Ensure it's a published schedule
    });

    if (!availability) {
        return res.status(400).json({ message: 'Selected time slot is not available or does not exist.' });
    }

    // Find the index of the specific slot
    const slotIndex = availability.timeSlots.findIndex(
        slot => slot.startTime === startTime && slot.endTime === endTime && !slot.isBooked
    );

    if (slotIndex === -1) {
        return res.status(400).json({ message: 'Selected time slot is no longer available.' });
    }

    // Use updateOne with arrayFilters to atomically update only the specific slot
    const updateResult = await DoctorAvailability.updateOne(
        {
            _id: availability._id,
            'timeSlots.startTime': startTime,
            'timeSlots.endTime': endTime,
            'timeSlots.isBooked': false
        },
        {
            $set: {
                [`timeSlots.${slotIndex}.isBooked`]: true
            }
        }
    );

    if (updateResult.modifiedCount === 0) {
        // This means another request booked it, or it was already booked
        return res.status(409).json({ message: 'Conflict: The selected time slot was just booked by another patient. Please choose another.' });
    }

    // 3. Create Appointment
    const appointment = new Appointment({
        patientId,
        doctorId,
        hospitalId,
        date: bookingDate, // Store normalized date
        startTime,
        endTime,
        type,
        reasonForVisit,
        consultationFee: consultationFee || 0, // Default to 0 if not provided
        paymentStatus: consultationFee > 0 ? 'pending' : 'paid' // Auto-mark paid if fee is 0
    });

    const createdAppointment = await appointment.save();

    // 4. Update the booked slot with the new appointment ID
    // We update again to link the appointment ID. This is safe because `isBooked` is already true.
    await DoctorAvailability.updateOne(
        { _id: availability._id, [`timeSlots.${slotIndex}.isBooked`]: true },
        { $set: { [`timeSlots.${slotIndex}.appointmentId`]: createdAppointment._id } }
    );


    // TODO: Trigger notification for patient and doctor (e.g., email/SMS confirmation)
    // Example: sendEmail(patient.email, 'Appointment Confirmation', `Your appointment with Dr. ${doctor.profile.lastName} is confirmed...`);

    res.status(201).json(createdAppointment);
});

// @desc    Update appointment status (e.g., confirm, cancel, complete)
// @route   PUT /api/appointments/:id/status
// @access  Private/Doctor, Admin, Patient (for cancel)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const appointmentId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!status) {
        return res.status(400).json({ message: 'New status is required.' });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Authorization checks
    const isDoctorOfAppointment = appointment.doctorId.equals(userId);
    const isPatientOfAppointment = appointment.patientId.equals(userId);
    const isAdmin = userRole === 'admin';

    // Allow patient to cancel their own appointment
    if (status === 'cancelled' && isPatientOfAppointment) {
        // Proceed with cancellation logic
    }
    // Allow doctor to confirm, complete, cancel, no-show
    else if (['confirmed', 'completed', 'cancelled', 'no-show'].includes(status) && isDoctorOfAppointment) {
        // Proceed
    }
    // Allow admin to do anything
    else if (isAdmin) {
        // Proceed
    }
    else {
        return res.status(403).json({ message: 'Not authorized to change this appointment status.' });
    }

    // Handle cancellation logic (release slot)
    if (status === 'cancelled' && appointment.status !== 'cancelled') { // Only if not already cancelled
        // Find the availability document and free up the slot
        const isoDate = new Date(appointment.date).setHours(0, 0, 0, 0);
        await DoctorAvailability.updateOne(
            {
                doctorId: appointment.doctorId,
                hospitalId: appointment.hospitalId,
                date: isoDate,
                'timeSlots.appointmentId': appointment._id // Find the slot linked to this appointment
            },
            {
                $set: {
                    'timeSlots.$.isBooked': false,
                    'timeSlots.$.appointmentId': null
                }
            }
        );
        // TODO: Notify other party about cancellation
    }

    // Handle rescheduling logic (more complex, might involve separate endpoint)
    // This simple update only changes the status. Rescheduling would need new slot selection.

    appointment.status = status;
    const updatedAppointment = await appointment.save();

    res.json(updatedAppointment);
});

// @desc    Add doctor's notes to an appointment (after completion)
// @route   PUT /api/appointments/:id/notes
// @access  Private/Doctor
const addAppointmentNotes = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Only the assigned doctor can add notes, and only if appointment is completed or confirmed
    if (!appointment.doctorId.equals(req.user._id) || !['completed', 'confirmed'].includes(appointment.status)) {
        return res.status(403).json({ message: 'Not authorized to add notes to this appointment or appointment not in valid state.' });
    }

    appointment.notes = notes;
    const updatedAppointment = await appointment.save();
    res.json(updatedAppointment);
});

module.exports = {
    getAppointments,
    getAppointmentById,
    bookAppointment,
    updateAppointmentStatus,
    addAppointmentNotes
};