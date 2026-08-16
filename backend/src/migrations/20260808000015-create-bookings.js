'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      booking_id: {
        type: Sequelize.STRING(36),
        primaryKey: true,
        allowNull: false
      },
      customer_user_id: {
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
      court_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'courts',
          key: 'court_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      booking_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'VND'
      },
      booking_source: {
        type: Sequelize.ENUM('ONLINE_CUSTOMER', 'MANUAL_OFFLINE'),
        allowNull: false,
        defaultValue: 'ONLINE_CUSTOMER'
      },
      booking_status: {
        type: Sequelize.ENUM('AVAILABLE', 'HOLDING', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'PAYMENT_FAILED'),
        allowNull: false,
        defaultValue: 'HOLDING'
      },
      hold_expiry_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      cancelled_by_user_id: {
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
      cancelled_at: {
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

    await queryInterface.addIndex('bookings', ['court_id', 'booking_date', 'start_time'], {
      name: 'idx_bookings_court_date_time'
    });

    await queryInterface.addIndex('bookings', ['customer_user_id', 'booking_status'], {
      name: 'idx_bookings_customer_status'
    });

    await queryInterface.addIndex('bookings', ['booking_status', 'hold_expiry_at'], {
      name: 'idx_bookings_hold_expiry'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings
      ADD CONSTRAINT chk_bookings_total_amount_positive CHECK (total_amount >= 0),
      ADD CONSTRAINT chk_bookings_currency_vnd CHECK (currency = 'VND'),
      ADD CONSTRAINT chk_bookings_time_order CHECK (end_time > start_time);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  }
};
