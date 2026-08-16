'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    payment_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      defaultValue: null
    },
    payment_method: {
      type: DataTypes.ENUM('MOMO', 'BANK_TRANSFER', 'CASH'),
      allowNull: false,
      defaultValue: 'MOMO'
    },
    payment_status: {
      type: DataTypes.ENUM('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED'),
      allowNull: false,
      defaultValue: 'INITIATED'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'VND'
    },
    provider_order_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    provider_request_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    provider_trans_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    pay_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    result_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    result_message: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    success_booking_id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.payment_status === 'SUCCESS' ? this.booking_id : null;
      }
    }
  }, {
    tableName: 'payments',
    underscored: true,
    timestamps: true
  });

  Payment.associate = function(models) {
    Payment.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    Payment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Payment.hasMany(models.PaymentIpnLog, { foreignKey: 'payment_id', as: 'ipn_logs' });
    Payment.hasMany(models.RefundTransaction, { foreignKey: 'payment_id', as: 'refunds' });
  };

  return Payment;
};
