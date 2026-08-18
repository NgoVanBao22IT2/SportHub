const { v4: uuidv4 } = require('uuid');
const { Booking, BookingStatusHistory, Court, SlotBlocking, CourtBlockRule, sequelize } = require('../models');
const { Op } = require('sequelize');
const PricingService = require('./pricing.service');

class BookingService {
  /**
   * 09.01 Create Booking & 09.03 Double Booking Protection
   * Core engine applying pessimistic locking on Court.
   */
  static async createBooking(userId, bookingData) {
    const { court_id, booking_date, start_time, end_time } = bookingData;

    // Validate times
    if (start_time >= end_time) {
      const error = new Error('start_time must be before end_time');
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Lock the Court row to prevent concurrent race conditions
      // This forces any simultaneous booking attempt for this specific court to wait.
      const court = await Court.findOne({
        where: { court_id },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!court) {
        const error = new Error('Court not found');
        error.statusCode = 404;
        throw error;
      }

      if (court.court_status !== 'ACTIVE') {
        const error = new Error(`Court is currently ${court.court_status}`);
        error.statusCode = 400;
        throw error;
      }

      // 2. Pricing & Schedule Validation
      let pricing;
      try {
        pricing = await PricingService.calculatePrice(court_id, booking_date, start_time, end_time);
      } catch (err) {
        if (err.message === 'Requested time is outside operating hours') {
          const error = new Error('Outside operating hours');
          error.statusCode = 400;
          throw error;
        }
        throw err;
      }

      // 3a. Check for One-time Blockings
      const blocking = await SlotBlocking.findOne({
        where: {
          court_id,
          block_date: booking_date,
          start_time: { [Op.lt]: end_time },
          end_time: { [Op.gt]: start_time }
        },
        transaction
      });

      if (blocking) {
        const error = new Error('Khung giờ này đã bị Chủ sân khóa.');
        error.statusCode = 409;
        throw error;
      }

      // 3b. Check for Active Long-Term Block Rules
      const blockRule = await CourtBlockRule.findOne({
        where: {
          court_id,
          status: 'ACTIVE',
          start_date: { [Op.lte]: booking_date },
          [Op.or]: [
            { end_date: null },
            { end_date: { [Op.gte]: booking_date } }
          ],
          start_time: { [Op.lt]: end_time },
          end_time: { [Op.gt]: start_time }
        },
        transaction
      });

      if (blockRule) {
        const error = new Error('Khung giờ này đã bị Chủ sân khóa.');
        error.statusCode = 409;
        error.code = 'SLOT_BLOCKED_BY_OWNER';
        throw error;
      }

      // 4. Double Booking Guard (Conflict Detection against Bookings)
      const conflict = await Booking.findOne({
        where: {
          court_id,
          booking_date,
          booking_status: {
            [Op.in]: ['HOLDING', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED']
          },
          start_time: { [Op.lt]: end_time },
          end_time: { [Op.gt]: start_time }
        },
        transaction
      });

      if (conflict) {
        const error = new Error('Time slot is already booked');
        error.statusCode = 409;
        error.code = 'BOOKING_SLOT_OCCUPIED';
        throw error;
      }

      // 5. Create Booking (Status: HOLDING)
      const bookingId = uuidv4();
      const holdExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes

      const booking = await Booking.create({
        booking_id: bookingId,
        customer_user_id: userId,
        court_id,
        booking_date,
        start_time,
        end_time,
        total_amount: pricing.total_price,
        currency: pricing.currency,
        booking_source: 'ONLINE_CUSTOMER',
        booking_status: 'HOLDING',
        hold_expiry_at: holdExpiry
      }, { transaction });

      // 6. Record State Transition in History
      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: bookingId,
        from_status: null,
        to_status: 'HOLDING',
        changed_by_user_id: userId,
        change_reason: 'User created booking'
      }, { transaction });

      await transaction.commit();
      return booking;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create Batch Bookings for multiple slots/courts within a single atomic transaction.
   */
  static async createBatchBookings(userId, payload) {
    const slots = Array.isArray(payload) ? payload : (payload.slots || [payload]);
    if (!slots || slots.length === 0) {
      const error = new Error('No booking slots provided');
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      const createdBookings = [];
      const holdExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes hold

      // Group slots by court_id & booking_date to merge contiguous time slots
      const grouped = {};
      slots.forEach(slot => {
        const key = `${slot.court_id}___${slot.booking_date}`;
        if (!grouped[key]) {
          grouped[key] = {
            court_id: slot.court_id,
            booking_date: slot.booking_date,
            intervals: []
          };
        }
        grouped[key].intervals.push({ start: slot.start_time, end: slot.end_time });
      });

      // For each group, merge contiguous intervals
      for (const key of Object.keys(grouped)) {
        const group = grouped[key];
        const court_id = group.court_id;
        const booking_date = group.booking_date;

        // Sort intervals by start_time
        group.intervals.sort((a, b) => a.start.localeCompare(b.start));

        const mergedIntervals = [];
        let current = null;
        for (const interval of group.intervals) {
          if (!current) {
            current = { ...interval };
          } else if (current.end === interval.start) {
            current.end = interval.end; // Merge continuous slot
          } else {
            mergedIntervals.push(current);
            current = { ...interval };
          }
        }
        if (current) mergedIntervals.push(current);

        // Lock court
        const court = await Court.findOne({
          where: { court_id },
          lock: transaction.LOCK.UPDATE,
          transaction
        });

        if (!court || court.court_status !== 'ACTIVE') {
          const error = new Error(`Court ${court ? court.court_name : court_id} is not available`);
          error.statusCode = 404;
          throw error;
        }

        // Process each merged interval
        for (const interval of mergedIntervals) {
          const { start: start_time, end: end_time } = interval;

          if (start_time >= end_time) {
            const error = new Error('start_time must be before end_time');
            error.statusCode = 400;
            throw error;
          }

          // Calculate price
          let pricing;
          try {
            pricing = await PricingService.calculatePrice(court_id, booking_date, start_time, end_time);
          } catch (err) {
            if (err.message === 'Requested time is outside operating hours') {
              const error = new Error('Outside operating hours');
              error.statusCode = 400;
              throw error;
            }
            throw err;
          }

          // Check blockings
          const blocking = await SlotBlocking.findOne({
            where: {
              court_id,
              block_date: booking_date,
              start_time: { [Op.lt]: end_time },
              end_time: { [Op.gt]: start_time }
            },
            transaction
          });

          if (blocking) {
            const error = new Error('One or more selected slots are blocked');
            error.statusCode = 409;
            throw error;
          }

          // Double booking check
          const conflict = await Booking.findOne({
            where: {
              court_id,
              booking_date,
              booking_status: {
                [Op.in]: ['HOLDING', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED']
              },
              start_time: { [Op.lt]: end_time },
              end_time: { [Op.gt]: start_time }
            },
            transaction
          });

          if (conflict) {
            const error = new Error('One or more selected slots are already booked');
            error.statusCode = 409;
            error.code = 'BOOKING_SLOT_OCCUPIED';
            throw error;
          }

          const bookingId = uuidv4();
          const booking = await Booking.create({
            booking_id: bookingId,
            customer_user_id: userId,
            court_id,
            booking_date,
            start_time,
            end_time,
            total_amount: pricing.total_price,
            currency: pricing.currency,
            booking_source: 'ONLINE_CUSTOMER',
            booking_status: 'HOLDING',
            hold_expiry_at: holdExpiry
          }, { transaction });

          await BookingStatusHistory.create({
            history_id: uuidv4(),
            booking_id: bookingId,
            from_status: null,
            to_status: 'HOLDING',
            changed_by_user_id: userId,
            change_reason: 'User created batch booking'
          }, { transaction });

          createdBookings.push(booking);
        }
      }

      await transaction.commit();
      return createdBookings;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 09.05 Booking Detail
   */
  static async getBooking(userId, bookingId) {
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        customer_user_id: userId // strictly enforce ownership
      }
    });

    if (!booking) {
      const error = new Error('Booking not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }
    return booking;
  }

  /**
   * 09.08 Booking History (Pagination supported)
   */
  static async getUserBookings(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (page < 1 || limit < 1 || limit > 100) {
      const error = new Error('Invalid pagination parameters');
      error.statusCode = 400;
      throw error;
    }

    const { rows, count } = await Booking.findAndCountAll({
      where: { customer_user_id: userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    };
  }

  /**
   * 09.06 Cancellation
   * Cancels a booking, logging the transition.
   */
  static async cancelBooking(userId, bookingId, reason = 'User requested cancellation') {
    const transaction = await sequelize.transaction();
    try {
      const booking = await Booking.findOne({
        where: {
          booking_id: bookingId,
          customer_user_id: userId // strictly enforce ownership
        },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!booking) {
        const error = new Error('Booking not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      // Valid statuses for user cancellation: HOLDING, CONFIRMED
      if (!['HOLDING', 'CONFIRMED'].includes(booking.booking_status)) {
        const error = new Error(`Cannot cancel booking in status: ${booking.booking_status}`);
        error.statusCode = 400;
        throw error;
      }

      const oldStatus = booking.booking_status;

      // Execute Transition
      booking.booking_status = 'CANCELLED';
      booking.cancellation_reason = reason;
      booking.cancelled_by_user_id = userId;
      booking.cancelled_at = new Date();
      
      await booking.save({ transaction });

      // Record Audit
      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: booking.booking_id,
        from_status: oldStatus,
        to_status: 'CANCELLED',
        changed_by_user_id: userId,
        change_reason: reason
      }, { transaction });

      await transaction.commit();
      return booking;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = BookingService;
