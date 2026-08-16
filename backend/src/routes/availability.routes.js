const express = require('express');
const router = express.Router();
const AvailabilityController = require('../controllers/availability.controller');

// GET /api/v1/availability/courts/:courtId
// Public route to check availability and get pricing
router.get('/courts/:courtId', AvailabilityController.checkAvailability);

// GET /api/v1/availability/venue/:venueId
// Public route to check full daily schedule availability matrix for a venue
router.get('/venue/:venueId', AvailabilityController.getVenueDailyAvailability);

module.exports = router;
