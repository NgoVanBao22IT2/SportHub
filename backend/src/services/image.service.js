'use strict';

const crypto = require('crypto');
const venueService = require('./venue.service');
const branchService = require('./branch.service');
const courtService = require('./court.service');

class ImageService {
  /**
   * Verify ownership of the target (VENUE or COURT)
   */
  async _verifyTargetOwnership(ownerUserId, targetType, targetId, models, venueId = null, branchId = null) {
    if (targetType === 'VENUE') {
      await venueService.getVenueByIdForOwner(ownerUserId, targetId, models);
    } else if (targetType === 'COURT') {
      if (!venueId || !branchId) {
         const error = new Error('venueId and branchId are required to verify COURT ownership');
         error.statusCode = 400;
         throw error;
      }
      await courtService.getCourtByIdForOwner(ownerUserId, venueId, branchId, targetId, models);
    } else {
      const error = new Error('Invalid target_type');
      error.statusCode = 400;
      throw error;
    }
  }

  async uploadImage(ownerUserId, targetType, targetId, data, models, transaction = null) {
    // Note: data.venueId and data.branchId are passed in data object for COURT validation
    await this._verifyTargetOwnership(ownerUserId, targetType, targetId, models, data.venueId, data.branchId);

    const { image_url, display_order = 0, is_primary = false } = data;
    const imageId = crypto.randomUUID();

    const image = await models.VenueImage.create({
      image_id: imageId,
      target_type: targetType,
      target_id: targetId,
      image_url,
      display_order,
      is_primary
    }, { transaction });

    return image;
  }

  async getImagesByTarget(targetType, targetId, models) {
    return models.VenueImage.findAll({
      where: { target_type: targetType, target_id: targetId },
      order: [['display_order', 'ASC'], ['created_at', 'DESC']]
    });
  }

  async deleteImage(ownerUserId, imageId, data, models, transaction = null) {
    const image = await models.VenueImage.findByPk(imageId);
    if (!image) {
      const error = new Error('Image not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership before deleting
    await this._verifyTargetOwnership(ownerUserId, image.target_type, image.target_id, models, data.venueId, data.branchId);

    await image.destroy({ transaction });
    return { success: true, message: 'Image deleted successfully' };
  }
}

module.exports = new ImageService();
