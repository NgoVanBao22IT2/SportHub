'use strict';

module.exports = (sequelize, DataTypes) => {
  const Facility = sequelize.define('Facility', {
    facility_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    facility_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: 'uq_facilities_name'
    },
    facility_icon: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'facilities',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  Facility.associate = function(models) {
    Facility.belongsToMany(models.Venue, { through: models.VenueFacility, foreignKey: 'facility_id', otherKey: 'venue_id', as: 'venues' });
  };

  return Facility;
};
