const { User, Venue, Booking, Payment, CommunityPost, PostApplication, sequelize } = require('../models');

class AdminService {
  /**
   * 13.01 Dashboard aggregate endpoint
   */
  static async getDashboard() {
    const userCount = await User.count();
    const ownerCount = await User.count({ where: { primary_role: 'OWNER' } });
    const venueCount = await Venue.count();
    const pendingVenueCount = await Venue.count({ where: { operating_status: 'PENDING' } });
    const bookingCount = await Booking.count();
    
    // Revenue from PAID payments
    const revenueStats = await Payment.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.col('payment_id')), 'total_transactions']
      ],
      where: {
        payment_status: 'PAID'
      },
      raw: true
    });

    return {
      total_users: userCount,
      total_owners: ownerCount,
      total_venues: venueCount,
      pending_venues: pendingVenueCount,
      total_bookings: bookingCount,
      total_revenue: parseFloat(revenueStats[0].total_revenue) || 0,
      total_transactions: parseInt(revenueStats[0].total_transactions) || 0
    };
  }

  /**
   * 13.02 / 13.03 List Users (Handles Customers and Owners based on role filter)
   */
  static async getUsers(options = {}) {
    const { page = 1, limit = 10, role } = options;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) {
      where.primary_role = role;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] }, // Do not expose password hashes
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const data = rows.map(user => {
      const u = user.toJSON();
      u.created_at = u.created_at || u.createdAt;
      return u;
    });

    return {
      data,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  /**
   * 13.02 Update User Role/Status
   */
  static async updateUser(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Only allow updating specific fields
    if (updateData.primary_role) user.primary_role = updateData.primary_role;
    if (updateData.account_status) user.account_status = updateData.account_status;

    await user.save();
    
    // Return sanitized user
    const { password_hash, ...safeUser } = user.toJSON();
    return safeUser;
  }

  /**
   * 13.04 Venue Approval
   */
  static async getVenues(options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.operating_status = status;
    }

    const { rows, count } = await Venue.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['user_id', 'full_name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  static async updateVenueStatus(venueId, status) {
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      const error = new Error('Venue not found');
      error.statusCode = 404;
      throw error;
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid operating status');
      error.statusCode = 400;
      throw error;
    }

    venue.operating_status = status;
    await venue.save();
    return venue;
  }

  /**
   * 13.05 Booking Management (Platform-wide Read-only)
   */
  static async getBookings(options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const { rows, count } = await Booking.findAndCountAll({
      include: [
        { model: User, as: 'customer', attributes: ['user_id', 'full_name', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  /**
   * 13.06 Payment Management (Platform-wide Read-only)
   */
  static async getPayments(options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const { rows, count } = await Payment.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['user_id', 'full_name', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  /**
   * Platform-wide Court Management
   */
  static async getCourts(options = {}) {
    const { Court, Branch, Venue } = require('../models');
    const { page = 1, limit = 10, sport_category } = options;
    const offset = (page - 1) * limit;

    const where = {};
    if (sport_category) {
      where.sport_category = sport_category;
    }

    const { rows, count } = await Court.findAndCountAll({
      where,
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['branch_id', 'branch_name', 'street_address', 'ward_district_city'],
          include: [{ model: Venue, as: 'venue', attributes: ['venue_id', 'venue_name'] }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  /**
    * Platform-wide Review Management
    */
  static async getReviews(options = {}) {
    const { Review, User, Court, Branch, Venue } = require('../models');
    const { page = 1, limit = 10, rating, hideRequestStatus, status } = options;
    const offset = (page - 1) * limit;

    const where = {};
    if (rating) {
      where.rating = parseInt(rating);
    }
    if (hideRequestStatus) {
      where.hide_request_status = hideRequestStatus;
    }
    if (status) {
      where.status = status;
    }

    const { rows, count } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['user_id', 'full_name', 'email', 'phone_number'] },
        {
          model: Court,
          as: 'court',
          attributes: ['court_id', 'court_name', 'sport_category'],
          include: [
            {
              model: Branch,
              as: 'branch',
              attributes: ['branch_id', 'branch_name'],
              include: [
                {
                  model: Venue,
                  as: 'venue',
                  attributes: ['venue_id', 'venue_name', 'owner_user_id'],
                  include: [
                    {
                      model: User,
                      as: 'owner',
                      attributes: ['user_id', 'full_name', 'email', 'phone_number']
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [
        // Prioritize pending hide requests at the top if any
        ['hide_request_status', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  /**
   * Admin approves or rejects review hide request, or unhides a review
   */
  static async updateReviewHideStatus(reviewId, action) {
    const { Review } = require('../models');

    const review = await Review.findByPk(reviewId);
    if (!review) {
      const err = new Error('Đánh giá không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    if (action === 'APPROVE') {
      await review.update({
        status: 'HIDDEN',
        hide_request_status: 'APPROVED',
        hide_resolved_at: new Date()
      });
    } else if (action === 'REJECT') {
      await review.update({
        status: 'PUBLISHED',
        hide_request_status: 'REJECTED',
        hide_resolved_at: new Date()
      });
    } else if (action === 'UNHIDE') {
      await review.update({
        status: 'PUBLISHED',
        hide_request_status: 'NONE',
        hide_resolved_at: new Date()
      });
    } else {
      const err = new Error('Hành động không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }

    return review;
  }

  /**
   * Platform-wide Reports & Aggregations
   */
  static async getReports() {
    const { User, Venue, Court, Booking, Payment, sequelize } = require('../models');

    // 1. Booking Status Distribution
    const bookingsByStatus = await Booking.findAll({
      attributes: [
        'booking_status',
        [sequelize.fn('COUNT', sequelize.col('booking_id')), 'count']
      ],
      group: ['booking_status'],
      raw: true
    });

    // 2. User Distribution by Role
    const usersByRole = await User.findAll({
      attributes: [
        'primary_role',
        [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']
      ],
      group: ['primary_role'],
      raw: true
    });

    // 3. Venue Status Distribution
    const venuesByStatus = await Venue.findAll({
      attributes: [
        'operating_status',
        [sequelize.fn('COUNT', sequelize.col('venue_id')), 'count']
      ],
      group: ['operating_status'],
      raw: true
    });

    // 4. Courts by Sport Category
    const courtsBySport = await Court.findAll({
      attributes: [
        'sport_category',
        [sequelize.fn('COUNT', sequelize.col('court_id')), 'count']
      ],
      group: ['sport_category'],
      raw: true
    });

    return {
      bookings_by_status: bookingsByStatus,
      users_by_role: usersByRole,
      venues_by_status: venuesByStatus,
      courts_by_sport: courtsBySport
    };
  }

  /**
   * Admin Community Posts Management
   */
  static async getCommunityPosts(options = {}) {
    const { page = 1, limit = 20, post_type, status, search } = options;
    const offset = (page - 1) * limit;

    const where = {};
    if (post_type && post_type !== 'ALL') where.post_type = post_type;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { location_name: { [Op.like]: `%${search}%` } },
        { sport_type: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await CommunityPost.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['user_id', 'full_name', 'email', 'phone_number'],
        },
        {
          model: Venue,
          as: 'venue',
          attributes: ['venue_id', 'venue_name', 'contact_phone'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit) }
    };
  }

  static async updateCommunityPostStatus(postId, status) {
    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      const error = new Error('Bài viết không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    post.status = status;
    await post.save();
    return post;
  }

  static async deleteCommunityPost(postId) {
    const post = await CommunityPost.findByPk(postId);
    if (!post) {
      const error = new Error('Bài viết không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    await post.destroy();
    return true;
  }
}

module.exports = AdminService;
