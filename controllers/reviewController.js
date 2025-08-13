// controllers/reviewController.js
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // To update doctor's average rating

// @desc    Get all reviews for a specific doctor
// @route   GET /api/reviews/doctor/:doctorId
// @access  Public
const getDoctorReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ doctorId: req.params.doctorId })
        .populate('patientId', 'profile.firstName profile.lastName profile.gender') // Only public profile info
        .populate('appointmentId', 'date'); // To see context

    res.json(reviews);
});

// @desc    Get all reviews by a specific patient
// @route   GET /api/reviews/patient/:patientId
// @access  Private (Patient themselves or Admin)
const getPatientReviews = asyncHandler(async (req, res) => {
    // Authorization: Only the patient or an admin can view their own reviews
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.patientId) {
        return res.status(403).json({ message: 'Not authorized to view these reviews.' });
    }

    const reviews = await Review.find({ patientId: req.params.patientId })
        .populate('doctorId', 'profile.firstName profile.lastName profile.specialties')
        .populate('appointmentId', 'date');

    res.json(reviews);
});

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private/Patient
const createReview = asyncHandler(async (req, res) => {
    const { doctorId, appointmentId, rating, comment, isAnonymous } = req.body;
    const patientId = req.user._id;

    if (!doctorId || !appointmentId || !rating) {
        return res.status(400).json({ message: 'Doctor ID, Appointment ID, and rating are required.' });
    }

    // 1. Verify appointment exists and is completed by this patient and doctor
    const appointment = await Appointment.findOne({
        _id: appointmentId,
        patientId,
        doctorId,
        status: 'completed' // Only allow review for completed appointments
    });

    if (!appointment) {
        return res.status(400).json({ message: 'Appointment not found or not eligible for review.' });
    }

    // 2. Check if a review already exists for this appointment
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this appointment.' });
    }

    // 3. Create review
    const review = new Review({
        patientId,
        doctorId,
        appointmentId,
        rating,
        comment,
        isAnonymous: isAnonymous || false
    });

    const createdReview = await review.save();

    // 4. Update doctor's average rating (Optional, could be done in a background job)
    const stats = await Review.aggregate([
        { $match: { doctorId: new Types.ObjectId(doctorId) } },
        {
            $group: {
                _id: '$doctorId',
                averageRating: { $avg: '$rating' },
                numReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await User.updateOne(
            { _id: doctorId },
            {
                $set: {
                    'profile.averageRating': stats[0].averageRating,
                    'profile.numReviews': stats[0].numReviews
                }
            }
        );
    }

    res.status(201).json(createdReview);
});

// @desc    Update a review (patient can update their own)
// @route   PUT /api/reviews/:id
// @access  Private/Patient
const updateReview = asyncHandler(async (req, res) => {
    const { rating, comment, isAnonymous } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
        return res.status(404).json({ message: 'Review not found.' });
    }

    // Only the patient who created it can update
    if (!review.patientId.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to update this review.' });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

    const updatedReview = await review.save();

    // Re-calculate doctor's average rating if rating changed
    if (rating) {
        const stats = await Review.aggregate([
            { $match: { doctorId: review.doctorId } },
            {
                $group: {
                    _id: '$doctorId',
                    averageRating: { $avg: '$rating' },
                    numReviews: { $sum: 1 }
                }
            }
        ]);
        if (stats.length > 0) {
            await User.updateOne(
                { _id: review.doctorId },
                {
                    $set: {
                        'profile.averageRating': stats[0].averageRating,
                        'profile.numReviews': stats[0].numReviews
                    }
                }
            );
        }
    }
    res.json(updatedReview);
});

// @desc    Delete a review (patient can delete their own, admin can delete any)
// @route   DELETE /api/reviews/:id
// @access  Private/Patient, Admin
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return res.status(404).json({ message: 'Review not found.' });
    }

    // Only the patient who created it or an admin can delete
    if (!review.patientId.equals(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this review.' });
    }

    const doctorId = review.doctorId; // Store doctor ID before deleting review

    await review.deleteOne();

    // Recalculate doctor's average rating (could be done in background)
    const stats = await Review.aggregate([
        { $match: { doctorId: doctorId } },
        {
            $group: {
                _id: '$doctorId',
                averageRating: { $avg: '$rating' },
                numReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await User.updateOne(
            { _id: doctorId },
            {
                $set: {
                    'profile.averageRating': stats[0].averageRating,
                    'profile.numReviews': stats[0].numReviews
                }
            }
        );
    } else {
        // If no reviews left for this doctor, reset their rating
        await User.updateOne(
            { _id: doctorId },
            {
                $unset: { 'profile.averageRating': 1, 'profile.numReviews': 1 } // Remove fields
            }
        );
    }

    res.json({ message: 'Review removed.' });
});

module.exports = {
    getDoctorReviews,
    getPatientReviews,
    createReview,
    updateReview,
    deleteReview
};