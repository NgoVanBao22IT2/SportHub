'use strict';

const { CommunityPost, PostApplication, User, Venue, Booking, Court, Branch, Sequelize } = require('../models');
const { Op } = Sequelize;

class CommunityService {
  /**
   * Get community posts with filters
   */
  static async getPosts(query = {}) {
    const {
      post_type,
      sport_type,
      skill_level,
      status = 'OPEN',
      search,
      page = 1,
      limit = 10,
    } = query;

    const where = {};

    if (post_type && post_type !== 'ALL') {
      where.post_type = post_type;
    }

    if (sport_type && sport_type !== 'ALL') {
      where.sport_type = sport_type;
    }

    if (skill_level && skill_level !== 'ALL') {
      where.skill_level = skill_level;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: s } },
        { content: { [Op.like]: s } },
        { location_name: { [Op.like]: s } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await CommunityPost.findAndCountAll({
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
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'booking_date', 'start_time', 'end_time', 'booking_status', 'total_amount'],
        },
        {
          model: PostApplication,
          as: 'applications',
          include: [
            {
              model: User,
              as: 'applicant',
              attributes: ['user_id', 'full_name'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      posts: rows,
    };
  }

  /**
   * Get single post by ID
   */
  static async getPostById(postId) {
    const post = await CommunityPost.findByPk(postId, {
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
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'booking_date', 'start_time', 'end_time', 'booking_status', 'total_amount'],
        },
        {
          model: PostApplication,
          as: 'applications',
          include: [
            {
              model: User,
              as: 'applicant',
              attributes: ['user_id', 'full_name', 'phone_number'],
            },
          ],
        },
      ],
    });

    if (!post) {
      const error = new Error('Bài đăng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    return post;
  }

  /**
   * Create new post
   */
  static async createPost(userId, postData) {
    const {
      post_type,
      title,
      content,
      venue_id,
      booking_id,
      sport_type,
      play_date,
      start_time,
      end_time,
      skill_level,
      slots_needed,
      price_per_slot,
      original_price,
      pass_price,
      location_name,
      image_url,
      contact_phone,
      contact_zalo,
    } = postData;

    if (!title || !play_date || !post_type) {
      const error = new Error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    // Verify booking_id if post_type is PASS_BOOKING
    if (post_type === 'PASS_BOOKING' && booking_id) {
      const booking = await Booking.findOne({
        where: {
          booking_id,
          customer_user_id: userId,
        },
      });

      if (!booking) {
        const error = new Error('Đơn đặt sân không tồn tại hoặc không thuộc quyền sở hữu của bạn');
        error.statusCode = 400;
        throw error;
      }
    }

    const newPost = await CommunityPost.create({
      user_id: userId,
      post_type,
      title,
      content,
      venue_id: venue_id || null,
      booking_id: booking_id || null,
      sport_type: sport_type || 'Cầu lông',
      play_date,
      start_time: start_time || null,
      end_time: end_time || null,
      skill_level: skill_level || 'ALL',
      slots_needed: parseInt(slots_needed) || 1,
      slots_joined: 0,
      price_per_slot: price_per_slot ? parseFloat(price_per_slot) : 0,
      original_price: original_price ? parseFloat(original_price) : null,
      pass_price: pass_price ? parseFloat(pass_price) : null,
      location_name: location_name || null,
      image_url: image_url || null,
      contact_phone: contact_phone || null,
      contact_zalo: contact_zalo || null,
      status: 'OPEN',
    });

    return await this.getPostById(newPost.post_id);
  }

  /**
   * Apply to a post
   */
  static async applyPost(postId, userId, message) {
    const post = await CommunityPost.findByPk(postId);

    if (!post) {
      const error = new Error('Bài đăng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (post.user_id === userId) {
      const error = new Error('Bạn không thể đăng ký bài đăng của chính mình');
      error.statusCode = 400;
      throw error;
    }

    if (post.status !== 'OPEN') {
      const error = new Error('Bài đăng này đã đóng hoặc đã đủ người');
      error.statusCode = 400;
      throw error;
    }

    const existingApp = await PostApplication.findOne({
      where: {
        post_id: postId,
        applicant_user_id: userId,
        status: { [Op.ne]: 'CANCELLED' },
      },
    });

    if (existingApp) {
      const error = new Error('Bạn đã đăng ký bài viết này rồi');
      error.statusCode = 400;
      throw error;
    }

    const application = await PostApplication.create({
      post_id: postId,
      applicant_user_id: userId,
      message,
      status: 'PENDING',
    });

    return application;
  }

  /**
   * Update application status (Accept / Reject)
   */
  static async updateApplicationStatus(applicationId, ownerUserId, status) {
    const app = await PostApplication.findByPk(applicationId, {
      include: [{ model: CommunityPost, as: 'post' }],
    });

    if (!app) {
      const error = new Error('Yêu cầu không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (app.post.user_id !== ownerUserId) {
      const error = new Error('Bạn không có quyền quản lý bài đăng này');
      error.statusCode = 403;
      throw error;
    }

    app.status = status;
    await app.save();

    // If accepted, increment slots_joined
    if (status === 'ACCEPTED') {
      const post = app.post;
      post.slots_joined += 1;
      if (post.slots_joined >= post.slots_needed) {
        post.status = 'FULL';
      }
      await post.save();
    }

    return app;
  }

  /**
   * Get user's upcoming confirmed bookings for pass-booking
   */
  static async getUserUpcomingBookings(userId) {
    const today = new Date().toISOString().split('T')[0];

    const bookings = await Booking.findAll({
      where: {
        customer_user_id: userId,
        booking_status: 'CONFIRMED',
        booking_date: { [Op.gte]: today },
      },
      include: [
        {
          model: Court,
          as: 'court',
          include: [
            {
              model: Branch,
              as: 'branch',
              include: [{ model: Venue, as: 'venue' }],
            },
          ],
        },
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
    });

    return bookings.map((b) => ({
      booking_id: b.booking_id,
      booking_date: b.booking_date,
      start_time: b.start_time,
      end_time: b.end_time,
      total_amount: b.total_amount,
      venue_id: b.court?.branch?.venue?.venue_id || null,
      venue_name: b.court?.branch?.venue?.venue_name || 'Câu lạc bộ thể thao',
      address: b.court?.branch?.venue?.address || '',
      court_name: b.court?.court_name || 'Sân',
    }));
  }
}

module.exports = CommunityService;
