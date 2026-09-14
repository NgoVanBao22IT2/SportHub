'use strict';

const crypto = require('crypto');
const venueService = require('./venue.service');

class FacilityService {
  /**
   * ADMIN only: Create a global facility in the catalog
   */
  /**
   * ADMIN / OWNER: Create a facility in the catalog
   */
  async createFacility(data, models, transaction = null) {
    const { facility_name, facility_icon } = data;
    const facilityId = data.facility_id || `fac_${crypto.randomUUID().substring(0, 8)}`;

    const facility = await models.Facility.create({
      facility_id: facilityId,
      facility_name,
      facility_icon: facility_icon || null
    }, { transaction });

    return facility;
  }

  /**
   * Get all facilities
   */
  async getFacilities(models) {
    return models.Facility.findAll({
      order: [['created_at', 'ASC'], ['facility_name', 'ASC']]
    });
  }

  /**
   * Update a facility in the catalog
   */
  async updateFacility(facilityId, data, models, transaction = null) {
    const { facility_name, facility_icon } = data;

    const targetId = String(facilityId).trim();

    const [updatedRows] = await models.Facility.update(
      {
        ...(facility_name !== undefined && { facility_name }),
        ...(facility_icon !== undefined && { facility_icon })
      },
      {
        where: { facility_id: targetId },
        transaction
      }
    );

    const facility = await models.Facility.findOne({ where: { facility_id: targetId } });
    if (!facility && updatedRows === 0) {
      const error = new Error('Không tìm thấy tiện ích để cập nhật.');
      error.statusCode = 404;
      throw error;
    }

    return facility;
  }

  /**
   * Delete a facility from the catalog idempotently
   */
  async deleteFacility(facilityId, models, transaction = null) {
    const targetId = String(facilityId).trim();

    // 1. Remove all mappings in venue_facilities
    await models.VenueFacility.destroy({
      where: { facility_id: targetId },
      transaction
    });

    // 2. Delete the facility record
    await models.Facility.destroy({
      where: { facility_id: targetId },
      transaction
    });

    return { success: true, message: 'Đã xóa tiện ích thành công.' };
  }

  /**
   * OWNER: Assign facility to venue
   */
  async assignFacilityToVenue(ownerUserId, venueId, facilityId, models, transaction = null) {
    // Tenant isolation check
    await venueService.getVenueByIdForOwner(ownerUserId, venueId, models);

    // Verify facility exists
    const facility = await models.Facility.findByPk(facilityId);
    if (!facility) {
        const error = new Error('Facility not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
    }

    const mapping = await models.VenueFacility.findOrCreate({
      where: { venue_id: venueId, facility_id: facilityId },
      transaction
    });

    return mapping[0];
  }

  /**
   * OWNER: Remove facility from venue
   */
  async removeFacilityFromVenue(ownerUserId, venueId, facilityId, models, transaction = null) {
    // Tenant isolation check
    await venueService.getVenueByIdForOwner(ownerUserId, venueId, models);

    await models.VenueFacility.destroy({
      where: { venue_id: venueId, facility_id: facilityId },
      transaction
    });

    return { success: true, message: 'Facility removed from venue successfully' };
  }
}

module.exports = new FacilityService();
