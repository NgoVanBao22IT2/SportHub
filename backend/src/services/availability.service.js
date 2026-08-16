const { Court, SlotBlocking, Booking, Venue, Branch } = require('../models');
const { Op } = require('sequelize');
const PricingService = require('./pricing.service');

class AvailabilityService {
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

    // 2. Court Status Check
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

    // 3. Operating Hours & Pricing Check
    let priceDetails;
    try {
      priceDetails = await PricingService.calculatePrice(courtId, date, startTime, endTime);
    } catch (err) {
      if (err.message === 'Requested time is outside operating hours') {
        return {
          is_available: false,
          reason: 'Outside operating hours'
        };
      }
      throw err;
    }

    // 4. Check Court Blockings
    // Conflict formula: block_start < requested_end AND block_end > requested_start
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

    // 5. Check Existing Bookings (Conflict Detection)
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
  static async getVenueDailyAvailability(venueId, date) {
    if (!venueId || !date) {
      const error = new Error('venueId and date parameters are required');
      error.statusCode = 400;
      throw error;
    }

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

    const courtIds = allCourts.map(c => c.court_id);
    const sports = Array.from(new Set(allCourts.map(c => c.sport_category).filter(Boolean)));

    // 2. Fetch all blockings for these courts on the specified date
    const blockings = await SlotBlocking.findAll({
      where: {
        court_id: { [Op.in]: courtIds.length ? courtIds : ['__NONE__'] },
        block_date: date
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

    let openTimeStr = '06:00:00';
    let closeTimeStr = '22:00:00';

    if (schedules && schedules.length > 0) {
      const sched = schedules[0];
      if (sched.opening_time) openTimeStr = sched.opening_time;
      if (sched.closing_time) closeTimeStr = sched.closing_time;
    }

    const parseHHMM = (tStr) => {
      const parts = tStr.split(':');
      return {
        h: parseInt(parts[0], 10) || 6,
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
        const courtBookings = bookings.filter(b => b.court_id === court.court_id);

        const slots = await Promise.all(
          timeSlots.map(async (slot) => {
            if (court.court_status !== 'ACTIVE') {
              return {
                ...slot,
                status: 'UNAVAILABLE',
                price: null,
                reason: `Sân đang ${court.court_status === 'MAINTENANCE' ? 'Bảo trì' : 'Ngưng hoạt động'}`
              };
            }

            // Check pricing & operating schedule
            let pricing = null;
            try {
              pricing = await PricingService.calculatePrice(
                court.court_id,
                date,
                slot.start_time,
                slot.end_time
              );
            } catch (err) {
              return {
                ...slot,
                status: 'UNAVAILABLE',
                price: null,
                reason: 'Ngoài giờ hoạt động'
              };
            }

            // Check blockings
            const blockingMatch = courtBlockings.find(b =>
              isOverlapping(b.start_time, b.end_time, slot.start_time, slot.end_time)
            );
            if (blockingMatch) {
              const reasonStr = (blockingMatch.block_reason || '').toLowerCase();
              const isEvent = reasonStr.includes('sự kiện') || reasonStr.includes('event');
              return {
                ...slot,
                status: isEvent ? 'EVENT' : 'BLOCKED',
                price: pricing.total_price,
                reason: blockingMatch.block_reason || (isEvent ? 'Sự kiện đặc biệt' : 'Chủ sân tạm khóa')
              };
            }

            // Check bookings
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

            // Available
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
