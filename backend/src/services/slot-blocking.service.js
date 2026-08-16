const { v4: uuidv4 } = require('uuid');
const { SlotBlocking, Court, Booking, sequelize } = require('../models');
const { Op } = require('sequelize');

class SlotBlockingService {
  /**
   * Create a new manual court block.
   */
  static async createBlock(ownerId, blockData) {
    const { court_id, block_date, start_time, end_time, block_reason } = blockData;

    // Validate times
    if (!start_time || !end_time || start_time >= end_time) {
      const error = new Error('Invalid time interval');
      error.statusCode = 400;
      throw error;
    }

    // Verify Court exists and belongs to owner
    const court = await Court.findOne({
      where: { court_id },
      include: [{
        association: 'branch',
        include: [{
          association: 'venue',
          where: { owner_user_id: ownerId }
        }]
      }]
    });

    if (!court || !court.branch || !court.branch.venue) {
      const error = new Error('Court not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    // Check for overlap with existing bookings (HOLDING, PAYMENT_PENDING, CONFIRMED)
    // Formula: existing_start < requested_end AND existing_end > requested_start
    const overlappingBookings = await Booking.findOne({
      where: {
        court_id,
        booking_date: block_date,
        booking_status: {
          [Op.in]: ['HOLDING', 'PAYMENT_PENDING', 'CONFIRMED']
        },
        start_time: { [Op.lt]: end_time },
        end_time: { [Op.gt]: start_time }
      }
    });

    if (overlappingBookings) {
      const error = new Error('Cannot block slot with existing active bookings');
      error.statusCode = 409;
      throw error;
    }

    // Check for overlap with existing blocks
    const overlappingBlocks = await SlotBlocking.findOne({
      where: {
        court_id,
        block_date,
        start_time: { [Op.lt]: end_time },
        end_time: { [Op.gt]: start_time }
      }
    });

    if (overlappingBlocks) {
      const error = new Error('Slot already blocked for this time interval');
      error.statusCode = 409;
      throw error;
    }

    // Create block
    const block = await SlotBlocking.create({
      block_id: uuidv4(),
      court_id,
      block_date,
      start_time,
      end_time,
      block_reason,
      created_by_owner_id: ownerId
    });

    return block;
  }

  /**
   * Delete a court block.
   */
  static async deleteBlock(ownerId, blockId) {
    const block = await SlotBlocking.findOne({
      where: { block_id: blockId },
      include: [{
        association: 'court',
        include: [{
          association: 'branch',
          include: [{
            association: 'venue',
            where: { owner_user_id: ownerId }
          }]
        }]
      }]
    });

    if (!block || !block.court || !block.court.branch || !block.court.branch.venue) {
      const error = new Error('Block not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    await block.destroy();
    return true;
  }
}

module.exports = SlotBlockingService;
