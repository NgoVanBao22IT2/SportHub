'use strict';

const MediaService = require('../services/media.service');

class MediaController {
  /**
   * GET /api/v1/owner/venues/:venueId/media
   */
  static async getOwnerVenueMedia(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { venueId } = req.params;
      const { page, limit, image_type, search } = req.query;

      const result = await MediaService.getOwnerVenueMedia(ownerUserId, venueId, { page, limit, image_type, search });
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
   * POST /api/v1/owner/venues/:venueId/media
   */
  static async uploadMedia(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { venueId } = req.params;
      const files = req.files || (req.file ? [req.file] : []);
      const base64List = req.body.base64_images ? (Array.isArray(req.body.base64_images) ? req.body.base64_images : [req.body.base64_images]) : (req.body.base64_image ? [req.body.base64_image] : []);

      if ((!files || files.length === 0) && (!base64List || base64List.length === 0)) {
        return res.status(400).json({ error: { message: 'Chưa chọn file hình ảnh hoặc chuỗi Base64 để tải lên.' } });
      }

      const created = await MediaService.uploadMedia(ownerUserId, venueId, files, base64List, req.body);
      res.status(201).json({
        status: 'success',
        message: `Đã tải lên ${created.length} hình ảnh thành công.`,
        data: created
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/owner/media/:imageId
   */
  static async updateMedia(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { imageId } = req.params;

      const updated = await MediaService.updateMedia(ownerUserId, imageId, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Đã cập nhật thông tin hình ảnh thành công.',
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
   * DELETE /api/v1/owner/media/:imageId
   */
  static async deleteMedia(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { imageId } = req.params;

      const result = await MediaService.deleteMedia(ownerUserId, imageId);
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
   * POST /api/v1/owner/venues/:venueId/media/reorder
   */
  static async reorderMedia(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { venueId } = req.params;
      const { order_list } = req.body;

      const result = await MediaService.reorderMedia(ownerUserId, venueId, order_list || []);
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
   * POST /api/v1/owner/media/:imageId/set-cover
   */
  static async setCoverImage(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { imageId } = req.params;

      const updated = await MediaService.setCoverImage(ownerUserId, imageId);
      res.status(200).json({
        status: 'success',
        message: 'Đã thiết lập ảnh làm Ảnh bìa (Cover) của sân.',
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
   * POST /api/v1/owner/media/:imageId/set-avatar
   */
  static async setAvatarImage(req, res, next) {
    try {
      const ownerUserId = req.user.userId;
      const { imageId } = req.params;

      const updated = await MediaService.setAvatarImage(ownerUserId, imageId);
      res.status(200).json({
        status: 'success',
        message: 'Đã thiết lập ảnh làm Ảnh đại diện (Avatar) của sân.',
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
   * GET /api/v1/public/venues/:venueId/media
   */
  static async getPublicVenueMedia(req, res, next) {
    try {
      const { venueId } = req.params;
      const { page, limit, image_type } = req.query;

      const result = await MediaService.getPublicVenueMedia(venueId, { page, limit, image_type });
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
}

module.exports = MediaController;
