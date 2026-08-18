'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

const venueController = require('../controllers/venue.controller');
const branchController = require('../controllers/branch.controller');
const courtController = require('../controllers/court.controller');
const facilityController = require('../controllers/facility.controller');
const imageController = require('../controllers/image.controller');
const scheduleController = require('../controllers/schedule.controller');
const availabilityController = require('../controllers/availability.controller');

// ==========================================
// PUBLIC ROUTES
// ==========================================
// Public Webhook & Venue endpoints
router.get('/facilities', facilityController.getFacilities);
router.get('/venues/:venueId/payment-accounts', venueController.getVenuePaymentAccounts);
router.get('/venues/:venueId/availability', availabilityController.getVenueDailyAvailability);

// Target Type and Target ID images (Public read)
router.get('/images/:targetType/:targetId', imageController.getImagesByTarget);
router.get('/schedules/:scopeTargetType/:scopeTargetId', scheduleController.getSchedulesByScope);


// ==========================================
// PROTECTED ROUTES (OWNER & ADMIN)
// ==========================================
router.use(authMiddleware.authenticateJWT);
router.use(rbacMiddleware.requireRole('OWNER', 'ADMIN')); // Or ADMIN in future, but stick to OWNER for MVP Phase 06

// Venue CRUD
router.post('/venues', venueController.createVenue);
router.get('/owner/venues', venueController.getMyVenues);
router.get('/venues/:venueId', venueController.getMyVenueById);
router.put('/venues/:venueId', venueController.updateVenue);
router.delete('/venues/:venueId', venueController.deleteVenue);

// Venue - Facility Assignment
router.post('/venues/:venueId/facilities', facilityController.assignFacilityToVenue);
router.delete('/venues/:venueId/facilities/:facilityId', facilityController.removeFacilityFromVenue);

// Branch CRUD
router.post('/venues/:venueId/branches', branchController.createBranch);
router.get('/venues/:venueId/branches', branchController.getBranchesByVenue);
router.get('/venues/:venueId/branches/:branchId', branchController.getBranchById);
router.put('/venues/:venueId/branches/:branchId', branchController.updateBranch);
router.delete('/venues/:venueId/branches/:branchId', branchController.deleteBranch);

// Court CRUD
router.post('/venues/:venueId/branches/:branchId/courts', courtController.createCourt);
router.get('/venues/:venueId/branches/:branchId/courts', courtController.getCourtsByBranch);
router.get('/venues/:venueId/branches/:branchId/courts/:courtId', courtController.getCourtById);
router.put('/venues/:venueId/branches/:branchId/courts/:courtId', courtController.updateCourt);
router.delete('/venues/:venueId/branches/:branchId/courts/:courtId', courtController.deleteCourt);

// Images (Upload/Delete)
router.post('/images/:targetType/:targetId', imageController.uploadImage);
router.delete('/images/:imageId', imageController.deleteImage);

// Operating Schedules
router.post('/schedules/:scopeTargetType/:scopeTargetId', scheduleController.createSchedule);
router.put('/schedules/:scheduleId', scheduleController.updateSchedule);
router.patch('/schedules/:scheduleId/status', scheduleController.toggleScheduleStatus);
router.post('/schedules/:scheduleId/duplicate', scheduleController.duplicateSchedule);
router.delete('/schedules/:scheduleId', scheduleController.deleteSchedule);

// ==========================================
// PROTECTED ROUTES (ADMIN ONLY)
// ==========================================
const adminRouter = express.Router();
adminRouter.use(authMiddleware.authenticateJWT);
adminRouter.use(rbacMiddleware.requireRole('ADMIN'));
adminRouter.post('/facilities', facilityController.createFacility);

// Export both routers or mount adminRouter inside
router.use('/admin', adminRouter);

module.exports = router;
