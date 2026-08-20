'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  Review,
  Booking,
  Court,
  Branch,
  Venue,
  User,
  Notification,
  sequelize
} = require('../models');

class ReviewService {
  /**
   * Helper: Resolves venue information from a booking
   */
  static async getBookingWithVenue(bookingId) {
    return await Booking.findOne({
      where: { booking_id: bookingId },
      include: [
        {
          model: Court,
          as: 'court',
          include: [
            {
              model: Branch,
              as: 'branch',
              include: [
                {
                  model: Venue,
                  as: 'venue'
                }
              ]
            }
          ]
        },
        {
          model: Review,
          as: 'review'
        }
      ]
    });
  }

  /**
   * Business Rule Check: Verify if user is eligible to review a specific booking
   */
  static async canUserReviewBooking(userId, bookingId) {
    const booking = await this.getBookingWithVenue(bookingId);

    if (!booking) {
      return {
        allowed: false,
        statusCode: 404,
        code: 'BOOKING_NOT_FOUND',
        message: 'Không tìm thấy thông tin đơn đặt sân.'
      };
    }

    // Must belong to authenticated user
    if (booking.customer_user_id !== userId) {
      return {
        allowed: false,
        statusCode: 403,
        code: 'FORBIDDEN_BOOKING_OWNERSHIP',
        message: 'Bạn không có quyền đánh giá đơn đặt sân của người khác.'
      };
    }

    // Must be COMPLETED status
    const status = String(booking.booking_status || '').toUpperCase();
    if (status !== 'COMPLETED') {
      let statusNote = 'Đơn chưa hoàn thành.';
      if (['CANCELLED', 'EXPIRED', 'REJECTED', 'PAYMENT_FAILED'].includes(status)) {
        statusNote = 'Đơn đã bị hủy hoặc không thành công.';
      } else if (['HOLDING', 'PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'WAITING_OWNER_CONFIRMATION'].includes(status)) {
        statusNote = 'Lịch chơi chưa diễn ra hoặc chưa được hoàn tất.';
      }

      return {
        allowed: false,
        statusCode: 403,
        code: 'BOOKING_NOT_COMPLETED',
        message: `Bạn chỉ có thể đánh giá sau khi đã hoàn thành lịch chơi tại sân. (${statusNote})`
      };
    }

    // Check if already reviewed
    const existingReview = booking.review || (await Review.findOne({ where: { booking_id: bookingId } }));
    if (existingReview) {
      return {
        allowed: false,
        statusCode: 409,
        code: 'ALREADY_REVIEWED',
        message: 'Bạn đã gửi đánh giá cho đơn đặt sân này rồi.'
      };
    }

    const venue = booking.court?.branch?.venue;
    const court = booking.court;

    return {
      allowed: true,
      booking,
      court,
      venue
    };
  }

  /**
   * Check if a user has any completed & unreviewed booking for a venue
   */
  static async checkVenueReviewEligibility(userId, venueId) {
    if (!userId) {
      return {
        canReview: false,
        reason: 'UNAUTHENTICATED',
        message: 'Vui lòng đăng nhập để kiểm tra điều kiện đánh giá.'
      };
    }

    // Find all courts of this venue
    const branches = await Branch.findAll({
      where: { venue_id: venueId },
      attributes: ['branch_id']
    });
    const branchIds = branches.map(b => b.branch_id);

    if (branchIds.length === 0) {
      return {
        canReview: false,
        reason: 'NO_COMPLETED_BOOKING',
        message: 'Bạn chưa có lịch chơi hoàn thành tại câu lạc bộ này.'
      };
    }

    const courts = await Court.findAll({
      where: { branch_id: { [Op.in]: branchIds } },
      attributes: ['court_id']
    });
    const courtIds = courts.map(c => c.court_id);

    if (courtIds.length === 0) {
      return {
        canReview: false,
        reason: 'NO_COMPLETED_BOOKING',
        message: 'Bạn chưa có lịch chơi hoàn thành tại câu lạc bộ này.'
      };
    }

    // Find completed bookings for this user at this venue's courts
    const completedBookings = await Booking.findAll({
      where: {
        customer_user_id: userId,
        court_id: { [Op.in]: courtIds },
        booking_status: 'COMPLETED'
      },
      include: [
        {
          model: Court,
          as: 'court',
          attributes: ['court_id', 'court_name']
        },
        {
          model: Review,
          as: 'review',
          attributes: ['review_id']
        }
      ],
      order: [['booking_date', 'DESC'], ['end_time', 'DESC']]
    });

    // Filter unreviewed bookings
    const unreviewedBookings = completedBookings.filter(b => !b.review);

    if (unreviewedBookings.length > 0) {
      const targetBooking = unreviewedBookings[0];
      return {
        canReview: true,
        bookingId: targetBooking.booking_id,
        bookingDate: targetBooking.booking_date,
        courtName: targetBooking.court?.court_name || 'Sân thể thao',
        eligibleBookingsCount: unreviewedBookings.length,
        eligibleBookings: unreviewedBookings.map(b => ({
          bookingId: b.booking_id,
          bookingDate: b.booking_date,
          timeSlot: `${(b.start_time || '').substring(0, 5)} - ${(b.end_time || '').substring(0, 5)}`,
          courtName: b.court?.court_name
        }))
      };
    }

    return {
      canReview: false,
      reason: completedBookings.length > 0 ? 'ALL_BOOKINGS_REVIEWED' : 'NO_COMPLETED_BOOKING',
      message: completedBookings.length > 0
        ? 'Bạn đã đánh giá tất cả các lần đặt sân tại cơ sở này.'
        : 'Bạn cần hoàn thành một buổi chơi thực tế tại sân trước khi gửi đánh giá.'
    };
  }

  /**
   * Create a new Review in Database Transaction
   */
  static async createReview(userId, { bookingId, rating, comment }) {
    // 1. Verify eligibility strictly
    const check = await this.canUserReviewBooking(userId, bookingId);
    if (!check.allowed) {
      const err = new Error(check.message);
      err.statusCode = check.statusCode || 400;
      err.code = check.code || 'REVIEW_DENIED';
      throw err;
    }

    const { booking, court, venue } = check;
    const venueId = venue?.venue_id || null;
    const courtId = booking.court_id;

    // 2. Perform DB Transaction
    const transaction = await sequelize.transaction();
    try {
      const reviewId = crypto.randomUUID();
      const review = await Review.create(
        {
          review_id: reviewId,
          booking_id: bookingId,
          customer_user_id: userId,
          court_id: courtId,
          venue_id: venueId,
          rating,
          comment: comment || null,
          status: 'PUBLISHED'
        },
        { transaction }
      );

      // 3. Create Notification for Venue Owner if owner exists
      if (venue && venue.owner_user_id) {
        await Notification.create(
          {
            notification_id: crypto.randomUUID(),
            recipient_user_id: venue.owner_user_id,
            notification_type: 'NEW_REVIEW',
            title: 'Đánh giá mới từ người chơi ⭐',
            message: `Khách hàng vừa đánh giá ${rating}★ cho ${venue.venue_name || 'câu lạc bộ'}: "${(comment || '').substring(0, 100)}${(comment || '').length > 100 ? '...' : ''}"`,
            entity_type: 'REVIEW',
            entity_id: reviewId,
            is_read: false
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Return review with customer info
      const createdWithUser = await Review.findByPk(reviewId, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['user_id', 'full_name', 'phone_number']
          },
          {
            model: Court,
            as: 'court',
            attributes: ['court_id', 'court_name']
          }
        ]
      });

      return createdWithUser.toJSON();
    } catch (err) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      // Handle Unique Constraint Race Condition
      if (err.name === 'SequelizeUniqueConstraintError') {
        const conflictErr = new Error('Bạn đã gửi đánh giá cho đơn đặt sân này rồi.');
        conflictErr.statusCode = 409;
        conflictErr.code = 'ALREADY_REVIEWED';
        throw conflictErr;
      }
      throw err;
    }
  }

