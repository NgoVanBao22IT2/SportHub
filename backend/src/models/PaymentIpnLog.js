'use strict';

module.exports = (sequelize, DataTypes) => {
  const PaymentIpnLog = sequelize.define('PaymentIpnLog', {
    ipn_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    payment_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      defaultValue: null
    },
    provider_order_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    provider_trans_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    provider_request_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    result_code: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    signature_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    raw_payload: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    processing_status: {
      type: DataTypes.ENUM('RECEIVED', 'PROCESSED', 'DUPLICATE_IGNORED', 'INVALID_SIGNATURE', 'FAILED'),
      allowNull: false,
      defaultValue: 'RECEIVED'
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'payment_ipn_logs',
    underscored: true,
    timestamps: false // only received_at is used
  });

  PaymentIpnLog.associate = function(models) {
    PaymentIpnLog.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
  };

  return PaymentIpnLog;
};
