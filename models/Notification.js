// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'appointment_reminder',
            'appointment_confirmation',
            'appointment_cancelled',
            'appointment_rescheduled',
            'new_prescription',
            'lab_result_ready',
            'new_message', // For future chat/message feature
            'admin_announcement',
            'system_alert'
        ],
        required: true
    },
    message: {
        type: String,
        required: [true, 'Notification message is required']
    },
    link: { // Optional: Link to relevant resource (e.g., /appointments/:id, /prescriptions/:id)
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Useful for tracking notification creation
});

notificationSchema.index({ userId: 1, isRead: 1, sentAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);