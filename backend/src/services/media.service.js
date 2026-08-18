'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Venue, VenueImage, User, sequelize } = require('../models');
const StorageService = require('./storage.service');

class MediaService {
  /**
   * Helper: Ensure venue exists and is strictly owned by ownerUserId.
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
   * Fetch paginated media gallery for owner's venue.
   */
  static async getOwnerVenueMedia(ownerUserId, venueId, options = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const { page = 1, limit = 20, image_type, search } = options;
    const offset = (page - 1) * limit;

    const where = { venue_id: venueId, is_active: true };
    if (image_type && image_type !== 'ALL') {
      where.image_type = image_type;
    }
    if (search && search.trim()) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search.trim()}%` } },
        { caption: { [Op.like]: `%${search.trim()}%` } },
        { alt_text: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const { rows, count } = await VenueImage.findAndCountAll({
      where,
      order: [
        ['is_cover', 'DESC'],
        ['is_avatar', 'DESC'],
        ['display_order', 'ASC'],
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
   * Upload single or multiple images with variant creation and database record
   */
  static async uploadMedia(ownerUserId, venueId, files = [], base64List = [], bodyData = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const { image_type = 'VENUE', title = '', caption = '', alt_text = '', is_cover = false, is_avatar = false } = bodyData;

    const createdImages = [];
    const transaction = await sequelize.transaction();

    try {
      // 1. Process Multer Files
      if (files && files.length > 0) {
        for (const file of files) {
          StorageService.validateImage(file);
          const variants = await StorageService.saveImageBuffer(file.buffer, file.originalname);

          const imgId = uuidv4();
          const isCoverBool = (is_cover === true || is_cover === 'true' || image_type === 'COVER');
          const isAvatarBool = (is_avatar === true || is_avatar === 'true' || image_type === 'AVATAR');

          if (isCoverBool) {
            await VenueImage.update(
              { is_cover: false },
              { where: { venue_id: venueId, is_cover: true }, transaction }
            );
          }

          if (isAvatarBool) {
            await VenueImage.update(
              { is_avatar: false },
              { where: { venue_id: venueId, is_avatar: true }, transaction }
            );
          }

          const record = await VenueImage.create({
            image_id: imgId,
            venue_id: venueId,
            target_id: venueId,
            target_type: 'VENUE',
            uploaded_by: ownerUserId,
            image_url: variants.image_url,
            thumbnail_url: variants.thumbnail_url,
            medium_url: variants.medium_url,
            large_url: variants.large_url,
            original_url: variants.original_url,
            image_type: isCoverBool ? 'COVER' : isAvatarBool ? 'AVATAR' : image_type,
            title: title || file.originalname,
            caption,
            alt_text: alt_text || title || file.originalname,
            display_order: 0,
            is_cover: isCoverBool,
            is_avatar: isAvatarBool,
            is_active: true,
            file_size: variants.file_size,
            mime_type: variants.mime_type
          }, { transaction });

          createdImages.push(record);
        }
      }

      // 2. Process Base64 Data URLs
      if (base64List && base64List.length > 0) {
        for (const b64 of base64List) {
          const variants = await StorageService.saveBase64Image(b64, title || 'venue_media');

          const imgId = uuidv4();
          const isCoverBool = (is_cover === true || is_cover === 'true' || image_type === 'COVER');
          const isAvatarBool = (is_avatar === true || is_avatar === 'true' || image_type === 'AVATAR');

          if (isCoverBool) {
            await VenueImage.update(
              { is_cover: false },
              { where: { venue_id: venueId, is_cover: true }, transaction }
            );
          }

          if (isAvatarBool) {
            await VenueImage.update(
              { is_avatar: false },
              { where: { venue_id: venueId, is_avatar: true }, transaction }
            );
          }

          const record = await VenueImage.create({
            image_id: imgId,
            venue_id: venueId,
            target_id: venueId,
            target_type: 'VENUE',
            uploaded_by: ownerUserId,
            image_url: variants.image_url,
            thumbnail_url: variants.thumbnail_url,
            medium_url: variants.medium_url,
            large_url: variants.large_url,
            original_url: variants.original_url,
            image_type: isCoverBool ? 'COVER' : isAvatarBool ? 'AVATAR' : image_type,
            title: title || 'Ảnh tải lên',
            caption,
            alt_text: alt_text || title || 'Ảnh tải lên',
            display_order: 0,
            is_cover: isCoverBool,
            is_avatar: isAvatarBool,
            is_active: true,
            file_size: variants.file_size,
            mime_type: variants.mime_type
          }, { transaction });

          createdImages.push(record);
        }
      }

      await transaction.commit();
      return createdImages;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Set image as cover with atomic transaction
   */
  static async setCoverImage(ownerUserId, imageId) {
    const image = await VenueImage.findByPk(imageId);
    if (!image) {
      const err = new Error('Không tìm thấy hình ảnh.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, image.venue_id);

    const transaction = await sequelize.transaction();
    try {
      // Deactivate other cover images for this venue
      await VenueImage.update(
        { is_cover: false },
        { where: { venue_id: image.venue_id, is_cover: true }, transaction }
      );

      image.is_cover = true;
      image.image_type = 'COVER';
      await image.save({ transaction });

      await transaction.commit();
      return image;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Set image as avatar with atomic transaction
   */
  static async setAvatarImage(ownerUserId, imageId) {
    const image = await VenueImage.findByPk(imageId);
    if (!image) {
      const err = new Error('Không tìm thấy hình ảnh.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, image.venue_id);

    const transaction = await sequelize.transaction();
    try {
      // Deactivate other avatar images for this venue
      await VenueImage.update(
        { is_avatar: false },
        { where: { venue_id: image.venue_id, is_avatar: true }, transaction }
      );

      image.is_avatar = true;
      image.image_type = 'AVATAR';
      await image.save({ transaction });

      await transaction.commit();
      return image;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Update image metadata
   */
  static async updateMedia(ownerUserId, imageId, payload) {
    const image = await VenueImage.findByPk(imageId);
    if (!image) {
      const err = new Error('Không tìm thấy hình ảnh.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, image.venue_id);

    const { title, caption, alt_text, image_type, display_order } = payload;

    if (title !== undefined) image.title = title;
    if (caption !== undefined) image.caption = caption;
    if (alt_text !== undefined) image.alt_text = alt_text;
    if (display_order !== undefined) image.display_order = parseInt(display_order, 10);

    if (image_type) {
      image.image_type = image_type;
      if (image_type === 'COVER') return await this.setCoverImage(ownerUserId, imageId);
      if (image_type === 'AVATAR') return await this.setAvatarImage(ownerUserId, imageId);
    }

    await image.save();
    return image;
  }

  /**
   * Delete media record and files
   */
  static async deleteMedia(ownerUserId, imageId) {
    const image = await VenueImage.findByPk(imageId);
    if (!image) {
      const err = new Error('Không tìm thấy hình ảnh.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, image.venue_id);

    // Remove files safely
    if (image.thumbnail_url) StorageService.deleteFile(image.thumbnail_url);
    if (image.medium_url) StorageService.deleteFile(image.medium_url);
    if (image.large_url) StorageService.deleteFile(image.large_url);
    if (image.original_url) StorageService.deleteFile(image.original_url);

    await image.destroy();
    return { success: true, message: 'Đã xóa hình ảnh thành công' };
  }

  /**
   * Bulk reorder images
   */
  static async reorderMedia(ownerUserId, venueId, orderList = []) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const transaction = await sequelize.transaction();
    try {
      for (const item of orderList) {
        if (item.image_id && item.display_order !== undefined) {
          await VenueImage.update(
            { display_order: parseInt(item.display_order, 10) },
            { where: { image_id: item.image_id, venue_id: venueId }, transaction }
          );
        }
      }
      await transaction.commit();
      return { success: true, message: 'Đã cập nhật thứ tự hiển thị hình ảnh.' };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Customer Public API: Get venue media gallery
   */
  static async getPublicVenueMedia(venueId, options = {}) {
    const { page = 1, limit = 30, image_type } = options;
    const offset = (page - 1) * limit;

    const where = { venue_id: venueId, is_active: true };
    if (image_type && image_type !== 'ALL') {
      where.image_type = image_type;
    }

    const { rows, count } = await VenueImage.findAndCountAll({
      where,
      order: [
        ['is_cover', 'DESC'],
        ['is_avatar', 'DESC'],
        ['display_order', 'ASC'],
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
        limit: parseInt(limit, 10)
      }
    };
  }
}

module.exports = MediaService;
