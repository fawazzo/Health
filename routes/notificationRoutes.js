// routes/notificationRoutes.js
const express = require('express');
const {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getMyNotifications);

router.route('/mark-all-read')
    .put(protect, markAllNotificationsAsRead);

router.route('/:id/read')
    .put(protect, markNotificationAsRead);

router.route('/:id')
    .delete(protect, deleteNotification);

module.exports = router;