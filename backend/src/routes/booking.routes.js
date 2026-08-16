const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all booking routes - user must be authenticated
router.use(authMiddleware.authenticateJWT);

// GET /api/v1/bookings
router.get('/', BookingController.getUserBookings);

// GET /api/v1/bookings/:id
router.get('/:id', BookingController.getBooking);

// POST /api/v1/bookings
router.post('/', BookingController.createBooking);

// POST /api/v1/bookings/batch
router.post('/batch', BookingController.createBatchBookings);

// PATCH /api/v1/bookings/:id/cancel
router.patch('/:id/cancel', BookingController.cancelBooking);

module.exports = router;
