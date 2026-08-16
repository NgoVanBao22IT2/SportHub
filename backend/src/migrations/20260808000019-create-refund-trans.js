'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('refund_transactions', {
      refund_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      payment_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'payments',
          key: 'payment_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      booking_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'booking_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      refund_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'VND'
      },
      refund_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      refund_status: {
        type: Sequelize.ENUM('REQUESTED', 'PROCESSING', 'SUCCESS', 'FAILED'),
        allowNull: false,
        defaultValue: 'REQUESTED'
      },
      provider_refund_trans_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      requested_by_user_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      refunded_at: {
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

    await queryInterface.addIndex('refund_transactions', ['payment_id', 'refund_status'], {
      name: 'idx_refunds_payment_status'
    });

    await queryInterface.addIndex('refund_transactions', ['booking_id'], {
      name: 'idx_refunds_booking_id'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE refund_transactions
      ADD CONSTRAINT chk_refunds_amount_positive CHECK (refund_amount >= 0),
      ADD CONSTRAINT chk_refunds_currency_vnd CHECK (currency = 'VND');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('refund_transactions');
  }
};
