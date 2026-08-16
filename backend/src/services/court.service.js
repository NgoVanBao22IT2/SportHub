'use strict';

const crypto = require('crypto');
const branchService = require('./branch.service');

class CourtService {
  async createCourt(ownerUserId, venueId, branchId, data, models, transaction = null) {
    // Tenant Isolation check: Verify owner owns branch via venue
    await branchService.getBranchByIdForOwner(ownerUserId, venueId, branchId, models);

    const { court_name, sport_category, surface_features } = data;
    const courtId = crypto.randomUUID();

    const court = await models.Court.create({
      court_id: courtId,
      branch_id: branchId,
      court_name,
      sport_category,
      court_status: 'ACTIVE',
      surface_features
    }, { transaction });

    return court;
  }

  async getCourtsByBranch(ownerUserId, venueId, branchId, models) {
    // Tenant Isolation check
    await branchService.getBranchByIdForOwner(ownerUserId, venueId, branchId, models);

    return models.Court.findAll({
      where: { branch_id: branchId },
      order: [['created_at', 'DESC']]
    });
  }

  async getCourtByIdForOwner(ownerUserId, venueId, branchId, courtId, models) {
    // Verify owner owns branch
    await branchService.getBranchByIdForOwner(ownerUserId, venueId, branchId, models);

    const court = await models.Court.findOne({
      where: { court_id: courtId, branch_id: branchId }
    });

    if (!court) {
      const error = new Error('Court not found or access denied');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return court;
  }

  async updateCourt(ownerUserId, venueId, branchId, courtId, data, models, transaction = null) {
    const court = await this.getCourtByIdForOwner(ownerUserId, venueId, branchId, courtId, models);

    const { court_name, sport_category, court_status, surface_features } = data;

    await court.update({
      court_name: court_name !== undefined ? court_name : court.court_name,
      sport_category: sport_category !== undefined ? sport_category : court.sport_category,
      court_status: court_status !== undefined ? court_status : court.court_status,
      surface_features: surface_features !== undefined ? surface_features : court.surface_features
    }, { transaction });

    return court;
  }

  async deleteCourt(ownerUserId, venueId, branchId, courtId, models, transaction = null) {
    const court = await this.getCourtByIdForOwner(ownerUserId, venueId, branchId, courtId, models);
    await court.destroy({ transaction });
    return { success: true, message: 'Court deleted successfully' };
  }
}

module.exports = new CourtService();
