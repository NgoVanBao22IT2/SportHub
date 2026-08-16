const { OperatingSchedule, Court, Branch, Venue } = require('../models');

class PricingService {
  /**
   * Determine the price rule and calculate the final price for a given court and time.
   */
  static async calculatePrice(courtId, date, startTime, endTime) {
    // 1. Fetch court with branch and venue to resolve hierarchy
    const court = await Court.findOne({
      where: { court_id: courtId },
      include: [{
        association: 'branch',
        include: ['venue']
      }]
    });

    if (!court) {
      const error = new Error('Court not found');
      error.statusCode = 404;
      throw error;
    }

    const branchId = court.branch_id;
    const venueId = court.branch.venue_id;

    // 2. Fetch OperatingSchedules for COURT, BRANCH, and VENUE
    const schedules = await OperatingSchedule.findAll({
      where: {
        scope_target_type: ['COURT', 'BRANCH', 'VENUE'],
        scope_target_id: [courtId, branchId, venueId]
      }
    });

    // 3. Determine the applicable day scope
    const dayOfWeek = new Date(date).getDay(); // 0 is Sunday, 1 is Monday...
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    const expectedDayScope = isWeekend ? 'WEEKEND' : 'WEEKDAY';
    // (Note: The actual day_scope values might be specific strings like 'T2-T6', 'T7-CN', 
    // but without exact schema enums, we attempt to match conceptually or fallback to a general schedule.
    // For this engine, we'll pick the one matching the ID in the hierarchy first.)

    // Build map for quick access
    const schedMap = {};
    schedules.forEach(s => {
      if (!schedMap[s.scope_target_type]) schedMap[s.scope_target_type] = [];
      schedMap[s.scope_target_type].push(s);
    });

    // Determine the active schedule (Hierarchy: COURT -> BRANCH -> VENUE)
    let activeSchedule = null;
    if (schedMap['COURT'] && schedMap['COURT'].length > 0) activeSchedule = schedMap['COURT'][0];
    else if (schedMap['BRANCH'] && schedMap['BRANCH'].length > 0) activeSchedule = schedMap['BRANCH'][0];
    else if (schedMap['VENUE'] && schedMap['VENUE'].length > 0) activeSchedule = schedMap['VENUE'][0];

    if (!activeSchedule) {
      const error = new Error('No operating schedule found for this court');
      error.statusCode = 400;
      throw error;
    }

    // 4. Validate Operating Hours
    // Format is "HH:mm:ss"
    if (startTime < activeSchedule.opening_time || endTime > activeSchedule.closing_time) {
      const error = new Error('Requested time is outside operating hours');
      error.statusCode = 400;
      throw error;
    }

    // 5. Calculate Duration
    // parse time "HH:mm" or "HH:mm:ss"
    const parseTime = (t) => {
      const parts = t.split(':');
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60 + (parts[2] ? parseInt(parts[2], 10) / 3600 : 0);
    };

    const startH = parseTime(startTime);
    const endH = parseTime(endTime);
    
    if (startH >= endH) {
      const error = new Error('start_time must be before end_time');
      error.statusCode = 400;
      throw error;
    }

    const durationHours = endH - startH;
    
    // TBD-PH08-PRICE-01: No billing increment rounding is applied. We use exact fractional hours.
    
    const basePrice = parseFloat(activeSchedule.base_hourly_price);
    const totalPrice = basePrice * durationHours;

    return {
      price_source_type: activeSchedule.scope_target_type,
      price_source_id: activeSchedule.scope_target_id,
      base_hourly_price: basePrice,
      duration_hours: durationHours,
      total_price: totalPrice,
      currency: 'VND'
    };
  }
}

module.exports = PricingService;
