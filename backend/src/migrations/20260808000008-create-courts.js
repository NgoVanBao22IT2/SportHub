'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('courts', {
      court_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      branch_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'branches',
          key: 'branch_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      court_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      sport_category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      court_status: {
        type: Sequelize.ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE'
      },
      surface_features: {
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('courts');
  }
};
