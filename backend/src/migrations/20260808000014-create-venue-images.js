'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('venue_images', {
      image_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      target_type: {
        type: Sequelize.ENUM('VENUE', 'COURT'),
        allowNull: false,
        comment: 'Polymorphic Target Type'
      },
      target_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        comment: 'Polymorphic Target Scope ID'
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('venue_images', ['target_type', 'target_id'], {
      name: 'idx_venue_images_target'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('venue_images');
  }
};
