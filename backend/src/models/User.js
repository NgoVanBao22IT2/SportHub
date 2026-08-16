'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    primary_role: {
      type: DataTypes.ENUM('CUSTOMER', 'OWNER', 'ADMIN'),
      allowNull: false,
      defaultValue: 'CUSTOMER'
    },
    account_status: {
      type: DataTypes.ENUM('UNVERIFIED', 'ACTIVE', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'UNVERIFIED'
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  User.associate = function(models) {
    // User.hasMany(models.OwnerApplication, { foreignKey: 'applicant_user_id', as: 'submitted_applications' });
    // User.hasMany(models.OwnerApplication, { foreignKey: 'reviewer_admin_id', as: 'reviewed_applications' });
    User.hasMany(models.RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
    User.hasMany(models.PasswordResetToken, { foreignKey: 'user_id', as: 'reset_tokens' });
    User.hasMany(models.Venue, { foreignKey: 'owner_user_id', as: 'venues' });
    User.hasMany(models.Booking, { foreignKey: 'customer_user_id', as: 'bookings' });
    User.hasMany(models.Payment, { foreignKey: 'user_id', as: 'payments' });
    User.hasMany(models.OwnerRegistration, { foreignKey: 'user_id', as: 'owner_registrations' });
  };

  return User;
};
