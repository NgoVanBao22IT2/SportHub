const { Court, SlotBlocking, CourtBlockRule, Booking, Venue, Branch } = require('../models');
const { Op } = require('sequelize');
const PricingService = require('./pricing.service');

class AvailabilityService {
  /**
   * Helper: Get local date (YYYY-MM-DD) and current time (HH:mm:ss)
   */
  static _getLocalNow() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');
    const curS = String(now.getSeconds()).padStart(2, '0');
    const currentTimeStr = `${curH}:${curM}:${curS}`;

    return { todayStr, currentTimeStr };
  }

  /**
   * Check court availability for a specific interval and return pricing if available.
   */
  static async checkAvailability(courtId, date, startTime, endTime) {
    // 1. Basic format validation
    if (!date || !startTime || !endTime) {
      const error = new Error('date, start_time, and end_time are required');
      error.statusCode = 400;
      throw error;
    }

    if (startTime >= endTime) {
      const error = new Error('start_time must be before end_time');
      error.statusCode = 400;
      throw error;
    }

    // 2. Past Date & Past Time Check
    const { todayStr, currentTimeStr } = this._getLocalNow();
    if (date < todayStr) {
      const error = new Error('Không thể xem hoặc đặt sân cho ngày đã qua.');
      error.statusCode = 400;
      error.code = 'PAST_DATE_NOT_ALLOWED';
      throw error;
    }

    const normStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    if (date === todayStr && normStart < currentTimeStr) {
      return {
        is_available: false,
        reason: 'Khung giờ này đã qua trong ngày hôm nay.'
      };
    }

    // 3. Court Status Check
    const court = await Court.findOne({ where: { court_id: courtId } });
    if (!court) {
      const error = new Error('Court not found');
      error.statusCode = 404;
      throw error;
    }

    if (court.court_status !== 'ACTIVE') {
      return {
        is_available: false,
        reason: `Court is currently ${court.court_status}`
      };
    }

    // 4. Operating Hours & Pricing Check
    let priceDetails;
    try {
      priceDetails = await PricingService.calculatePrice(courtId, date, startTime, endTime);
    } catch (err) {
      if (err.message === 'Requested time is outside operating hours' || err.code === 'NO_PRICE_RULE') {
        return {
          is_available: false,
          reason: 'Outside operating hours or no pricing rule'
        };
      }
      throw err;
    }

    // 5a. Check One-time Court Blockings
    const blocking = await SlotBlocking.findOne({
      where: {
        court_id: courtId,
        block_date: date,
        start_time: { [Op.lt]: endTime },
        end_time: { [Op.gt]: startTime }
      }
    });

    if (blocking) {
      return {
        is_available: false,
        reason: 'Court is blocked by owner during this time',
        block_reason: blocking.block_reason
      };
    }

    // 5b. Check Active Long-Term Court Block Rules
    const blockRule = await CourtBlockRule.findOne({
      where: {
        court_id: courtId,
        status: 'ACTIVE',
        start_date: { [Op.lte]: date },
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: date } }
        ],
        start_time: { [Op.lt]: endTime },
        end_time: { [Op.gt]: startTime }
      }
    });

    if (blockRule) {
      return {
        is_available: false,
        reason: 'Court is blocked by owner under a long-term rule',
        block_reason: blockRule.block_reason || 'Cho tới khi Owner mở lại'
      };
    }

    // 6. Check Existing Bookings (Conflict Detection)
    const booking = await Booking.findOne({
      where: {
        court_id: courtId,
        booking_date: date,
        booking_status: {
          [Op.in]: ['HOLDING', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED']
        },
        start_time: { [Op.lt]: endTime },
        end_time: { [Op.gt]: startTime }
      }
    });

    if (booking) {
      return {
        is_available: false,
        reason: 'Time slot is already booked'
      };
    }

    // Available!
    return {
      is_available: true,
      pricing: priceDetails
    };
  }

  /**
   * Fetch full visual schedule matrix & pricing for all courts in a venue for a given date.
   */
  static async getVenueDailyAvailability(venueId, date, pricingGroup = 'GENERAL', priceType = 'FIXED') {
    if (!venueId || !date) {
      const error = new Error('venueId and date are required');
      error.statusCode = 400;
      throw error;
    }

    const { todayStr, currentTimeStr } = this._getLocalNow();
    const isPastDate = date < todayStr;
    const isToday = date === todayStr;

    // 1. Load Venue with Branches and Courts
    const venue = await Venue.findOne({
      where: { venue_id: venueId },
      include: [
        {
          model: Branch,
          as: 'branches',
          include: [
            {
              model: Court,
              as: 'courts'
            }
          ]
        }
      ]
    });

    if (!venue) {
      const error = new Error('Venue not found');
      error.statusCode = 404;
      throw error;
    }

    // Collect all courts across branches
    const allCourts = [];
    if (venue.branches) {
      venue.branches.forEach(branch => {
        if (branch.courts) {
          allCourts.push(...branch.courts);
        }
      });
    }

    // Sort courts in ascending order (e.g. Sân 01, Sân 02, Sân 03, Sân 04, Sân 05)
    allCourts.sort((a, b) => (a.court_name || '').localeCompare(b.court_name || '', undefined, { numeric: true, sensitivity: 'base' }));

    const courtIds = allCourts.map(c => c.court_id);
    const sports = Array.from(new Set(allCourts.map(c => c.sport_category).filter(Boolean)));

    // 2a. Fetch all one-time blockings for these courts on the specified date
    const blockings = await SlotBlocking.findAll({
      where: {
        court_id: { [Op.in]: courtIds.length ? courtIds : ['__NONE__'] },
        block_date: date
      }
    });

    // 2b. Fetch active long-term block rules for these courts valid on the specified date
    const blockRules = await CourtBlockRule.findAll({
      where: {
        court_id: { [Op.in]: courtIds.length ? courtIds : ['__NONE__'] },
        status: 'ACTIVE',
        start_date: { [Op.lte]: date },
        [Op.or]: [
          { end_date: null },
          { end_date: { [Op.gte]: date } }
        ]
      }
    });

    // 3. Fetch all active bookings for these courts on the specified date
    const bookings = await Booking.findAll({
      where: {
        court_id: { [Op.in]: courtIds.length ? courtIds : ['__NONE__'] },
        booking_date: date,
        booking_status: {
          [Op.in]: ['HOLDING', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED']
        }
      }
    });

    // 4. Query OperatingSchedule from Database for opening and closing hours
    const { OperatingSchedule } = require('../models');
    const branchIds = (venue.branches || []).map(b => b.branch_id);
    const schedules = await OperatingSchedule.findAll({
      where: {
        scope_target_type: ['VENUE', 'BRANCH', 'COURT'],
        scope_target_id: [venueId, ...branchIds, ...courtIds]
      }
    });

    let openTimeStr = '05:00:00';
    let closeTimeStr = '23:30:00';

    if (schedules && schedules.length > 0) {
      const minOpen = schedules.map(s => s.opening_time).filter(Boolean).sort()[0];
      const maxClose = schedules.map(s => s.closing_time).filter(Boolean).sort().reverse()[0];
      if (minOpen) openTimeStr = minOpen;
      if (maxClose) closeTimeStr = maxClose;
    }

    const parseHHMM = (tStr) => {
      const parts = tStr.split(':');
      return {
        h: parseInt(parts[0], 10) || 5,
        m: parseInt(parts[1], 10) || 0
      };
    };

    const startObj = parseHHMM(openTimeStr);
    const endObj = parseHHMM(closeTimeStr);

    const timeSlots = [];
    let currH = startObj.h;
    let currM = startObj.m;

    while (currH < endObj.h || (currH === endObj.h && currM < endObj.m)) {
      const nextH = currM === 30 ? currH + 1 : currH;
      const nextM = currM === 30 ? 0 : 30;

      const sH = String(currH).padStart(2, '0');
      const sM = String(currM).padStart(2, '0');
      const eH = String(nextH).padStart(2, '0');
      const eM = String(nextM).padStart(2, '0');

      timeSlots.push({
        start_time: `${sH}:${sM}:00`,
        end_time: `${eH}:${eM}:00`,
        label: `${sH}:${sM} - ${eH}:${eM}`
      });

      currH = nextH;
      currM = nextM;
    }

    // Helper functions for time interval overlap check
    const isOverlapping = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;

    // 5. Build Court Matrix
    const courtMatrix = await Promise.all(
      allCourts.map(async (court) => {
        const courtBlockings = blockings.filter(b => b.court_id === court.court_id);
        const courtBlockRules = blockRules.filter(r => r.court_id === court.court_id);
        const courtBookings = bookings.filter(b => b.court_id === court.court_id);

        const slots = await Promise.all(
          timeSlots.map(async (slot) => {
            // A. Check Past Date & Past Slot Rule
            if (isPastDate) {
              return {
                ...slot,
                status: 'PAST',
                price: null,
                reason: 'Ngày đã qua'
              };
            }

            if (isToday && slot.start_time < currentTimeStr) {
              return {
                ...slot,
                status: 'PAST',
                price: null,
                reason: 'Đã qua thời gian'
              };
            }

            // B. Court Inactive Check
            if (court.court_status !== 'ACTIVE') {
              return {
                ...slot,
                status: 'UNAVAILABLE',
                price: null,
                reason: `Sân đang ${court.court_status === 'MAINTENANCE' ? 'Bảo trì' : 'Ngưng hoạt động'}`
              };
            }

            // C. Check pricing & operating schedule
            let pricing = null;
            try {
              pricing = await PricingService.calculatePrice(
                court.court_id,
                date,
                slot.start_time,
                slot.end_time,
                pricingGroup,
                priceType
              );
            } catch (err) {
              return {
                ...slot,
                status: 'CLOSED',
                price: null,
                reason: 'Ngoài giờ hoạt động'
              };
            }

            // D. Check one-time blockings
            const blockingMatch = courtBlockings.find(b =>
              isOverlapping(b.start_time, b.end_time, slot.start_time, slot.end_time)
            );
            if (blockingMatch) {
              const reasonStr = (blockingMatch.block_reason || '').toLowerCase();
              const isEvent = reasonStr.includes('sự kiện') || reasonStr.includes('event');
              return {
                ...slot,
                block_id: blockingMatch.block_id,
                status: isEvent ? 'EVENT' : 'LOCKED',
                price: pricing.total_price,
                reason: blockingMatch.block_reason || (isEvent ? 'Sự kiện đặc biệt' : 'Chủ sân tạm khóa')
              };
            }

            // E. Check active long-term block rules
            const ruleMatch = courtBlockRules.find(r =>
              isOverlapping(r.start_time, r.end_time, slot.start_time, slot.end_time)
            );
            if (ruleMatch) {
              const reasonStr = (ruleMatch.block_reason || '').toLowerCase();
              const isEvent = reasonStr.includes('sự kiện') || reasonStr.includes('event');
              return {
                ...slot,
                block_id: ruleMatch.rule_id,
                is_long_term: true,
                status: isEvent ? 'EVENT' : 'LOCKED',
                price: pricing.total_price,
                reason: ruleMatch.block_reason || 'Cho tới khi Owner mở lại'
              };
            }

            // F. Check bookings
            const bookingMatch = courtBookings.find(b =>
              isOverlapping(b.start_time, b.end_time, slot.start_time, slot.end_time)
            );
            if (bookingMatch) {
              return {
                ...slot,
                status: 'BOOKED',
                price: pricing.total_price,
                reason: 'Đã có người đặt'
              };
            }

            // G. Available!
            return {
              ...slot,
              status: 'AVAILABLE',
              price: pricing.total_price,
              reason: 'Còn trống'
            };
          })
        );

        return {
          court_id: court.court_id,
          court_name: court.court_name,
          sport_category: court.sport_category,
          court_status: court.court_status,
          slots
        };
      })
    );

    return {
      venue_id: venue.venue_id,
      venue_name: venue.venue_name,
      date,
      sports,
      time_slots: timeSlots,
      courts: courtMatrix
    };
  }
}

module.exports = AvailabilityService;
