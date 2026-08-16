'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('favorite_venues', {
      customer_user_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      venue_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'venues',
          key: 'venue_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      added_at: {
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
    await queryInterface.dropTable('favorite_venues');
  }
};
