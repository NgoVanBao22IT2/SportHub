'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('slot_blockings', {
      block_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      court_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'courts',
          key: 'court_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      block_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      block_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      created_by_owner_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE slot_blockings
      ADD CONSTRAINT chk_slot_blockings_time_order CHECK (end_time > start_time);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('slot_blockings');
  }
};
