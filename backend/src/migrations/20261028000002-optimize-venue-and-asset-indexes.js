'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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

    // 1. Table: venues (2.7k records)
    // Eliminates Full Table Scan on public venue discovery
    await safeAddIndex('venues', ['operating_status'], {
      name: 'idx_venues_status'
    });

    // Owner venues dashboard query
    await safeAddIndex('venues', ['owner_user_id', 'operating_status'], {
      name: 'idx_venues_owner_status'
    });

    // 2. Table: branches (2.7k records)
    await safeAddIndex('branches', ['venue_id', 'branch_status'], {
      name: 'idx_branches_venue_status'
    });

    // 3. Table: courts (13.9k records)
    await safeAddIndex('courts', ['branch_id', 'court_status'], {
      name: 'idx_courts_branch_status'
    });

    await safeAddIndex('courts', ['branch_id', 'sport_category', 'court_status'], {
      name: 'idx_courts_branch_sport_status'
    });

    // 4. Table: venue_images (13.9k records)
    // Eliminates filesort when loading gallery in display order
    await safeAddIndex('venue_images', ['venue_id', 'display_order'], {
      name: 'idx_venue_images_venue_order'
    });

    await safeAddIndex('venue_images', ['target_type', 'target_id', 'is_active'], {
      name: 'idx_venue_images_target'
    });

    // 5. Table: venue_payment_accounts
    await safeAddIndex('venue_payment_accounts', ['venue_id', 'is_active'], {
      name: 'idx_vpa_venue_active'
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

    await safeRemoveIndex('venue_payment_accounts', 'idx_vpa_venue_active');
    await safeRemoveIndex('venue_images', 'idx_venue_images_target');
    await safeRemoveIndex('venue_images', 'idx_venue_images_venue_order');
    await safeRemoveIndex('courts', 'idx_courts_branch_sport_status');
    await safeRemoveIndex('courts', 'idx_courts_branch_status');
    await safeRemoveIndex('branches', 'idx_branches_venue_status');
    await safeRemoveIndex('venues', 'idx_venues_owner_status');
    await safeRemoveIndex('venues', 'idx_venues_status');
  }
};
