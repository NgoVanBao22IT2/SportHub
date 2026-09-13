'use strict';

const { CommunityPost, PostApplication, User, Venue, Booking, Court, Branch, Sequelize } = require('../models');
const { Op } = Sequelize;
const NotificationService = require('./notification.service');

class CommunityService {
  /**
   * Get community posts with filters
   */
  static async getPosts(query = {}) {
    const {
      post_type,
      sport_type,
      skill_level,
      status = 'ALL',
      search,
      page = 1,
      limit = 50,
      user_id,
    } = query;

    const where = {};

    if (user_id) {
      where.user_id = user_id;
    }

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

    // Notify post author
    try {
      const applicant = await User.findByPk(userId);
      const applicantName = applicant?.full_name || 'Một người chơi';

      await NotificationService.createNotification({
        recipientUserId: post.user_id,
        type: 'POST_APPLICATION',
        title: 'Có người đăng ký tham gia bài đăng của bạn',
        message: `${applicantName} vừa đăng ký tham gia bài viết "${post.title}". Lời nhắn: "${message || 'Không có lời nhắn'}"`,
        entityType: 'COMMUNITY_POST',
        entityId: post.post_id,
      });
    } catch (notifErr) {
      console.error('Error creating post application notification:', notifErr);
    }

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

    // Notify applicant of status update
    try {
      const statusText = status === 'ACCEPTED' ? 'chấp nhận' : 'từ chối';
      await NotificationService.createNotification({
        recipientUserId: app.applicant_user_id,
        type: 'POST_APPLICATION_STATUS',
        title: `Yêu cầu tham gia bài đăng được ${statusText}`,
        message: `Yêu cầu gia nhập bài đăng "${app.post?.title || 'bài viết'}" của bạn đã được tác giả ${statusText}.`,
        entityType: 'COMMUNITY_POST',
        entityId: app.post_id,
      });
    } catch (notifErr) {
      console.error('Error notifying application status change:', notifErr);
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

  /**
   * Update an existing post by author or Admin
   */
  static async updatePost(postId, userId, userRole, postData) {
    const post = await CommunityPost.findByPk(postId);

    if (!post) {
      const error = new Error('Bài đăng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (userRole === 'OWNER') {
      const error = new Error('Chủ sân (Owner) không có quyền chỉnh sửa bài đăng này');
      error.statusCode = 403;
      throw error;
    }

    if (userRole !== 'ADMIN' && post.user_id !== userId) {
      const error = new Error('Bạn không có quyền chỉnh sửa bài đăng này');
      error.statusCode = 403;
      throw error;
    }

    const {
      title,
      content,
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
      status
    } = postData;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (sport_type !== undefined) post.sport_type = sport_type;
    if (play_date !== undefined) post.play_date = play_date;
    if (start_time !== undefined) post.start_time = start_time;
    if (end_time !== undefined) post.end_time = end_time;
    if (skill_level !== undefined) post.skill_level = skill_level;
    if (slots_needed !== undefined) post.slots_needed = parseInt(slots_needed) || post.slots_needed;
    if (price_per_slot !== undefined) post.price_per_slot = parseFloat(price_per_slot) || 0;
    if (original_price !== undefined) post.original_price = original_price ? parseFloat(original_price) : null;
    if (pass_price !== undefined) post.pass_price = pass_price ? parseFloat(pass_price) : null;
    if (location_name !== undefined) post.location_name = location_name;
    if (image_url !== undefined) post.image_url = image_url;
    if (contact_phone !== undefined) post.contact_phone = contact_phone;
    if (contact_zalo !== undefined) post.contact_zalo = contact_zalo;
    if (status !== undefined) post.status = status;

    await post.save();
    return await this.getPostById(postId);
  }

  /**
   * Delete post by author or Admin
   */
  static async deletePost(postId, userId, userRole) {
    const post = await CommunityPost.findByPk(postId);

    if (!post) {
      const error = new Error('Bài đăng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (userRole === 'OWNER') {
      const error = new Error('Chủ sân (Owner) không có quyền xóa bài đăng này');
      error.statusCode = 403;
      throw error;
    }

    // Admin can delete ALL posts from customer or owner. Customer can delete only their own post.
    if (userRole !== 'ADMIN' && post.user_id !== userId) {
      const error = new Error('Bạn không có quyền xóa bài đăng này');
      error.statusCode = 403;
      throw error;
    }

    await post.destroy();
    return { success: true, message: 'Đã xóa bài đăng thành công' };
  }
}

module.exports = CommunityService;
