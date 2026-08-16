'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('operating_schedules', {
      schedule_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      scope_target_type: {
        type: Sequelize.ENUM('VENUE', 'BRANCH', 'COURT'),
        allowNull: false,
        comment: 'Polymorphic Target Scope Type (TBD-DM-006)'
      },
      scope_target_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Polymorphic Target Scope ID (TBD-DM-006)'
      },
      day_scope: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      opening_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      closing_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      base_hourly_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      peak_price_rules: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('operating_schedules', ['scope_target_type', 'scope_target_id'], {
      name: 'idx_operating_schedules_scope'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE operating_schedules
      ADD CONSTRAINT chk_schedules_time CHECK (closing_time > opening_time);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('operating_schedules');
  }
};
