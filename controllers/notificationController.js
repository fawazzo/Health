// controllers/notificationController.js
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @desc    Get notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ sentAt: -1, isRead: 1 }) // Newest first, unread first
        .limit(20); // Limit to recent notifications for performance

    res.json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id // Ensure user owns the notification
    });

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found or unauthorized.' });
    }

    if (notification.isRead) {
        return res.status(200).json({ message: 'Notification already marked as read.', notification });
    }

    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Notification marked as read.', notification });
});

// @desc    Mark all notifications as read for the authenticated user
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read.' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id // Ensure user owns the notification
    });

    if (!notification) {
        return res.status(404).json({ message: 'Notification not found or unauthorized.' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification removed.' });
});

// Helper function to create a notification (called internally by other controllers)
// This should ideally be a separate service or utility that handles sending emails/SMS too
const createNotification = async ({ userId, type, message, link = null }) => {
    try {
        const notification = new Notification({
            userId,
            type,
            message,
            link
        });
        await notification.save();
        // TODO: Integrate with external notification services (e.g., Twilio for SMS, Nodemailer for email)
        // Example: await sendEmail(user.email, 'New Notification', message);
        // Example: await sendSMS(user.phoneNumber, message);
        console.log(`Notification created for user ${userId}: ${message}`);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};


module.exports = {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    createNotification // Export for internal use by other controllers
};