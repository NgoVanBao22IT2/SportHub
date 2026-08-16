'use strict';

const crypto = require('crypto');
const venueService = require('./venue.service');
const branchService = require('./branch.service');
const courtService = require('./court.service');

class ScheduleService {
  async _verifyScopeOwnership(ownerUserId, scopeTargetType, scopeTargetId, models) {
    if (scopeTargetType === 'VENUE') {
      const venue = await models.Venue.findOne({
        where: { venue_id: scopeTargetId, owner_user_id: ownerUserId }
      });
      if (!venue) {
        const error = new Error('Venue not found or access denied');
        error.statusCode = 404;
        throw error;
      }
    } else if (scopeTargetType === 'BRANCH') {
      const branch = await models.Branch.findOne({
        where: { branch_id: scopeTargetId },
        include: [{
          model: models.Venue,
          as: 'venue',
          where: { owner_user_id: ownerUserId }
        }]
      });
      if (!branch) {
        const error = new Error('Branch not found or access denied');
        error.statusCode = 404;
        throw error;
      }
    } else if (scopeTargetType === 'COURT') {
      const court = await models.Court.findOne({
        where: { court_id: scopeTargetId },
        include: [{
          model: models.Branch,
          as: 'branch',
          include: [{
            model: models.Venue,
            as: 'venue',
            where: { owner_user_id: ownerUserId }
          }]
        }]
      });
      if (!court) {
        const error = new Error('Court not found or access denied');
        error.statusCode = 404;
        throw error;
      }
    } else {
      const error = new Error('Invalid scope_target_type');
      error.statusCode = 400;
      throw error;
    }
  }

  async createSchedule(ownerUserId, scopeTargetType, scopeTargetId, data, models, transaction = null) {
    await this._verifyScopeOwnership(ownerUserId, scopeTargetType, scopeTargetId, models);

    const { day_scope, opening_time, closing_time, base_hourly_price, peak_price_rules } = data;
    const scheduleId = crypto.randomUUID();

    const schedule = await models.OperatingSchedule.create({
      schedule_id: scheduleId,
      scope_target_type: scopeTargetType,
      scope_target_id: scopeTargetId,
      day_scope,
      opening_time,
      closing_time,
      base_hourly_price,
      peak_price_rules
    }, { transaction });

    return schedule;
  }

  async getSchedulesByScope(scopeTargetType, scopeTargetId, models) {
    return models.OperatingSchedule.findAll({
      where: { scope_target_type: scopeTargetType, scope_target_id: scopeTargetId }
    });
  }

  async deleteSchedule(ownerUserId, scheduleId, data, models, transaction = null) {
    const schedule = await models.OperatingSchedule.findByPk(scheduleId);
    if (!schedule) {
      const error = new Error('Schedule not found');
      error.statusCode = 404;
      throw error;
    }

    await this._verifyScopeOwnership(ownerUserId, schedule.scope_target_type, schedule.scope_target_id, models);
    
    await schedule.destroy({ transaction });
    return { success: true, message: 'Schedule deleted successfully' };
  }
}

module.exports = new ScheduleService();
