'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      payment_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
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
      user_id: {
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
      payment_method: {
        type: Sequelize.ENUM('MOMO'),
        allowNull: false,
        defaultValue: 'MOMO'
      },
      payment_status: {
        type: Sequelize.ENUM('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'INITIATED'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'VND'
      },
      provider_order_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: 'uq_payments_provider_order_id'
      },
      provider_request_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      provider_trans_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      pay_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      result_code: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      result_message: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      failed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
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

    await queryInterface.sequelize.query(`
      ALTER TABLE payments
      ADD COLUMN success_booking_id VARCHAR(36) 
      GENERATED ALWAYS AS (IF(payment_status = 'SUCCESS', booking_id, NULL)) VIRTUAL,
      ADD CONSTRAINT uq_payments_success_booking UNIQUE (success_booking_id);
    `);

    await queryInterface.addIndex('payments', ['booking_id', 'payment_status'], {
      name: 'idx_payments_booking_status'
    });

    await queryInterface.addIndex('payments', ['provider_trans_id'], {
      name: 'idx_payments_provider_trans_id'
    });

    await queryInterface.addIndex('payments', ['user_id'], {
      name: 'idx_payments_user_id'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE payments
      ADD CONSTRAINT chk_payments_amount_positive CHECK (amount >= 0),
      ADD CONSTRAINT chk_payments_currency_vnd CHECK (currency = 'VND');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  }
};
