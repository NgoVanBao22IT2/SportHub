const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

// All endpoints in this file are strictly for ADMINs
router.use(authMiddleware.authenticateJWT);
router.use(rbacMiddleware.requireRole('ADMIN'));

// 13.01 Admin Dashboard
router.get('/dashboard', AdminController.getDashboard);

// 13.02 & 13.03 User & Owner Management
router.get('/users', AdminController.getUsers);
router.patch('/users/:id', AdminController.updateUser);

// 13.04 Venue Approval
router.get('/venues', AdminController.getVenues);
router.patch('/venues/:id/status', AdminController.updateVenueStatus);

// 13.05 Booking Management
router.get('/bookings', AdminController.getBookings);

// 13.06 Payment Management
router.get('/payments', AdminController.getPayments);

// Platform-wide Courts, Reviews, Reports & Community Discovery Management
router.get('/courts', AdminController.getCourts);
router.get('/reviews', AdminController.getReviews);
router.put('/reviews/:reviewId/hide-status', AdminController.updateReviewHideStatus);
router.get('/reports', AdminController.getReports);

// Admin Community Management
router.get('/community/posts', AdminController.getCommunityPosts);
router.put('/community/posts/:id/status', AdminController.updateCommunityPostStatus);
router.delete('/community/posts/:id', AdminController.deleteCommunityPost);

module.exports = router;
