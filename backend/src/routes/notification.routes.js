'use strict';

const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

// All notification endpoints require authenticated user
router.use(authenticateJWT);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/read-all', NotificationController.markAllNotificationsAsRead);
router.put('/:notificationId/read', NotificationController.markNotificationAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);

module.exports = router;
