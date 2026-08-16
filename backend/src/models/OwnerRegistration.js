'use strict';

module.exports = (sequelize, DataTypes) => {
  const OwnerRegistration = sequelize.define('OwnerRegistration', {
    registration_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    business_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Cơ sở tư nhân'
    },
    representative_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    street_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    city_province: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    ward: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    sport_categories: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'Cầu lông'
    },
    estimated_courts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewed_by: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'owner_registrations',
    underscored: true,
    timestamps: true
  });

  OwnerRegistration.associate = function(models) {
    OwnerRegistration.belongsTo(models.User, { foreignKey: 'user_id', as: 'applicant' });
    OwnerRegistration.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  };

  return OwnerRegistration;
};
