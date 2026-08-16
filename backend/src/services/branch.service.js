'use strict';

const crypto = require('crypto');
const venueService = require('./venue.service');

class BranchService {
  async createBranch(ownerUserId, venueId, data, models, transaction = null) {
    // Tenant Isolation check: Verify owner owns the venue
    await venueService.getVenueByIdForOwner(ownerUserId, venueId, models);

    const { branch_name, street_address, ward_district_city, geo_coordinates, branch_phone } = data;
    const branchId = crypto.randomUUID();

    const branch = await models.Branch.create({
      branch_id: branchId,
      venue_id: venueId,
      branch_name,
      street_address,
      ward_district_city,
      geo_coordinates,
      branch_phone,
      branch_status: 'ACTIVE'
    }, { transaction });

    return branch;
  }

  async getBranchesByVenue(ownerUserId, venueId, models) {
    // Tenant Isolation check
    await venueService.getVenueByIdForOwner(ownerUserId, venueId, models);

    return models.Branch.findAll({
      where: { venue_id: venueId },
      order: [['created_at', 'DESC']]
    });
  }

  async getBranchByIdForOwner(ownerUserId, venueId, branchId, models) {
    // Verify owner owns venue
    await venueService.getVenueByIdForOwner(ownerUserId, venueId, models);

    const branch = await models.Branch.findOne({
      where: { branch_id: branchId, venue_id: venueId }
    });

    if (!branch) {
      const error = new Error('Branch not found or access denied');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return branch;
  }

  async updateBranch(ownerUserId, venueId, branchId, data, models, transaction = null) {
    const branch = await this.getBranchByIdForOwner(ownerUserId, venueId, branchId, models);

    const { branch_name, street_address, ward_district_city, geo_coordinates, branch_phone, branch_status } = data;

    await branch.update({
      branch_name: branch_name !== undefined ? branch_name : branch.branch_name,
      street_address: street_address !== undefined ? street_address : branch.street_address,
      ward_district_city: ward_district_city !== undefined ? ward_district_city : branch.ward_district_city,
      geo_coordinates: geo_coordinates !== undefined ? geo_coordinates : branch.geo_coordinates,
      branch_phone: branch_phone !== undefined ? branch_phone : branch.branch_phone,
      branch_status: branch_status !== undefined ? branch_status : branch.branch_status
    }, { transaction });

    return branch;
  }

  async deleteBranch(ownerUserId, venueId, branchId, models, transaction = null) {
    const branch = await this.getBranchByIdForOwner(ownerUserId, venueId, branchId, models);
    await branch.destroy({ transaction });
    return { success: true, message: 'Branch deleted successfully' };
  }
}

module.exports = new BranchService();
