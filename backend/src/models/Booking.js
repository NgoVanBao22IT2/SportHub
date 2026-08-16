'use strict';

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    booking_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    customer_user_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      defaultValue: null
    },
    court_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'VND'
    },
    booking_source: {
      type: DataTypes.ENUM('ONLINE_CUSTOMER', 'MANUAL_OFFLINE'),
      allowNull: false,
      defaultValue: 'ONLINE_CUSTOMER'
    },
    booking_status: {
      type: DataTypes.ENUM('AVAILABLE', 'HOLDING', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'WAITING_OWNER_CONFIRMATION', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'PAYMENT_FAILED'),
      allowNull: false,
      defaultValue: 'HOLDING'
    },
    hold_expiry_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    payment_proof_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    cancelled_by_user_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      defaultValue: null
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'bookings',
    underscored: true,
    timestamps: true
  });

  Booking.associate = function(models) {
    Booking.belongsTo(models.User, { foreignKey: 'customer_user_id', as: 'customer' });
    Booking.belongsTo(models.Court, { foreignKey: 'court_id', as: 'court' });
    Booking.belongsTo(models.User, { foreignKey: 'cancelled_by_user_id', as: 'cancelled_by' });
    Booking.hasMany(models.BookingStatusHistory, { foreignKey: 'booking_id', as: 'status_history' });
    Booking.hasMany(models.Payment, { foreignKey: 'booking_id', as: 'payments' });
    Booking.hasMany(models.RefundTransaction, { foreignKey: 'booking_id', as: 'refunds' });
  };

  return Booking;
};
