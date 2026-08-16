'use strict';

module.exports = (sequelize, DataTypes) => {
  const VenueFacility = sequelize.define('VenueFacility', {
    venue_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    facility_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'venue_facilities',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return VenueFacility;
};
