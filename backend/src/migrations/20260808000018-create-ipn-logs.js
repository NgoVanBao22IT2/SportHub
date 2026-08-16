'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payment_ipn_logs', {
      ipn_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      payment_id: {
        type: Sequelize.STRING(36),
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'payments',
          key: 'payment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      provider_order_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      provider_trans_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      provider_request_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      result_code: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      signature: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      signature_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      raw_payload: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      processing_status: {
        type: Sequelize.ENUM('RECEIVED', 'PROCESSED', 'DUPLICATE_IGNORED', 'INVALID_SIGNATURE', 'FAILED'),
        allowNull: false,
        defaultValue: 'RECEIVED'
      },
      received_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('payment_ipn_logs', ['provider_order_id', 'provider_trans_id'], {
      name: 'idx_payment_ipn_logs_order_trans'
    });

    await queryInterface.addIndex('payment_ipn_logs', ['provider_trans_id', 'processing_status'], {
      name: 'idx_payment_ipn_logs_trans_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payment_ipn_logs');
  }
};
