'use strict';

module.exports = (sequelize, DataTypes) => {
  const VenuePaymentAccount = sequelize.define('VenuePaymentAccount', {
    account_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    venue_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('MOMO', 'BANK_TRANSFER'),
      allowNull: false,
      defaultValue: 'MOMO'
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    account_number: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    bank_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    qr_code_url: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      defaultValue: null
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'venue_payment_accounts',
    underscored: true,
    timestamps: true
  });

  VenuePaymentAccount.associate = function(models) {
    VenuePaymentAccount.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
  };

  return VenuePaymentAccount;
};
