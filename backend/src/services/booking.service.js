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

      // Notify customer on booking creation
      try {
        const NotificationService = require('./notification.service');
        await NotificationService.createNotification({
          recipientUserId: userId,
          type: 'BOOKING_CREATED',
          title: 'Đặt giữ sân thành công',
          message: `Đơn đặt sân #${booking.booking_id.substring(0, 8)} ngày ${booking.booking_date} (${String(booking.start_time).substring(0, 5)} - ${String(booking.end_time).substring(0, 5)}) đã được khởi tạo thành công.`,
          entityType: 'BOOKING',
          entityId: booking.booking_id
        });
      } catch (e) {
        console.error('Failed to notify customer on booking creation:', e.message);
      }

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
    const { Court, Branch, Venue, Payment, Review } = require('../models');
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        customer_user_id: userId // strictly enforce ownership
      },
      include: [
        {
          model: Court,
          as: 'court',
          include: [
            {
              model: Branch,
              as: 'branch',
              include: [
                {
                  model: Venue,
                  as: 'venue'
                }
              ]
            }
          ]
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: Review,
          as: 'review'
        }
      ]
    });

    if (!booking) {
      const error = new Error('Booking not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    // Auto complete if past slot
    if (booking.booking_status === 'CONFIRMED') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      if (booking.booking_date < todayStr || (booking.booking_date === todayStr && booking.end_time <= currentTimeStr)) {
        booking.booking_status = 'COMPLETED';
        await booking.save().catch(() => {});
      }
    }

    return booking;
  }

  /**
   * 09.08 Booking History (Pagination supported)
   */
  static async getUserBookings(userId, options = {}) {
    const { Court, Branch, Venue, Payment, Review } = require('../models');
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    if (page < 1 || limit < 1 || limit > 100) {
      const error = new Error('Invalid pagination parameters');
      error.statusCode = 400;
      throw error;
    }

    // Auto transition past confirmed bookings to COMPLETED
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      await Booking.update(
        { booking_status: 'COMPLETED' },
        {
          where: {
            booking_status: 'CONFIRMED',
            customer_user_id: userId,
            [Op.or]: [
              { booking_date: { [Op.lt]: todayStr } },
              {
                booking_date: todayStr,
                end_time: { [Op.lte]: currentTimeStr }
              }
            ]
          }
        }
      );
    } catch (autoCompErr) {
      console.warn('Auto complete booking non-blocking warning:', autoCompErr.message);
    }

    const { rows, count } = await Booking.findAndCountAll({
      where: { customer_user_id: userId },
      include: [
        {
          model: Court,
          as: 'court',
          include: [
            {
              model: Branch,
              as: 'branch',
              include: [
                {
                  model: Venue,
                  as: 'venue'
                }
              ]
            }
          ]
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: Review,
          as: 'review'
        }
      ],
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
   * Calculate Refund Policy based on time remaining before match start time.
   */
  static calculateRefundPolicy(bookingDateStr, startTimeStr, totalAmount) {
    const amount = parseFloat(totalAmount || 0);
    if (!bookingDateStr || !startTimeStr) {
      return { refund_rate: 100, refund_amount: amount, hours_left: 999, policy_description: 'Trên 24 giờ trước giờ chơi (Hoàn 100%)' };
    }

    const dateParts = String(bookingDateStr).split('-').map(p => parseInt(p, 10));
    const timeParts = String(startTimeStr).split(':').map(p => parseInt(p, 10));

    const matchTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
    const now = new Date();

    const diffMs = matchTime.getTime() - now.getTime();
    const hoursLeft = diffMs / (1000 * 60 * 60);

    let refundRate = 0;
    let description = '';

    if (hoursLeft > 24) {
      refundRate = 100;
      description = 'Trên 24 giờ trước giờ chơi (Hoàn 100%)';
    } else if (hoursLeft >= 12 && hoursLeft <= 24) {
      refundRate = 70;
      description = '12 – 24 giờ trước giờ chơi (Hoàn 70%)';
    } else if (hoursLeft >= 2 && hoursLeft < 12) {
      refundRate = 50;
      description = '2 – 12 giờ trước giờ chơi (Hoàn 50%)';
    } else {
      refundRate = 0;
      description = 'Dưới 2 giờ trước giờ chơi (Không hoàn tiền)';
    }

    const refundAmount = Math.round((amount * refundRate) / 100);

    return {
      refund_rate: refundRate,
      refund_amount: refundAmount,
      hours_left: Math.max(0, Math.round(hoursLeft * 10) / 10),
      policy_description: description
    };
  }

  /**
   * 09.06 Cancellation
   * Cancels or requests cancellation for a booking based on time rules.
   */
  static async cancelBooking(userId, bookingId, reason = '') {
    if (!reason || !reason.trim()) {
      const error = new Error('Vui lòng nhập lý do hủy đơn đặt sân.');
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      const booking = await Booking.findOne({
        where: {
          booking_id: bookingId,
          customer_user_id: userId
        },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!booking) {
        const error = new Error('Booking not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      // Valid statuses for user cancellation
      if (!['HOLDING', 'PAYMENT_PENDING', 'WAITING_OWNER_CONFIRMATION', 'CONFIRMED'].includes(booking.booking_status)) {
        const error = new Error(`Không thể hủy đơn hàng ở trạng thái: ${booking.booking_status}`);
        error.statusCode = 400;
        throw error;
      }

      // Prevent cancelling past or completed bookings
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      if (
        booking.booking_status === 'COMPLETED' ||
        booking.booking_date < todayStr ||
        (booking.booking_date === todayStr && booking.start_time <= currentTimeStr)
      ) {
        const error = new Error('Không thể hủy đơn đặt sân khi thời gian đặt đã qua hoặc đơn đã hoàn thành.');
        error.statusCode = 400;
        throw error;
      }

      const oldStatus = booking.booking_status;
      const totalAmt = parseFloat(booking.total_amount || 0);

      // If unpaid holding booking, cancel immediately
      if (['HOLDING', 'PAYMENT_PENDING'].includes(oldStatus)) {
        booking.booking_status = 'CANCELLED';
        booking.cancellation_reason = reason.trim();
        booking.refund_rate = 0;
        booking.refund_amount = 0;
        booking.cancelled_by_user_id = userId;
        booking.cancelled_at = new Date();

        await booking.save({ transaction });

        await BookingStatusHistory.create({
          history_id: uuidv4(),
          booking_id: booking.booking_id,
          from_status: oldStatus,
          to_status: 'CANCELLED',
          changed_by_user_id: userId,
          change_reason: reason.trim()
        }, { transaction });

        await transaction.commit();

        // Notify customer on immediate cancel
        try {
          const NotificationService = require('./notification.service');
          await NotificationService.createNotification({
            recipientUserId: userId,
            type: 'BOOKING_CANCELLED',
            title: 'Hủy đơn đặt sân thành công',
            message: `Đơn đặt sân #${booking.booking_id.substring(0, 8)} đã được hủy thành công.`,
            entityType: 'BOOKING',
            entityId: booking.booking_id
          });
        } catch (e) {
          console.error('Failed to notify customer on cancel:', e.message);
        }

        return booking;
      }

      // For paid/confirmed bookings, calculate policy and set status to CANCEL_REQUESTED
      const policy = this.calculateRefundPolicy(booking.booking_date, booking.start_time, totalAmt);

      booking.booking_status = 'CANCEL_REQUESTED';
      booking.cancellation_reason = reason.trim();
      booking.refund_rate = policy.refund_rate;
      booking.refund_amount = policy.refund_amount;
      booking.cancelled_by_user_id = userId;
      booking.cancelled_at = new Date();

      await booking.save({ transaction });

      await BookingStatusHistory.create({
        history_id: uuidv4(),
        booking_id: booking.booking_id,
        from_status: oldStatus,
        to_status: 'CANCEL_REQUESTED',
        changed_by_user_id: userId,
        change_reason: `Yêu cầu hủy (${policy.policy_description}): ${reason.trim()}`
      }, { transaction });

      await transaction.commit();

      // Notify customer on cancel request
      try {
        const NotificationService = require('./notification.service');
        await NotificationService.createNotification({
          recipientUserId: userId,
          type: 'BOOKING_CANCELLED',
          title: 'Đã gửi yêu cầu hủy đơn đặt sân',
          message: `Yêu cầu hủy đơn đặt sân #${booking.booking_id.substring(0, 8)} đã được gửi tới chủ sân để xử lý (${policy.policy_description}).`,
          entityType: 'BOOKING',
          entityId: booking.booking_id
        });
      } catch (e) {
        console.error('Failed to notify customer on cancel request:', e.message);
      }

      return booking;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = BookingService;
