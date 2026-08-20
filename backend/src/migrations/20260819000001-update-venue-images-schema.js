'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('venue_images').catch(() => null);
    if (!tableInfo) return;

    if (!tableInfo.status) {
      await queryInterface.addColumn('venue_images', 'status', {
        type: Sequelize.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'PUBLISHED'
      });
    }

    if (!tableInfo.tags) {
      await queryInterface.addColumn('venue_images', 'tags', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableInfo.width) {
      await queryInterface.addColumn('venue_images', 'width', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!tableInfo.height) {
      await queryInterface.addColumn('venue_images', 'height', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!tableInfo.event_id) {
      await queryInterface.addColumn('venue_images', 'event_id', {
        type: Sequelize.STRING(36),
        allowNull: true
      });
    }

    if (!tableInfo.promotion_id) {
      await queryInterface.addColumn('venue_images', 'promotion_id', {
        type: Sequelize.STRING(36),
        allowNull: true
      });
    }

    if (!tableInfo.tournament_id) {
      await queryInterface.addColumn('venue_images', 'tournament_id', {
        type: Sequelize.STRING(36),
        allowNull: true
      });
    }

    if (!tableInfo.course_id) {
      await queryInterface.addColumn('venue_images', 'course_id', {
        type: Sequelize.STRING(36),
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('venue_images').catch(() => null);
    if (!tableInfo) return;

    if (tableInfo.status) await queryInterface.removeColumn('venue_images', 'status');
    if (tableInfo.tags) await queryInterface.removeColumn('venue_images', 'tags');
    if (tableInfo.width) await queryInterface.removeColumn('venue_images', 'width');
    if (tableInfo.height) await queryInterface.removeColumn('venue_images', 'height');
    if (tableInfo.event_id) await queryInterface.removeColumn('venue_images', 'event_id');
    if (tableInfo.promotion_id) await queryInterface.removeColumn('venue_images', 'promotion_id');
    if (tableInfo.tournament_id) await queryInterface.removeColumn('venue_images', 'tournament_id');
    if (tableInfo.course_id) await queryInterface.removeColumn('venue_images', 'course_id');
  }
};
