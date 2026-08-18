'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Venue, VenuePost, VenueImage, VenuePostImage, User, sequelize } = require('../models');

class PostService {
  /**
   * Helper: Generate URL-safe slug from title
   */
  static slugify(text) {
    if (!text) return `post-${Date.now()}`;
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Helper: Generate unique slug
   */
  static async generateUniqueSlug(title, currentPostId = null) {
    let baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const where = { slug };
      if (currentPostId) {
        where.post_id = { [Op.ne]: currentPostId };
      }
      const existing = await VenuePost.findOne({ where });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  /**
   * Helper: Verify ownership of venue by ownerUserId
   */
  static async verifyVenueOwnership(ownerUserId, venueId) {
    const venue = await Venue.findOne({
      where: { venue_id: venueId, owner_user_id: ownerUserId }
    });
    if (!venue) {
      const err = new Error('Không tìm thấy cơ sở hoặc bạn không có quyền quản lý sân thể thao này.');
      err.statusCode = 403;
      throw err;
    }
    return venue;
  }

  /**
   * Owner API: Fetch list of posts/events with filters & pagination
   */
  static async getOwnerPosts(ownerUserId, venueId, options = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const { page = 1, limit = 10, status, content_type, search } = options;
    const offset = (page - 1) * limit;

    const where = { venue_id: venueId };
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (content_type && content_type !== 'ALL') {
      where.content_type = content_type;
    }
    if (search && search.trim()) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { excerpt: { [Op.like]: `%${search.trim()}%` } },
        { content: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const { rows, count } = await VenuePost.findAndCountAll({
      where,
      include: [
        { model: VenueImage, as: 'cover_image', required: false }
      ],
      order: [
        ['is_featured', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Owner API: Create new post / event / promotion
   */
  static async createPost(ownerUserId, venueId, payload = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const {
      title,
      excerpt,
      content,
      content_type = 'POST',
      cover_image_id,
      cover_image_url,
      status = 'DRAFT',
      publish_at,
      start_at,
      end_at,
      location,
      registration_url,
      max_participants,
      fee_amount,
      promo_code,
      discount_info,
      instructor,
      contact_hotline,
      is_featured = false,
      gallery_image_ids = []
    } = payload;

    if (!title || !title.trim()) {
      const err = new Error('Vui lòng nhập tiêu đề bài viết/sự kiện.');
      err.statusCode = 400;
      throw err;
    }

    const postId = uuidv4();
    const slug = await this.generateUniqueSlug(title);

    const transaction = await sequelize.transaction();
    try {
      const post = await VenuePost.create({
        post_id: postId,
        venue_id: venueId,
        author_user_id: ownerUserId,
        title: title.trim(),
        slug,
        excerpt: excerpt || '',
        content: content || '',
        content_type,
        cover_image_id: cover_image_id || null,
        cover_image_url: cover_image_url || null,
        status: status || 'DRAFT',
        publish_at: status === 'PUBLISHED' ? (publish_at || new Date()) : (publish_at || null),
        start_at: start_at || null,
        end_at: end_at || null,
        location: location || null,
        registration_url: registration_url || null,
        max_participants: max_participants ? parseInt(max_participants, 10) : null,
        fee_amount: fee_amount ? parseFloat(fee_amount) : 0.00,
        promo_code: promo_code || null,
        discount_info: discount_info || null,
        instructor: instructor || null,
        contact_hotline: contact_hotline || null,
        is_featured: !!is_featured
      }, { transaction });

      // Attach gallery images
      if (gallery_image_ids && gallery_image_ids.length > 0) {
        let order = 0;
        for (const imgId of gallery_image_ids) {
          await VenuePostImage.create({
            id: uuidv4(),
            post_id: postId,
            image_id: imgId,
            display_order: order++
          }, { transaction });
        }
      }

      await transaction.commit();
      return post;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Owner API: Get post detail by ID
   */
  static async getPostById(ownerUserId, postId) {
    const post = await VenuePost.findByPk(postId, {
      include: [
        { model: VenueImage, as: 'cover_image', required: false },
        {
          model: VenuePostImage,
          as: 'post_images',
          include: [{ model: VenueImage, as: 'image' }]
        }
      ]
    });

    if (!post) {
      const err = new Error('Không tìm thấy bài viết hoặc sự kiện.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, post.venue_id);
    return post;
  }

  /**
   * Owner API: Update post
   */
  static async updatePost(ownerUserId, postId, payload = {}) {
    const post = await VenuePost.findByPk(postId);
    if (!post) {
      const err = new Error('Không tìm thấy bài viết hoặc sự kiện.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, post.venue_id);

    const {
      title,
      excerpt,
      content,
      content_type,
      cover_image_id,
      cover_image_url,
      status,
      publish_at,
      start_at,
      end_at,
      location,
      registration_url,
      max_participants,
      fee_amount,
      promo_code,
      discount_info,
      instructor,
      contact_hotline,
      is_featured,
      gallery_image_ids
    } = payload;

    const transaction = await sequelize.transaction();
    try {
      if (title && title.trim() !== post.title) {
        post.title = title.trim();
        post.slug = await this.generateUniqueSlug(title.trim(), postId);
      }

      if (excerpt !== undefined) post.excerpt = excerpt;
      if (content !== undefined) post.content = content;
      if (content_type !== undefined) post.content_type = content_type;
      if (cover_image_id !== undefined) post.cover_image_id = cover_image_id || null;
      if (cover_image_url !== undefined) post.cover_image_url = cover_image_url || null;
      if (status !== undefined) {
        post.status = status;
        if (status === 'PUBLISHED' && !post.publish_at) {
          post.publish_at = new Date();
        }
      }
      if (publish_at !== undefined) post.publish_at = publish_at || null;
      if (start_at !== undefined) post.start_at = start_at || null;
      if (end_at !== undefined) post.end_at = end_at || null;
      if (location !== undefined) post.location = location || null;
      if (registration_url !== undefined) post.registration_url = registration_url || null;
      if (max_participants !== undefined) post.max_participants = max_participants ? parseInt(max_participants, 10) : null;
      if (fee_amount !== undefined) post.fee_amount = fee_amount ? parseFloat(fee_amount) : 0.00;
      if (promo_code !== undefined) post.promo_code = promo_code || null;
      if (discount_info !== undefined) post.discount_info = discount_info || null;
      if (instructor !== undefined) post.instructor = instructor || null;
      if (contact_hotline !== undefined) post.contact_hotline = contact_hotline || null;
      if (is_featured !== undefined) post.is_featured = !!is_featured;

      await post.save({ transaction });

      // Update attached gallery images
      if (gallery_image_ids && Array.isArray(gallery_image_ids)) {
        await VenuePostImage.destroy({ where: { post_id: postId }, transaction });
        let order = 0;
        for (const imgId of gallery_image_ids) {
          await VenuePostImage.create({
            id: uuidv4(),
            post_id: postId,
            image_id: imgId,
            display_order: order++
          }, { transaction });
        }
      }

      await transaction.commit();
      return post;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Owner API: Delete post
   */
  static async deletePost(ownerUserId, postId) {
    const post = await VenuePost.findByPk(postId);
    if (!post) {
      const err = new Error('Không tìm thấy bài viết hoặc sự kiện.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, post.venue_id);

    const transaction = await sequelize.transaction();
    try {
      await VenuePostImage.destroy({ where: { post_id: postId }, transaction });
      await post.destroy({ transaction });
      await transaction.commit();
      return { success: true, message: 'Đã xóa bài viết/sự kiện thành công.' };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Owner API: Publish post
   */
  static async publishPost(ownerUserId, postId) {
    return await this.updatePost(ownerUserId, postId, { status: 'PUBLISHED', publish_at: new Date() });
  }

  /**
   * Owner API: Archive post
   */
  static async archivePost(ownerUserId, postId) {
    return await this.updatePost(ownerUserId, postId, { status: 'ARCHIVED' });
  }

  /**
   * Customer API: Get published posts for a venue
   */
  static async getPublicVenuePosts(venueId, options = {}) {
    const { page = 1, limit = 10, content_type, filter } = options;
    const offset = (page - 1) * limit;

    const now = new Date();
    const where = {
      venue_id: venueId,
      status: 'PUBLISHED',
      publish_at: { [Op.lte]: now }
    };

    if (content_type && content_type !== 'ALL') {
      where.content_type = content_type;
    }

    // Filter by Event timing status (UPCOMING, ONGOING, ENDED)
    if (filter === 'UPCOMING') {
      where.start_at = { [Op.gt]: now };
    } else if (filter === 'ONGOING') {
      where.start_at = { [Op.lte]: now };
      where.end_at = { [Op.gte]: now };
    } else if (filter === 'ENDED') {
      where.end_at = { [Op.lt]: now };
    }

    const { rows, count } = await VenuePost.findAndCountAll({
      where,
      include: [
        { model: VenueImage, as: 'cover_image', required: false }
      ],
      order: [
        ['is_featured', 'DESC'],
        ['publish_at', 'DESC']
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    };
  }

  /**
   * Customer API: Get post detail by slug with view count increment & related posts
   */
  static async getPublicPostBySlug(slug) {
    const post = await VenuePost.findOne({
      where: { slug, status: 'PUBLISHED' },
      include: [
        { model: Venue, as: 'venue' },
        { model: VenueImage, as: 'cover_image', required: false },
        {
          model: VenuePostImage,
          as: 'post_images',
          include: [{ model: VenueImage, as: 'image' }]
        }
      ]
    });

    if (!post) {
      const err = new Error('Không tìm thấy bài viết hoặc bài viết đã bị gỡ.');
      err.statusCode = 404;
      throw err;
    }

    // Increment view count
    post.view_count = (post.view_count || 0) + 1;
    await post.save();

    // Fetch related posts from same venue
    const relatedPosts = await VenuePost.findAll({
      where: {
        venue_id: post.venue_id,
        status: 'PUBLISHED',
        post_id: { [Op.ne]: post.post_id }
      },
      include: [{ model: VenueImage, as: 'cover_image', required: false }],
      order: [['publish_at', 'DESC']],
      limit: 4
    });

    return {
      post,
      relatedPosts
    };
  }

  /**
   * Customer API: Get featured published events/promotions across all venues
   */
  static async getPublicFeaturedEvents(options = {}) {
    const { limit = 6 } = options;
    const now = new Date();

    const events = await VenuePost.findAll({
      where: {
        status: 'PUBLISHED',
        publish_at: { [Op.lte]: now },
        content_type: { [Op.in]: ['EVENT', 'PROMOTION', 'TOURNAMENT', 'COURSE'] }
      },
      include: [
        { model: Venue, as: 'venue' },
        { model: VenueImage, as: 'cover_image', required: false }
      ],
      order: [
        ['is_featured', 'DESC'],
        ['publish_at', 'DESC']
      ],
      limit: parseInt(limit, 10)
    });

    return events;
  }
}

module.exports = PostService;
