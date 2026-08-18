const { OperatingSchedule, Court, Branch, Venue } = require('../models');

class PricingService {
  /**
   * Helper: Convert date string (YYYY-MM-DD) to day of week name (MONDAY, TUESDAY, etc.)
   */
  static getDayOfWeekName(dateStr) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return days[d.getDay()];
      }
    }
    const d = new Date(dateStr);
    return days[d.getDay()];
  }

  /**
   * Helper: Check if schedule matches day of week
   */
  static isDayMatching(schedule, dayName) {
    if (schedule.days_of_week) {
      try {
        const parsed = typeof schedule.days_of_week === 'string' ? JSON.parse(schedule.days_of_week) : schedule.days_of_week;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.includes(dayName);
        }
      } catch (err) {
        // Fall through
      }
    }

    const scope = (schedule.day_scope || '').toLowerCase();
    if (scope.includes('monday-sunday') || scope.includes('tất cả') || scope.includes('all') || scope.includes('everyday')) {
      return true;
    }

    const isWeekendDay = (dayName === 'SATURDAY' || dayName === 'SUNDAY');
    if (scope.includes('weekday') || scope.includes('t2-t6') || scope.includes('ngày thường')) {
      return !isWeekendDay;
    }
    if (scope.includes('weekend') || scope.includes('t7-cn') || scope.includes('cuối tuần')) {
      return isWeekendDay;
    }

    if (scope.includes(dayName.toLowerCase())) return true;
    if (dayName === 'MONDAY' && (scope.includes('thứ hai') || scope.includes('t2'))) return true;
    if (dayName === 'TUESDAY' && (scope.includes('thứ ba') || scope.includes('t3'))) return true;
    if (dayName === 'WEDNESDAY' && (scope.includes('thứ tư') || scope.includes('t4'))) return true;
    if (dayName === 'THURSDAY' && (scope.includes('thứ năm') || scope.includes('t5'))) return true;
    if (dayName === 'FRIDAY' && (scope.includes('thứ sáu') || scope.includes('t6'))) return true;
    if (dayName === 'SATURDAY' && (scope.includes('thứ bảy') || scope.includes('t7'))) return true;
    if (dayName === 'SUNDAY' && (scope.includes('chủ nhật') || scope.includes('cn'))) return true;

    return true;
  }

  /**
   * Determine the price rule and calculate the final price for a given court and time.
   */
  static async calculatePrice(courtId, date, startTime, endTime, pricingGroup = 'GENERAL', priceType = 'FIXED') {
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
    const dayName = this.getDayOfWeekName(date);

    // 2. Fetch OperatingSchedules for COURT, BRANCH, and VENUE
    const schedules = await OperatingSchedule.findAll({
      where: {
        scope_target_type: ['COURT', 'BRANCH', 'VENUE'],
        scope_target_id: [courtId, branchId, venueId]
      }
    });

    // Format start and end time with 8 chars (HH:mm:ss)
    const normStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    const normEnd = endTime.length === 5 ? `${endTime}:00` : endTime;

    const parseTime = (t) => {
      const parts = t.split(':');
      return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60 + (parts[2] ? parseInt(parts[2], 10) / 3600 : 0);
    };

    const startH = parseTime(normStart);
    const endH = parseTime(normEnd);

    if (startH >= endH) {
      const error = new Error('start_time must be before end_time');
      error.statusCode = 400;
      throw error;
    }

    // Filter active schedules matching pricingGroup and day & time range
    let matchingSchedules = schedules.filter(s =>
      (s.is_active === undefined || s.is_active === null || s.is_active === true || s.is_active === 1) &&
      (s.pricing_group === pricingGroup || (!s.pricing_group && pricingGroup === 'GENERAL')) &&
      this.isDayMatching(s, dayName) &&
      (s.opening_time || '00:00:00') <= normStart && (s.closing_time || '23:59:59') >= normEnd
    );

    // If requesting STUDENT group but no student rule configured, fallback to GENERAL group rules
    if (matchingSchedules.length === 0 && pricingGroup === 'STUDENT') {
      matchingSchedules = schedules.filter(s =>
        (s.is_active === undefined || s.is_active === null || s.is_active === true || s.is_active === 1) &&
        (s.pricing_group === 'GENERAL' || !s.pricing_group) &&
        this.isDayMatching(s, dayName) &&
        (s.opening_time || '00:00:00') <= normStart && (s.closing_time || '23:59:59') >= normEnd
      );
    }

    // Sort matching schedules by specificity:
    // 1. Specific days_of_week preferred over null/everyday
    // 2. Specific narrower time window preferred over wide opening hours
    matchingSchedules.sort((a, b) => {
      const aHasDays = a.days_of_week && a.days_of_week !== '[]' ? 1 : 0;
      const bHasDays = b.days_of_week && b.days_of_week !== '[]' ? 1 : 0;
      if (aHasDays !== bHasDays) return bHasDays - aHasDays;

      const parseSec = (tStr) => {
        const parts = (tStr || '00:00:00').split(':');
        return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60;
      };
      const aSpan = parseSec(a.closing_time) - parseSec(a.opening_time);
      const bSpan = parseSec(b.closing_time) - parseSec(b.opening_time);
      return aSpan - bSpan;
    });

    // Build map by scope for hierarchy selection
    const schedMap = {};
    matchingSchedules.forEach(s => {
      if (!schedMap[s.scope_target_type]) schedMap[s.scope_target_type] = [];
      schedMap[s.scope_target_type].push(s);
    });

    // Active schedule hierarchy: COURT -> BRANCH -> VENUE
    let activeSchedule = null;
    if (schedMap['COURT'] && schedMap['COURT'].length > 0) activeSchedule = schedMap['COURT'][0];
    else if (schedMap['BRANCH'] && schedMap['BRANCH'].length > 0) activeSchedule = schedMap['BRANCH'][0];
    else if (schedMap['VENUE'] && schedMap['VENUE'].length > 0) activeSchedule = schedMap['VENUE'][0];

    // If no single schedule covers the entire multi-hour interval, split into 30-min sub-intervals
    if (!activeSchedule) {
      if (endH - startH > 0.5) {
        let total = 0;
        let curr = startH;
        while (curr < endH) {
          const next = curr + 0.5;
          const curHStr = String(Math.floor(curr)).padStart(2, '0');
          const curMStr = curr % 1 !== 0 ? '30' : '00';
          const nxtHStr = String(Math.floor(next)).padStart(2, '0');
          const nxtMStr = next % 1 !== 0 ? '30' : '00';

          const subCalc = await this.calculatePrice(
            courtId,
            date,
            `${curHStr}:${curMStr}:00`,
            `${nxtHStr}:${nxtMStr}:00`,
            pricingGroup,
            priceType
          );
          total += subCalc.total_price;
          curr = next;
        }

        return {
          price_source_type: 'COMPOSITE',
          price_source_id: courtId,
          pricing_group: pricingGroup,
          price_type: priceType,
          base_hourly_price: total / (endH - startH),
          duration_hours: endH - startH,
          total_price: total,
          currency: 'VND'
        };
      }

      const error = new Error('No operating schedule found for this court at requested time');
      error.statusCode = 400;
      error.code = 'NO_PRICE_RULE';
      throw error;
    }

    // 3. Calculate Duration & Hourly Price
    const durationHours = endH - startH;

    let hourlyPrice;
    if (priceType === 'WALK_IN') {
      hourlyPrice = parseFloat(activeSchedule.walk_in_price || activeSchedule.base_hourly_price || 0);
    } else {
      hourlyPrice = parseFloat(activeSchedule.fixed_price || activeSchedule.base_hourly_price || 0);
    }

    if (!hourlyPrice || hourlyPrice === 0) {
      hourlyPrice = parseFloat(activeSchedule.base_hourly_price || 100000);
    }

    const totalPrice = hourlyPrice * durationHours;

    return {
      price_source_type: activeSchedule.scope_target_type,
      price_source_id: activeSchedule.scope_target_id,
      pricing_group: activeSchedule.pricing_group || pricingGroup,
      price_type: priceType,
      base_hourly_price: hourlyPrice,
      duration_hours: durationHours,
      total_price: totalPrice,
      currency: 'VND'
    };
  }
}

module.exports = PricingService;
