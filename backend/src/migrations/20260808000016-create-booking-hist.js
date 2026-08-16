'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('booking_status_history', {
      history_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      booking_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'booking_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      from_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null
      },
      to_status: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      changed_by_user_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      change_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('booking_status_history');
  }
};
