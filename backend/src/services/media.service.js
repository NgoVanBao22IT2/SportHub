'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Venue, VenueImage, sequelize } = require('../models');
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
   * Fetch paginated & filtered media gallery for owner's venue.
   */
  static async getOwnerVenueMedia(ownerUserId, venueId, options = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const {
      page = 1,
      limit = 24,
      image_type,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const where = { venue_id: venueId, is_active: true };

    if (image_type && image_type !== 'ALL') {
      where.image_type = image_type;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const query = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: query } },
        { caption: { [Op.like]: query } },
        { alt_text: { [Op.like]: query } },
        { tags: { [Op.like]: query } }
      ];
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = endDate;
      }
    }

    // Determine sorting
    let orderArray = [];
    const validSortFields = {
      created_at: 'created_at',
      title: 'title',
      file_size: 'file_size',
      display_order: 'display_order'
    };
    const sortField = validSortFields[sortBy] || 'created_at';
    const direction = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Cover & avatar pinned at top if sorting by default/created_at
    if (sortBy === 'created_at') {
      orderArray.push(['is_cover', 'DESC']);
      orderArray.push(['is_avatar', 'DESC']);
      orderArray.push(['display_order', 'ASC']);
    }
    orderArray.push([sortField, direction]);

    const { rows, count } = await VenueImage.findAndCountAll({
      where,
      order: orderArray,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit) || 1
      }
    };
  }

  /**
   * Get media statistics & counts for an owner venue
   */
  static async getMediaStats(ownerUserId, venueId) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const allImages = await VenueImage.findAll({
      where: { venue_id: venueId, is_active: true },
      attributes: ['image_id', 'image_type', 'is_cover', 'is_avatar', 'status', 'file_size']
    });

    const stats = {
      total: allImages.length,
      cover: 0,
      avatar: 0,
      venue: 0,
      facility: 0,
      event: 0,
      promotion: 0,
      tournament: 0,
      course: 0,
      other: 0,
      draft: 0,
      published: 0,
      archived: 0,
      totalSize: 0,
      hasCover: false,
      hasAvatar: false
    };

    allImages.forEach(img => {
      if (img.is_cover) {
        stats.cover++;
        stats.hasCover = true;
      }
      if (img.is_avatar) {
        stats.avatar++;
        stats.hasAvatar = true;
      }

      const type = (img.image_type || 'OTHER').toUpperCase();
      if (type === 'COVER' && !img.is_cover) stats.cover++;
      else if (type === 'AVATAR' && !img.is_avatar) stats.avatar++;
      else if (type === 'VENUE') stats.venue++;
      else if (type === 'FACILITY') stats.facility++;
      else if (type === 'EVENT') stats.event++;
      else if (type === 'PROMOTION') stats.promotion++;
      else if (type === 'TOURNAMENT') stats.tournament++;
      else if (type === 'COURSE') stats.course++;
      else if (type !== 'COVER' && type !== 'AVATAR') stats.other++;

      const st = (img.status || 'PUBLISHED').toUpperCase();
      if (st === 'DRAFT') stats.draft++;
      else if (st === 'ARCHIVED') stats.archived++;
      else stats.published++;

      stats.totalSize += (img.file_size || 0);
    });

    return stats;
  }

  /**
   * Upload single or multiple images with metadata & variant creation
   */
  static async uploadMedia(ownerUserId, venueId, files = [], base64List = [], bodyData = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    const {
      image_type = 'VENUE',
      title = '',
      caption = '',
      alt_text = '',
      is_cover = false,
      is_avatar = false,
      status = 'PUBLISHED',
      tags = '',
      event_id = null,
      promotion_id = null,
      tournament_id = null,
      course_id = null
    } = bodyData;

    const createdImages = [];
    const transaction = await sequelize.transaction();

    try {
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

      // 1. Process Multer Files
      if (files && files.length > 0) {
        for (const file of files) {
          StorageService.validateImage(file);
          const variants = await StorageService.saveImageBuffer(file.buffer, file.originalname);

          const imgId = uuidv4();
          const finalTitle = title || file.originalname.replace(/\.[^/.]+$/, '');

          const record = await VenueImage.create({
            image_id: imgId,
            venue_id: venueId,
            target_id: venueId,
            target_type: 'VENUE',
            avatar: isAvatarBool ? (variants.thumbnail_url || variants.medium_url) : null,
            cover: isCoverBool ? (variants.large_url || variants.medium_url) : null,
            thumbnail_url: variants.thumbnail_url,
            medium_url: variants.medium_url,
            large_url: variants.large_url,
            original_url: variants.original_url,
            image_type: isCoverBool ? 'COVER' : isAvatarBool ? 'AVATAR' : image_type,
            title: finalTitle,
            caption: caption || '',
            alt_text: alt_text || finalTitle,
            display_order: 0,
            is_cover: isCoverBool,
            is_avatar: isAvatarBool,
            is_active: true,
            status: status || 'PUBLISHED',
            tags: tags || null,
            event_id: event_id || null,
            promotion_id: promotion_id || null,
            tournament_id: tournament_id || null,
            course_id: course_id || null,
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
          const finalTitle = title || 'Ảnh tải lên';

          const record = await VenueImage.create({
            image_id: imgId,
            venue_id: venueId,
            target_id: venueId,
            target_type: 'VENUE',
            avatar: isAvatarBool ? (variants.thumbnail_url || variants.medium_url) : null,
            cover: isCoverBool ? (variants.large_url || variants.medium_url) : null,
            thumbnail_url: variants.thumbnail_url,
            medium_url: variants.medium_url,
            large_url: variants.large_url,
            original_url: variants.original_url,
            image_type: isCoverBool ? 'COVER' : isAvatarBool ? 'AVATAR' : image_type,
            title: finalTitle,
            caption: caption || '',
            alt_text: alt_text || finalTitle,
            display_order: 0,
            is_cover: isCoverBool,
            is_avatar: isAvatarBool,
            is_active: true,
            status: status || 'PUBLISHED',
            tags: tags || null,
            event_id: event_id || null,
            promotion_id: promotion_id || null,
            tournament_id: tournament_id || null,
            course_id: course_id || null,
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
   * Update image metadata and optionally replace image file
   */
  static async updateMedia(ownerUserId, imageId, payload = {}, newFile = null) {
    const image = await VenueImage.findByPk(imageId);
    if (!image) {
      const err = new Error('Không tìm thấy hình ảnh.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, image.venue_id);

    const {
      title,
      caption,
      alt_text,
      image_type,
      display_order,
      status,
      tags,
      event_id,
      promotion_id,
      tournament_id,
      course_id,
      base64_image
    } = payload;

    // Replace Image File if new file or Base64 is provided
    if (newFile || base64_image) {
      let variants;
      if (newFile) {
        StorageService.validateImage(newFile);
        variants = await StorageService.saveImageBuffer(newFile.buffer, newFile.originalname);
      } else if (base64_image) {
        variants = await StorageService.saveBase64Image(base64_image, title || image.title || 'updated_image');
      }

      if (variants) {
        // Delete old physical files safely
        if (image.thumbnail_url) StorageService.deleteFile(image.thumbnail_url);
        if (image.medium_url) StorageService.deleteFile(image.medium_url);
        if (image.large_url) StorageService.deleteFile(image.large_url);
        if (image.original_url) StorageService.deleteFile(image.original_url);

        if (image.is_avatar) image.avatar = variants.thumbnail_url || variants.medium_url;
        if (image.is_cover) image.cover = variants.large_url || variants.medium_url;
        image.thumbnail_url = variants.thumbnail_url;
        image.medium_url = variants.medium_url;
        image.large_url = variants.large_url;
        image.original_url = variants.original_url;
        image.file_size = variants.file_size;
        image.mime_type = variants.mime_type;
      }
    }

    if (title !== undefined) image.title = title;
    if (caption !== undefined) image.caption = caption;
    if (alt_text !== undefined) image.alt_text = alt_text;
    if (display_order !== undefined) image.display_order = parseInt(display_order, 10);
    if (status !== undefined) image.status = status;
    if (tags !== undefined) image.tags = tags;
    if (event_id !== undefined) image.event_id = event_id;
    if (promotion_id !== undefined) image.promotion_id = promotion_id;
    if (tournament_id !== undefined) image.tournament_id = tournament_id;
    if (course_id !== undefined) image.course_id = course_id;

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

    if (image.thumbnail_url) StorageService.deleteFile(image.thumbnail_url);
    if (image.medium_url) StorageService.deleteFile(image.medium_url);
    if (image.large_url) StorageService.deleteFile(image.large_url);
    if (image.original_url) StorageService.deleteFile(image.original_url);

    await image.destroy();
    return { success: true, message: 'Đã xóa hình ảnh thành công' };
  }

  /**
   * Bulk delete images
   */
  static async bulkDeleteMedia(ownerUserId, venueId, imageIds = []) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    if (!imageIds || imageIds.length === 0) {
      return { success: true, count: 0, message: 'Không có hình ảnh nào được chọn.' };
    }

    const images = await VenueImage.findAll({
      where: {
        venue_id: venueId,
        image_id: { [Op.in]: imageIds }
      }
    });

    let deletedCount = 0;
    for (const image of images) {
      if (image.thumbnail_url) StorageService.deleteFile(image.thumbnail_url);
      if (image.medium_url) StorageService.deleteFile(image.medium_url);
      if (image.large_url) StorageService.deleteFile(image.large_url);
      if (image.original_url) StorageService.deleteFile(image.original_url);

      await image.destroy();
      deletedCount++;
    }

    return {
      success: true,
      count: deletedCount,
      message: `Đã xóa ${deletedCount} hình ảnh thành công.`
    };
  }

  /**
   * Bulk update category or status
   */
  static async bulkUpdateMedia(ownerUserId, venueId, imageIds = [], updateData = {}) {
    await this.verifyVenueOwnership(ownerUserId, venueId);

    if (!imageIds || imageIds.length === 0) {
      return { success: true, count: 0, message: 'Không có hình ảnh nào được chọn.' };
    }

    const fieldsToUpdate = {};
    if (updateData.image_type) fieldsToUpdate.image_type = updateData.image_type;
    if (updateData.status) fieldsToUpdate.status = updateData.status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return { success: true, count: 0, message: 'Không có thông tin nào để cập nhật.' };
    }

    const [updatedCount] = await VenueImage.update(fieldsToUpdate, {
      where: {
        venue_id: venueId,
        image_id: { [Op.in]: imageIds }
      }
    });

    return {
      success: true,
      count: updatedCount,
      message: `Đã cập nhật ${updatedCount} hình ảnh.`
    };
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
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const where = {
      venue_id: venueId,
      is_active: true,
      status: 'PUBLISHED'
    };

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
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit) || 1
      }
    };
  }
}

module.exports = MediaService;
