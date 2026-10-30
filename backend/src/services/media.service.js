'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Venue, VenueImage, sequelize } = require('../models');
const StorageService = require('./storage.service');

function fixVietnameseText(str) {
  if (!str) return '';
  let s = String(str);
  s = s
    .replace(/\u00CC\u2030/g, '\u0309')
    .replace(/\u00CC\u20AC/g, '\u0300')
    .replace(/\u00CC\u0080/g, '\u0300')
    .replace(/\u00CC\u0301/g, '\u0301')
    .replace(/\u00CC\u0081/g, '\u0301')
    .replace(/\u00C3\u00AA/g, 'ê')
    .replace(/\u00C3\u00B4/g, 'ô')
    .replace(/\u00C3\u00A2/g, 'â')
    .replace(/\u00C4\u0091/g, 'đ')
    .replace(/AÌ[‰€\s]?nh|AÌ‰nh|AÌ€nh|AÌ nh/gi, 'Ảnh')
    .replace(/biÌ[€\s]?a|biÌ€a|biÌ a/gi, 'bìa')
    .replace(/sẠen|sẠân/gi, 'sân')
    .replace(/Khẩng|Khảng/gi, 'Không');
  try {
    s = s.normalize('NFC');
  } catch (e) {}
  return s.trim();
}

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
      attributes: ['image_id', 'image_type', 'is_cover', 'is_avatar', 'status']
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
    });

    return stats;
  }

  /**
   * Upload single or multiple images directly to Cloudinary and persist to MySQL.
   * If Cloudinary fails: no database record created, no local files stored.
   * If database save fails: newly uploaded Cloudinary assets are automatically rolled back/cleaned up.
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
      is_primary = false,
      status = 'PUBLISHED',
      tags = '',
      event_id = null,
      promotion_id = null,
      tournament_id = null,
      course_id = null
    } = bodyData;

    const isCoverBool = (is_cover === true || is_cover === 'true' || image_type === 'COVER');
    const isAvatarBool = (is_avatar === true || is_avatar === 'true' || image_type === 'AVATAR');
    const isPrimaryBool = (is_primary === true || is_primary === 'true' || isCoverBool);

    const uploadedCloudinaryAssets = [];
    const createdImages = [];
    const transaction = await sequelize.transaction();

    try {
      // 1. If marking as Cover or Avatar, reset previous designations
      if (isCoverBool) {
        await VenueImage.update(
          { is_cover: false, is_primary: false },
          { where: { venue_id: venueId, is_cover: true }, transaction }
        );
      }

      if (isAvatarBool) {
        await VenueImage.update(
          { is_avatar: false },
          { where: { venue_id: venueId, is_avatar: true }, transaction }
        );
      }

      // 2. Process Multer Buffer Files via Cloudinary
      if (files && files.length > 0) {
        for (const file of files) {
          StorageService.validateImage(file);
          const uploadRes = await StorageService.uploadToCloudinary(file.buffer, {
            folder: `sporthub/venues/${venueId}`
          });
          uploadedCloudinaryAssets.push(uploadRes.public_id);

          const imgId = uuidv4();
          const rawTitle = title || file.originalname.replace(/\.[^/.]+$/, '');
          const finalTitle = fixVietnameseText(rawTitle);

          const record = await VenueImage.create({
            image_id: imgId,
            venue_id: venueId,
            uploaded_by: ownerUserId,
            target_id: venueId,
            target_type: 'VENUE',
            original_url: uploadRes.secure_url,
            cloudinary_public_id: uploadRes.public_id,
            avatar: isAvatarBool ? uploadRes.secure_url : null,
            cover: isCoverBool ? uploadRes.secure_url : null,
            image_type: isCoverBool ? 'COVER' : isAvatarBool ? 'AVATAR' : image_type,
            title: finalTitle,
            caption: caption || '',
            alt_text: alt_text || finalTitle,
            display_order: 0,
            is_primary: isPrimaryBool,
            is_cover: isCoverBool,
            is_avatar: isAvatarBool,
            is_active: true,
            status: status || 'PUBLISHED',
            tags: tags || null,
            event_id: event_id || null,
            promotion_id: promotion_id || null,
            tournament_id: tournament_id || null,
            course_id: course_id || null
          }, { transaction });

          createdImages.push(record);
        }
      }

      // 3. Process Base64 Data URLs via Cloudinary
      if (base64List && base64List.length > 0) {
        for (const b64 of base64List) {
          const uploadRes = await StorageService.uploadBase64ToCloudinary(b64, {
            folder: `sporthub/venues/${venueId}`
          });
          uploadedCloudinaryAssets.push(uploadRes.public_id);

          const imgId = uuidv4();
          const rawTitle = title || 'Ảnh tải lên';
          const finalTitle = fixVietnameseText(rawTitle);

          const record = await VenueImage.create({
            image_id: imgId,
            venue_id: venueId,
            uploaded_by: ownerUserId,
            target_id: venueId,
            target_type: 'VENUE',
            original_url: uploadRes.secure_url,
            cloudinary_public_id: uploadRes.public_id,
            avatar: isAvatarBool ? uploadRes.secure_url : null,
            cover: isCoverBool ? uploadRes.secure_url : null,
            image_type: isCoverBool ? 'COVER' : isAvatarBool ? 'AVATAR' : image_type,
            title: finalTitle,
            caption: caption || '',
            alt_text: alt_text || finalTitle,
            display_order: 0,
            is_primary: isPrimaryBool,
            is_cover: isCoverBool,
            is_avatar: isAvatarBool,
            is_active: true,
            status: status || 'PUBLISHED',
            tags: tags || null,
            event_id: event_id || null,
            promotion_id: promotion_id || null,
            tournament_id: tournament_id || null,
            course_id: course_id || null
          }, { transaction });

          createdImages.push(record);
        }
      }

      await transaction.commit();
      return createdImages;
    } catch (err) {
      await transaction.rollback();

      // Compensating Transaction: Cleanup newly uploaded Cloudinary assets
      if (uploadedCloudinaryAssets.length > 0) {
        console.warn(`[Cloudinary Rollback] Cleaning up ${uploadedCloudinaryAssets.length} assets due to DB transaction failure...`);
        for (const pubId of uploadedCloudinaryAssets) {
          await StorageService.deleteFromCloudinary(pubId).catch(cleanupErr => {
            console.error(`[Cloudinary Cleanup Failure for ${pubId}]`, cleanupErr.message);
          });
        }
      }

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
        { is_cover: false, is_primary: false },
        { where: { venue_id: image.venue_id, is_cover: true }, transaction }
      );

      image.is_cover = true;
      image.is_primary = true;
      image.cover = image.original_url;
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
      image.avatar = image.original_url;
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
   * Update image metadata and optionally replace image file in Cloudinary.
   * If replacing: upload new asset first -> update DB -> delete old asset from Cloudinary only after DB succeeds.
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

    let newlyUploadedPublicId = null;
    const oldPublicId = image.cloudinary_public_id;
    const oldOriginalUrl = image.original_url;

    try {
      // 1. Replace Image File if new file or Base64 is provided
      if (newFile || base64_image) {
        let uploadRes;
        if (newFile) {
          StorageService.validateImage(newFile);
          uploadRes = await StorageService.uploadToCloudinary(newFile.buffer, {
            folder: `sporthub/venues/${image.venue_id}`
          });
        } else if (base64_image) {
          uploadRes = await StorageService.uploadBase64ToCloudinary(base64_image, {
            folder: `sporthub/venues/${image.venue_id}`
          });
        }

        if (uploadRes) {
          newlyUploadedPublicId = uploadRes.public_id;
          image.original_url = uploadRes.secure_url;
          image.cloudinary_public_id = uploadRes.public_id;

          if (image.is_avatar) image.avatar = uploadRes.secure_url;
          if (image.is_cover) image.cover = uploadRes.secure_url;
        }
      }

      // 2. Update metadata fields
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
        if (image_type === 'COVER') {
          return await this.setCoverImage(ownerUserId, imageId);
        }
        if (image_type === 'AVATAR') {
          return await this.setAvatarImage(ownerUserId, imageId);
        }
      }

      await image.save();

      // 3. After database save is confirmed: cleanup old Cloudinary or local asset safely
      if (newlyUploadedPublicId && oldPublicId && oldPublicId !== newlyUploadedPublicId) {
        await StorageService.deleteFromCloudinary(oldPublicId).catch(delErr => {
          console.warn('[Cloudinary Old Asset Delete Warning]', delErr.message);
        });
      }
      if (newlyUploadedPublicId && oldOriginalUrl && oldOriginalUrl.startsWith('/uploads/')) {
        await StorageService.deleteFile(oldOriginalUrl);
      }

      return image;
    } catch (err) {
      // Compensating action: if new file was uploaded to Cloudinary but DB save failed, delete new asset
      if (newlyUploadedPublicId) {
        await StorageService.deleteFromCloudinary(newlyUploadedPublicId).catch(cleanupErr => {
          console.error('[Cloudinary Cleanup Error]', cleanupErr.message);
        });
      }
      throw err;
    }
  }

  /**
   * Delete media record and Cloudinary asset
   */
  static async deleteMedia(ownerUserId, imageId) {
    const image = await VenueImage.findByPk(imageId);
    if (!image) {
      const err = new Error('Không tìm thấy hình ảnh.');
      err.statusCode = 404;
      throw err;
    }

    await this.verifyVenueOwnership(ownerUserId, image.venue_id);

    // Delete physical asset from Cloudinary
    if (image.cloudinary_public_id) {
      await StorageService.deleteFromCloudinary(image.cloudinary_public_id);
    } else if (image.original_url) {
      await StorageService.deleteFile(image.original_url);
    }

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
      if (image.cloudinary_public_id) {
        await StorageService.deleteFromCloudinary(image.cloudinary_public_id);
      } else if (image.original_url) {
        await StorageService.deleteFile(image.original_url);
      }

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
