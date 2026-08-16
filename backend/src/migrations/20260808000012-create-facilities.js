'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('facilities', {
      facility_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      facility_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: 'uq_facilities_name'
      },
      facility_icon: {
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
    await queryInterface.dropTable('facilities');
  }
};
