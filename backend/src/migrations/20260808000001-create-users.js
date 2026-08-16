'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: 'uq_users_email'
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      primary_role: {
        type: Sequelize.ENUM('CUSTOMER', 'OWNER', 'ADMIN'),
        allowNull: false,
        defaultValue: 'CUSTOMER'
      },
      account_status: {
        type: Sequelize.ENUM('UNVERIFIED', 'ACTIVE', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'UNVERIFIED'
      },
      email_verified_at: {
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
    await queryInterface.dropTable('users');
  }
};
