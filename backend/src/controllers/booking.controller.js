const BookingService = require('../services/booking.service');

class BookingController {
  static async createBooking(req, res, next) {
    try {
      const userId = req.user.userId;

      // Handle batch payload if slots array is provided
      if (Array.isArray(req.body) || (req.body && Array.isArray(req.body.slots))) {
        const bookings = await BookingService.createBatchBookings(userId, req.body);
        return res.status(201).json({
          status: 'success',
          data: bookings
        });
      }

      const { court_id, booking_date, start_time, end_time } = req.body;

      // 09.02 Booking Validation
      if (!court_id || !booking_date || !start_time || !end_time) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_INPUT',
          message: 'court_id, booking_date, start_time, and end_time are required'
        });
      }

      // Ensure time format HH:mm or HH:mm:ss
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_TIME_FORMAT',
          message: 'Time must be in HH:mm or HH:mm:ss format'
        });
      }

      const booking = await BookingService.createBooking(userId, {
        court_id,
        booking_date,
        start_time,
        end_time
      });

      res.status(201).json({
        status: 'success',
        data: booking
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'error',
          code: error.code || (error.statusCode === 404 ? 'NOT_FOUND' : (error.statusCode === 409 ? 'CONFLICT' : 'BAD_REQUEST')),
          message: error.message
        });
      }
      next(error);
    }
  }

  static async createBatchBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const bookings = await BookingService.createBatchBookings(userId, req.body);

      res.status(201).json({
        status: 'success',
        data: bookings
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'error',
          code: error.code || (error.statusCode === 404 ? 'NOT_FOUND' : (error.statusCode === 409 ? 'CONFLICT' : 'BAD_REQUEST')),
          message: error.message
        });
      }
      next(error);
    }
  }

  static async getBooking(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const booking = await BookingService.getBooking(userId, id);
      res.status(200).json({
        status: 'success',
        data: booking
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: error.message
        });
      }
      next(error);
    }
  }

  static async getUserBookings(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page, limit } = req.query;

      const result = await BookingService.getUserBookings(userId, { page, limit });
      res.status(200).json({
        status: 'success',
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'error',
          code: 'BAD_REQUEST',
          message: error.message
        });
      }
      next(error);
    }
  }

  static async cancelBooking(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await BookingService.cancelBooking(userId, id, reason);
      res.status(200).json({
        status: 'success',
        data: booking
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'error',
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = BookingController;
