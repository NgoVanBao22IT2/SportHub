'use strict';

const express = require('express');
const router = express.Router();
const ownerRegistrationController = require('../controllers/owner-registration.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// Customer Endpoints
router.get('/me', authenticateJWT, ownerRegistrationController.getMyRegistration);
router.post('/', authenticateJWT, ownerRegistrationController.createRegistration);
router.post('', authenticateJWT, ownerRegistrationController.createRegistration);
router.post('/:id/cancel', authenticateJWT, ownerRegistrationController.cancelMyRegistration);

// Admin Endpoints
router.get('/admin/list', authenticateJWT, requireRole('ADMIN'), ownerRegistrationController.getAdminRegistrations);
router.patch('/admin/:id/approve', authenticateJWT, requireRole('ADMIN'), ownerRegistrationController.approveRegistration);
router.patch('/admin/:id/reject', authenticateJWT, requireRole('ADMIN'), ownerRegistrationController.rejectRegistration);
router.put('/admin/:id', authenticateJWT, requireRole('ADMIN'), ownerRegistrationController.updateRegistration);
router.delete('/admin/:id', authenticateJWT, requireRole('ADMIN'), ownerRegistrationController.deleteRegistration);

module.exports = router;
