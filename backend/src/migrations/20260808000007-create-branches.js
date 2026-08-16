'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branches', {
      branch_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      venue_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'venues',
          key: 'venue_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branch_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      street_address: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      ward_district_city: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      geo_coordinates: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      branch_phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      branch_status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE'
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
    await queryInterface.dropTable('branches');
  }
};
