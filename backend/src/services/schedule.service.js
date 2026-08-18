'use strict';

const crypto = require('crypto');

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

  /**
   * Helper: Parse days array into JSON string
   */
  _formatDaysOfWeek(days) {
    if (Array.isArray(days)) return JSON.stringify(days);
    if (typeof days === 'string') {
      try {
        const parsed = JSON.parse(days);
        if (Array.isArray(parsed)) return JSON.stringify(parsed);
      } catch (e) {
        // Not JSON string, split by comma or fallback
        const parts = days.split(',').map(d => d.trim()).filter(Boolean);
        if (parts.length > 0) return JSON.stringify(parts);
      }
    }
    return JSON.stringify(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
  }

  /**
   * Check time overlap between two intervals
   */
  _isTimeOverlapping(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Validate schedule overlap for SAME SCOPE + SAME PRICING GROUP + SAME DAY + OVERLAPPING TIME
   */
  async _validateScheduleOverlap(scopeTargetType, scopeTargetId, pricingGroup, daysOfWeekJson, startTime, endTime, excludeScheduleId, models) {
    const existingSchedules = await models.OperatingSchedule.findAll({
      where: {
        scope_target_type: scopeTargetType,
        scope_target_id: scopeTargetId,
        pricing_group: pricingGroup || 'GENERAL'
      }
    });

    let newDays = [];
    try {
      newDays = JSON.parse(daysOfWeekJson || '[]');
    } catch (e) { }

    for (const sched of existingSchedules) {
      if (excludeScheduleId && sched.schedule_id === excludeScheduleId) continue;
      if (sched.is_active === false || sched.is_active === 0) continue;

      let existingDays = [];
      if (sched.days_of_week) {
        try { existingDays = JSON.parse(sched.days_of_week); } catch (e) { }
      }

      // Check if any day overlaps
      const hasCommonDay = newDays.some(d => existingDays.includes(d)) ||
        (existingDays.length === 0 && newDays.length === 0);

      if (hasCommonDay) {
        if (this._isTimeOverlapping(startTime, endTime, sched.opening_time, sched.closing_time)) {
          const error = new Error(`Có một quy tắc bảng giá khác (${sched.day_scope}) đang áp dụng trùng khung giờ (${sched.opening_time} - ${sched.closing_time}) trong nhóm giá ${pricingGroup}.`);
          error.statusCode = 409;
          error.code = 'PRICE_RULE_OVERLAP';
          throw error;
        }
      }
    }
  }

  async createSchedule(ownerUserId, scopeTargetType, scopeTargetId, data, models, transaction = null) {
    await this._verifyScopeOwnership(ownerUserId, scopeTargetType, scopeTargetId, models);

    const {
      day_scope = 'Monday-Sunday',
      days = null,
      days_of_week = null,
      opening_time = '06:00:00',
      closing_time = '23:00:00',
      base_hourly_price = 100000,
      fixed_price = null,
      walk_in_price = null,
      peak_price_rules = null,
      pricing_group = 'GENERAL',
      pricingGroup = 'GENERAL',
      is_active = true
    } = data;

    const targetPricingGroup = pricingGroup || pricing_group || 'GENERAL';
    const targetDaysJson = this._formatDaysOfWeek(days || days_of_week || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
    const targetFixedPrice = fixed_price !== null && fixed_price !== undefined ? fixed_price : base_hourly_price;
    const targetWalkInPrice = walk_in_price !== null && walk_in_price !== undefined ? walk_in_price : base_hourly_price;

    // Validate Overlap for same group
    await this._validateScheduleOverlap(
      scopeTargetType,
      scopeTargetId,
      targetPricingGroup,
      targetDaysJson,
      opening_time,
      closing_time,
      null,
      models
    );

    const scheduleId = crypto.randomUUID();

    const schedule = await models.OperatingSchedule.create({
      schedule_id: scheduleId,
      scope_target_type: scopeTargetType,
      scope_target_id: scopeTargetId,
      pricing_group: targetPricingGroup,
      day_scope,
      days_of_week: targetDaysJson,
      opening_time,
      closing_time,
      base_hourly_price,
      fixed_price: targetFixedPrice,
      walk_in_price: targetWalkInPrice,
      peak_price_rules,
      is_active: is_active ?? true
    }, { transaction });

    return schedule;
  }

  async getSchedulesByScope(scopeTargetType, scopeTargetId, models) {
    return models.OperatingSchedule.findAll({
      where: { scope_target_type: scopeTargetType, scope_target_id: scopeTargetId },
      order: [['pricing_group', 'ASC'], ['created_at', 'DESC']]
    });
  }

  async updateSchedule(ownerUserId, scheduleId, data, models, transaction = null) {
    const schedule = await models.OperatingSchedule.findByPk(scheduleId);
    if (!schedule) {
      const error = new Error('Schedule not found');
      error.statusCode = 404;
      throw error;
    }

    await this._verifyScopeOwnership(ownerUserId, schedule.scope_target_type, schedule.scope_target_id, models);

    const {
      day_scope,
      days,
      days_of_week,
      opening_time,
      closing_time,
      base_hourly_price,
      fixed_price,
      walk_in_price,
      peak_price_rules,
      pricing_group,
      pricingGroup,
      is_active
    } = data;

    const targetPricingGroup = pricingGroup || pricing_group || schedule.pricing_group || 'GENERAL';
    const targetDaysJson = (days || days_of_week) ? this._formatDaysOfWeek(days || days_of_week) : schedule.days_of_week;
    const targetOpeningTime = opening_time || schedule.opening_time;
    const targetClosingTime = closing_time || schedule.closing_time;

    // Validate Overlap if active
    if (is_active !== false) {
      await this._validateScheduleOverlap(
        schedule.scope_target_type,
        schedule.scope_target_id,
        targetPricingGroup,
        targetDaysJson,
        targetOpeningTime,
        targetClosingTime,
        scheduleId,
        models
      );
    }

    if (pricing_group || pricingGroup) schedule.pricing_group = targetPricingGroup;
    if (day_scope) schedule.day_scope = day_scope;
    if (days || days_of_week) schedule.days_of_week = targetDaysJson;
    if (opening_time) schedule.opening_time = opening_time;
    if (closing_time) schedule.closing_time = closing_time;
    if (base_hourly_price !== undefined) schedule.base_hourly_price = base_hourly_price;
    if (fixed_price !== undefined) schedule.fixed_price = fixed_price;
    if (walk_in_price !== undefined) schedule.walk_in_price = walk_in_price;
    if (peak_price_rules !== undefined) schedule.peak_price_rules = peak_price_rules;
    if (is_active !== undefined) schedule.is_active = is_active;

    await schedule.save({ transaction });
    return schedule;
  }

  async toggleScheduleStatus(ownerUserId, scheduleId, models, transaction = null) {
    const schedule = await models.OperatingSchedule.findByPk(scheduleId);
    if (!schedule) {
      const error = new Error('Schedule not found');
      error.statusCode = 404;
      throw error;
    }

    await this._verifyScopeOwnership(ownerUserId, schedule.scope_target_type, schedule.scope_target_id, models);

    schedule.is_active = !schedule.is_active;
    await schedule.save({ transaction });
    return schedule;
  }

  async duplicateSchedule(ownerUserId, scheduleId, data, models, transaction = null) {
    const sourceSchedule = await models.OperatingSchedule.findByPk(scheduleId);
    if (!sourceSchedule) {
      const error = new Error('Source schedule not found');
      error.statusCode = 404;
      throw error;
    }

    await this._verifyScopeOwnership(ownerUserId, sourceSchedule.scope_target_type, sourceSchedule.scope_target_id, models);

    const newScheduleId = crypto.randomUUID();
    const targetDayScope = data?.day_scope || `${sourceSchedule.day_scope} (Bản sao)`;
    const targetPricingGroup = data?.pricing_group || data?.pricingGroup || sourceSchedule.pricing_group;

    const duplicatedSchedule = await models.OperatingSchedule.create({
      schedule_id: newScheduleId,
      scope_target_type: sourceSchedule.scope_target_type,
      scope_target_id: sourceSchedule.scope_target_id,
      pricing_group: targetPricingGroup,
      day_scope: targetDayScope,
      days_of_week: sourceSchedule.days_of_week,
      opening_time: sourceSchedule.opening_time,
      closing_time: sourceSchedule.closing_time,
      base_hourly_price: sourceSchedule.base_hourly_price,
      fixed_price: sourceSchedule.fixed_price,
      walk_in_price: sourceSchedule.walk_in_price,
      peak_price_rules: sourceSchedule.peak_price_rules,
      is_active: sourceSchedule.is_active
    }, { transaction });

    return duplicatedSchedule;
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