  /**
   * Get all reviews and real rating summary for a venue
   */
  static async getVenueReviews(venueId, options = {}) {
    const page = Math.max(1, parseInt(options.page || 1, 10));
    const limit = Math.max(1, Math.min(50, parseInt(options.limit || 10, 10)));
    const offset = (page - 1) * limit;
    const sort = options.sort || 'newest';
    const filterRating = options.rating ? parseInt(options.rating, 10) : null;

    // 1. Resolve all courts for this venue
    const branches = await Branch.findAll({
      where: { venue_id: venueId },
      attributes: ['branch_id']
    });
    const branchIds = branches.map(b => b.branch_id);

    let courtIds = [];
    if (branchIds.length > 0) {
      const courts = await Court.findAll({
        where: { branch_id: { [Op.in]: branchIds } },
        attributes: ['court_id']
      });
      courtIds = courts.map(c => c.court_id);
    }

    const baseWhere = {
      status: 'PUBLISHED',
      [Op.or]: [
        { venue_id: venueId },
        ...(courtIds.length > 0 ? [{ court_id: { [Op.in]: courtIds } }] : [])
      ]
    };

    // 2. Fetch all reviews for rating KPI & star distribution calculation
    const allReviews = await Review.findAll({
      where: baseWhere,
      attributes: ['rating']
    });

    const totalReviews = allReviews.length;
    let averageRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = allReviews.reduce((acc, r) => {
        const star = parseInt(r.rating, 10);
        if (distribution[star] !== undefined) {
          distribution[star] += 1;
        }
        return acc + star;
      }, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    // 3. Build query for paginated results with sorting
    const queryWhere = { ...baseWhere };
    if (filterRating && filterRating >= 1 && filterRating <= 5) {
      queryWhere.rating = filterRating;
    }

    let order = [['created_at', 'DESC']];
    if (sort === 'highest') {
      order = [['rating', 'DESC'], ['created_at', 'DESC']];
    } else if (sort === 'lowest') {
      order = [['rating', 'ASC'], ['created_at', 'DESC']];
    }

    const { count: filteredCount, rows: reviewRows } = await Review.findAndCountAll({
      where: queryWhere,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'phone_number']
        },
        {
          model: Court,
          as: 'court',
          attributes: ['court_id', 'court_name']
        }
      ],
      order,
      limit,
      offset
    });

    return {
      reviews: reviewRows.map(r => r.toJSON()),
      pagination: {
        page,
        limit,
        totalItems: filteredCount,
        totalPages: Math.ceil(filteredCount / limit)
      },
      summary: {
        averageRating,
        totalReviews,
        distribution
      }
    };
  }

  /**
   * Owner reply to a customer review
   */
  static async replyOwnerReview(ownerUserId, reviewId, replyContent) {
    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: Court,
          as: 'court',
          include: [
            {
              model: Branch,
              as: 'branch',
              include: [{ model: Venue, as: 'venue' }]
            }
          ]
        },
        {
          model: Venue,
          as: 'venue'
        }
      ]
    });

    if (!review) {
      const err = new Error('Không tìm thấy đánh giá.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const venue = review.venue || review.court?.branch?.venue;
    if (!venue || venue.owner_user_id !== ownerUserId) {
      const err = new Error('Bạn không có quyền phản hồi đánh giá của cơ sở khác.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    review.owner_reply = replyContent;
    review.owner_reply_at = new Date();
    await review.save();

    // Notify customer
    if (review.customer_user_id) {
      await Notification.create({
        notification_id: crypto.randomUUID(),
        recipient_user_id: review.customer_user_id,
        notification_type: 'REVIEW_REPLY',
        title: 'Chủ sân đã phản hồi đánh giá của bạn 💬',
        message: `${venue.venue_name || 'Chủ sân'} vừa phản hồi đánh giá của bạn: "${replyContent.substring(0, 100)}"`,
        entity_type: 'REVIEW',
        entity_id: reviewId,
        is_read: false
      });
    }

    return review.toJSON();
  }
}

module.exports = ReviewService;
