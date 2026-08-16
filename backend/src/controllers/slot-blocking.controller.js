const SlotBlockingService = require('../services/slot-blocking.service');

class SlotBlockingController {
  static async createBlock(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { courtId } = req.params;
      const { block_date, start_time, end_time, block_reason } = req.body;

      // Ensure valid dates
      if (!block_date || !start_time || !end_time) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_INPUT',
          message: 'block_date, start_time, and end_time are required'
        });
      }

      const block = await SlotBlockingService.createBlock(ownerId, {
        court_id: courtId,
        block_date,
        start_time,
        end_time,
        block_reason
      });

      res.status(201).json({
        status: 'success',
        data: block
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          status: 'error',
          code: error.statusCode === 404 ? 'NOT_FOUND' : (error.statusCode === 409 ? 'CONFLICT' : 'BAD_REQUEST'),
          message: error.message
        });
      }
      next(error);
    }
  }

  static async deleteBlock(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { blockId } = req.params;

      await SlotBlockingService.deleteBlock(ownerId, blockId);

      res.status(200).json({
        status: 'success',
        message: 'Block deleted successfully'
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

module.exports = SlotBlockingController;
