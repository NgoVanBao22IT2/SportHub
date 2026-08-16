const AvailabilityService = require('../services/availability.service');

class AvailabilityController {
  static async checkAvailability(req, res, next) {
    try {
      const { courtId } = req.params;
      const { date, start_time, end_time } = req.query;

      const result = await AvailabilityService.checkAvailability(courtId, date, start_time, end_time);

      res.status(200).json({
        status: 'success',
        data: result
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

  static async getVenueDailyAvailability(req, res, next) {
    try {
      const { venueId } = req.params;
      const { date } = req.query;

      const result = await AvailabilityService.getVenueDailyAvailability(venueId, date);

      res.status(200).json({
        status: 'success',
        data: result
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

module.exports = AvailabilityController;
