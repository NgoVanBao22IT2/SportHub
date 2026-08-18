'use strict';

const PostService = require('../services/post.service');

class PostController {
  /**
   * GET /api/v1/owner/venues/:venueId/posts
   */
  static async getOwnerPosts(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { venueId } = req.params;
      const { page, limit, status, content_type, search } = req.query;

      const result = await PostService.getOwnerPosts(ownerUserId, venueId, { page, limit, status, content_type, search });
      res.status(200).json({
        status: 'success',
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/owner/venues/:venueId/posts
   */
  static async createPost(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { venueId } = req.params;

      const post = await PostService.createPost(ownerUserId, venueId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Đã tạo bài viết/sự kiện mới thành công.',
        data: post
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/owner/posts/:postId
   */
  static async getPostById(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { postId } = req.params;

      const post = await PostService.getPostById(ownerUserId, postId);
      res.status(200).json({
        status: 'success',
        data: post
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/owner/posts/:postId
   */
  static async updatePost(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { postId } = req.params;

      const updated = await PostService.updatePost(ownerUserId, postId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Đã cập nhật bài viết/sự kiện thành công.',
        data: updated
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/owner/posts/:postId
   */
  static async deletePost(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { postId } = req.params;

      const result = await PostService.deletePost(ownerUserId, postId);
      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/owner/posts/:postId/publish
   */
  static async publishPost(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { postId } = req.params;

      const post = await PostService.publishPost(ownerUserId, postId);
      res.status(200).json({
        status: 'success',
        message: 'Đã xuất bản bài viết/sự kiện công khai.',
        data: post
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/owner/posts/:postId/archive
   */
  static async archivePost(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { postId } = req.params;

      const post = await PostService.archivePost(ownerUserId, postId);
      res.status(200).json({
        status: 'success',
        message: 'Đã lưu trữ bài viết/sự kiện.',
        data: post
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/public/venues/:venueId/posts
   */
  static async getPublicVenuePosts(req, res, next) {
    try {
      const { venueId } = req.params;
      const { page, limit, content_type, filter } = req.query;

      const result = await PostService.getPublicVenuePosts(venueId, { page, limit, content_type, filter });
      res.status(200).json({
        status: 'success',
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/public/posts/:slug
   */
  static async getPublicPostBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      const result = await PostService.getPublicPostBySlug(slug);
      res.status(200).json({
        status: 'success',
        data: result.post,
        relatedPosts: result.relatedPosts
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/public/featured-events
   */
  static async getPublicFeaturedEvents(req, res, next) {
    try {
      const { limit } = req.query;
      const events = await PostService.getPublicFeaturedEvents({ limit });
      res.status(200).json({
        status: 'success',
        data: events
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }
}

module.exports = PostController;
