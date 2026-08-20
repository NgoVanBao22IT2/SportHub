'use strict';

const ReviewService = require('../services/review.service');

class ReviewController {
  /**
   * GET /api/v1/venues/:venueId/reviews
   * Public: Get all published reviews, rating KPI summary & star distribution
   */
  static async getVenueReviews(req, res, next) {
    try {
      const { venueId } = req.params;
      const { page, limit, sort, rating } = req.query;

      const result = await ReviewService.getVenueReviews(venueId, {
        page,
        limit,
        sort,
        rating
      });

      return res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
        summary: result.summary
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/venues/:venueId/review-eligibility
   * Protected: Check if authenticated user can review this venue
   */
  static async checkVenueReviewEligibility(req, res, next) {
    try {
      const { venueId } = req.params;
      const userId = req.user?.userId;

      const eligibility = await ReviewService.checkVenueReviewEligibility(userId, venueId);

      return res.status(200).json({
        success: true,
        data: eligibility
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/bookings/:bookingId/review-eligibility
   * Protected: Check if authenticated user can review a specific booking
   */
  static async checkBookingReviewEligibility(req, res, next) {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.userId;

      const result = await ReviewService.canUserReviewBooking(userId, bookingId);

      if (!result.allowed) {
        return res.status(200).json({
          success: true,
          data: {
            canReview: false,
            code: result.code,
            message: result.message
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          canReview: true,
          bookingId: result.booking.booking_id,
          venueId: result.venue?.venue_id,
          venueName: result.venue?.venue_name,
          courtName: result.court?.court_name
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/reviews
   * Protected: Create a review for a completed booking
   */
  static async createReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { bookingId, rating, comment } = req.validatedReview;

      const review = await ReviewService.createReview(userId, {
        bookingId,
        rating,
        comment
      });

      return res.status(201).json({
        success: true,
        message: 'Đánh giá của bạn đã được gửi thành công!',
        data: review
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/owner/reviews/:reviewId/reply
   * Protected (OWNER role): Reply to customer review
   */
  static async replyOwnerReview(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { reviewId } = req.params;
      const { replyContent } = req.validatedReply;

      const updated = await ReviewService.replyOwnerReview(ownerUserId, reviewId, replyContent);

      return res.status(200).json({
        success: true,
        message: 'Phản hồi đánh giá đã được lưu thành công.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReviewController;
