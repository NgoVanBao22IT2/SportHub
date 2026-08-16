'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('venues', {
      venue_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      owner_user_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      venue_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      venue_description: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      operating_status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'PENDING'
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
    await queryInterface.dropTable('venues');
  }
};
