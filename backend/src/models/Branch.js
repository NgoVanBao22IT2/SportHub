'use strict';

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branch', {
    branch_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    venue_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    branch_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    street_address: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    ward_district_city: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    geo_coordinates: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    branch_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    branch_status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    }
  }, {
    tableName: 'branches',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Branch.associate = function(models) {
    Branch.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    Branch.hasMany(models.Court, { foreignKey: 'branch_id', as: 'courts' });
  };

  return Branch;
};
