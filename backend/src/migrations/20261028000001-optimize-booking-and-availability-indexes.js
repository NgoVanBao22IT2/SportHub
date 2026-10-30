'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Helper to safely add index only if it does not already exist
    const safeAddIndex = async (tableName, columns, options) => {
      try {
        const [existingIndexes] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${options.name}'`
        );
        if (existingIndexes.length === 0) {
          await queryInterface.addIndex(tableName, columns, options);
          console.log(`[Migration] Added index ${options.name} on ${tableName}`);
        } else {
          console.log(`[Migration] Index ${options.name} already exists on ${tableName}, skipping.`);
        }
      } catch (err) {
        console.warn(`[Migration Warning] Could not add index ${options.name} on ${tableName}:`, err.message);
      }
    };

    // 1. Table: bookings (223k+ records)
    // 1a. Availability checking: court + date + status
    await safeAddIndex('bookings', ['court_id', 'booking_date', 'booking_status'], {
      name: 'idx_bookings_availability'
    });

    // 1b. Slot conflict range detection: court + date + start + end
    await safeAddIndex('bookings', ['court_id', 'booking_date', 'start_time', 'end_time'], {
      name: 'idx_bookings_slot_range'
    });

    // 1c. Customer booking history: customer + created_at
    await safeAddIndex('bookings', ['customer_user_id', 'created_at'], {
      name: 'idx_bookings_customer_created'
    });

    // 1d. Background worker cleaning expired holds: status + expiry
    await safeAddIndex('bookings', ['booking_status', 'hold_expiry_at'], {
      name: 'idx_bookings_hold_expiry'
    });

    // 2. Table: booking_status_history (223k+ records)
    // Timeline sorting without filesort
    await safeAddIndex('booking_status_history', ['booking_id', 'created_at'], {
      name: 'idx_bsh_booking_created'
    });

    // 3. Table: slot_blockings (69k+ records)
    // Fast lookup during availability check
    await safeAddIndex('slot_blockings', ['court_id', 'block_date', 'start_time', 'end_time'], {
      name: 'idx_slot_blockings_lookup'
    });

    // 4. Table: operating_schedules (2.8k records)
    // Eliminates Full Table Scan on every price calculation
    await safeAddIndex('operating_schedules', ['scope_target_type', 'scope_target_id', 'is_active'], {
      name: 'idx_operating_schedules_scope'
    });

    // 5. Table: court_block_rules
    // Fast checking of long-term recurring blocking rules
    await safeAddIndex('court_block_rules', ['court_id', 'status', 'start_date', 'end_date'], {
      name: 'idx_court_block_rules_lookup'
    });
  },

  down: async (queryInterface, Sequelize) => {
    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        const [existingIndexes] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = '${indexName}'`
        );
        if (existingIndexes.length > 0) {
          await queryInterface.removeIndex(tableName, indexName);
          console.log(`[Rollback] Removed index ${indexName} from ${tableName}`);
        }
      } catch (err) {
        console.warn(`[Rollback Warning] Could not remove index ${indexName} from ${tableName}:`, err.message);
      }
    };

    await safeRemoveIndex('court_block_rules', 'idx_court_block_rules_lookup');
    await safeRemoveIndex('operating_schedules', 'idx_operating_schedules_scope');
    await safeRemoveIndex('slot_blockings', 'idx_slot_blockings_lookup');
    await safeRemoveIndex('booking_status_history', 'idx_bsh_booking_created');
    await safeRemoveIndex('bookings', 'idx_bookings_hold_expiry');
    await safeRemoveIndex('bookings', 'idx_bookings_customer_created');
    await safeRemoveIndex('bookings', 'idx_bookings_slot_range');
    await safeRemoveIndex('bookings', 'idx_bookings_availability');
  }
};
