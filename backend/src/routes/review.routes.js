'use strict';

const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { validateCreateReview, validateOwnerReply } = require('../validators/review.validator');

// 1. Public Review Discovery Endpoint
router.get('/venues/:venueId/reviews', ReviewController.getVenueReviews);

// 2. Protected Eligibility Check Endpoints
router.get('/venues/:venueId/review-eligibility', authenticateJWT, ReviewController.checkVenueReviewEligibility);
router.get('/bookings/:bookingId/review-eligibility', authenticateJWT, ReviewController.checkBookingReviewEligibility);

// 3. Protected Create Review Endpoint (Customer with COMPLETED booking)
router.post('/reviews', authenticateJWT, validateCreateReview, ReviewController.createReview);

// 4. Protected Owner Reply Endpoint
router.post('/owner/reviews/:reviewId/reply', authenticateJWT, requireRole('OWNER', 'ADMIN'), validateOwnerReply, ReviewController.replyOwnerReview);

module.exports = router;
