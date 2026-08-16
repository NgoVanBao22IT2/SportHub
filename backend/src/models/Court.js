'use strict';

module.exports = (sequelize, DataTypes) => {
  const Court = sequelize.define('Court', {
    court_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    branch_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    court_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    sport_category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    court_status: {
      type: DataTypes.ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    },
    surface_features: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'courts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Court.associate = function(models) {
    Court.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Court.hasMany(models.Booking, { foreignKey: 'court_id', as: 'bookings' });
    Court.hasMany(models.Review, { foreignKey: 'court_id', as: 'reviews' });
  };

  return Court;
};
