const express = require('express');
const router = express.Router();
const OwnerController = require('../controllers/owner.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

// All endpoints in this file are strictly for OWNERs
router.use(authMiddleware.authenticateJWT);
router.use(rbacMiddleware.requireRole('OWNER'));

// 12.01 Owner Dashboard
router.get('/dashboard', OwnerController.getDashboard);

// 12.06 Booking & Schedule Management
router.get('/bookings', OwnerController.getBookings);
router.get('/bookings/pending', OwnerController.getPendingBookings);
router.get('/bookings/:bookingId', OwnerController.getBookingById);
router.post('/bookings/:bookingId/approve', OwnerController.approveBooking);
router.post('/bookings/:bookingId/reject', OwnerController.rejectBooking);
router.post('/schedules/block', OwnerController.blockCourtSlot);
router.delete('/schedules/block/:blockId', OwnerController.unblockCourtSlot);

// 12.10 Payment Accounts Management
router.get('/payment-accounts', OwnerController.getPaymentAccounts);
router.post('/payment-accounts', OwnerController.createPaymentAccount);
router.put('/payment-accounts/:accountId', OwnerController.updatePaymentAccount);
router.delete('/payment-accounts/:accountId', OwnerController.deletePaymentAccount);

// 12.11 Payment Transactions Management
router.get('/payments', OwnerController.getPayments);
router.get('/payments/:paymentId', OwnerController.getPaymentById);
router.post('/payments/:paymentId/approve', OwnerController.approvePaymentTransaction);
router.post('/payments/:paymentId/reject', OwnerController.rejectPaymentTransaction);

// 12.12 Reviews Management
router.get('/reviews', OwnerController.getReviews);
router.get('/reviews/:reviewId', OwnerController.getReviewById);
router.post('/reviews/:reviewId/reply', OwnerController.replyReview);

// 12.13 Notifications Management
router.get('/notifications', OwnerController.getNotifications);
router.get('/notifications/unread-count', OwnerController.getUnreadNotificationCount);
router.get('/notifications/:notificationId', OwnerController.getNotificationById);
router.put('/notifications/read-all', OwnerController.markAllNotificationsAsRead);
router.put('/notifications/:notificationId/read', OwnerController.markNotificationAsRead);
router.delete('/notifications/:notificationId', OwnerController.deleteNotification);

// 12.14 Profile & Password Management
router.get('/profile', OwnerController.getProfile);
router.put('/profile', OwnerController.updateProfile);
router.put('/password', OwnerController.changePassword);

// 12.07 Customer
router.get('/customers', OwnerController.getCustomers);

// 12.11 Revenue
router.get('/revenue', OwnerController.getRevenue);

module.exports = router;
