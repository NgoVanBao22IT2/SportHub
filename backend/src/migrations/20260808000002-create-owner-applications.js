'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('owner_applications', {
      application_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      applicant_user_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      business_info: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      application_status: {
        type: Sequelize.ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING_REVIEW'
      },
      reviewer_admin_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      reviewed_at: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('owner_applications');
  }
};
