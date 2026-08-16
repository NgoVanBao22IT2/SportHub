'use strict';

module.exports = (sequelize, DataTypes) => {
  const RefundTransaction = sequelize.define('RefundTransaction', {
    refund_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    payment_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    booking_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    refund_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'VND'
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    refund_status: {
      type: DataTypes.ENUM('REQUESTED', 'PROCESSING', 'SUCCESS', 'FAILED'),
      allowNull: false,
      defaultValue: 'REQUESTED'
    },
    provider_refund_trans_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    requested_by_user_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'refund_transactions',
    underscored: true,
    timestamps: true
  });

  RefundTransaction.associate = function(models) {
    RefundTransaction.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
    RefundTransaction.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    RefundTransaction.belongsTo(models.User, { foreignKey: 'requested_by_user_id', as: 'requested_by' });
  };

  return RefundTransaction;
};
