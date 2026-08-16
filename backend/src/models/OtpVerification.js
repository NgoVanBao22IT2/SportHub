'use strict';

module.exports = (sequelize, DataTypes) => {
  const OtpVerification = sequelize.define('OtpVerification', {
    otp_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    otp_code_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    purpose: {
      type: DataTypes.ENUM('REGISTRATION', 'PASSWORD_RESET'),
      allowNull: false
    },
    attempt_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_consumed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'otp_verifications',
    timestamps: false,
    underscored: true
  });

  OtpVerification.associate = function(_models) {
    // OtpVerification keyed by email — no direct FK to users needed by service

  };

  return OtpVerification;
};
