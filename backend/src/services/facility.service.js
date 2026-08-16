'use strict';

const crypto = require('crypto');
const venueService = require('./venue.service');

class FacilityService {
  /**
   * ADMIN only: Create a global facility in the catalog
   */
  async createFacility(data, models, transaction = null) {
    const { facility_name, facility_icon } = data;
    const facilityId = crypto.randomUUID();

    const facility = await models.Facility.create({
      facility_id: facilityId,
      facility_name,
      facility_icon
    }, { transaction });

    return facility;
  }

  /**
   * Public: Get all facilities
   */
  async getFacilities(models) {
    return models.Facility.findAll({
      order: [['facility_name', 'ASC']]
    });
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
