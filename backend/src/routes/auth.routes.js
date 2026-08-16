'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// Public Authentication Endpoints
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Authenticated User Endpoint
router.get('/me', authenticateJWT, authController.getProfile);

// RBAC Protected Test Routes (Task 05.09)
router.get('/customer/dashboard', authenticateJWT, requireRole('CUSTOMER', 'OWNER', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome to Customer Dashboard', user: req.user });
});

router.get('/owner/venues', authenticateJWT, requireRole('OWNER', 'ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome Owner Venue Portal', user: req.user });
});

router.get('/admin/users', authenticateJWT, requireRole('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin User Management Portal', user: req.user });
});

module.exports = router;
