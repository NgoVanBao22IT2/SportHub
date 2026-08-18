'use strict';

module.exports = (sequelize, DataTypes) => {
  const Venue = sequelize.define('Venue', {
    venue_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    owner_user_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    venue_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    venue_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    operating_status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'PENDING'
    }
  }, {
    tableName: 'venues',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Venue.associate = function(models) {
    Venue.belongsTo(models.User, { foreignKey: 'owner_user_id', as: 'owner' });
    Venue.hasMany(models.Branch, { foreignKey: 'venue_id', as: 'branches' });
    Venue.hasMany(models.VenuePaymentAccount, { foreignKey: 'venue_id', as: 'payment_accounts' });
    Venue.belongsToMany(models.Facility, { through: models.VenueFacility, foreignKey: 'venue_id', otherKey: 'facility_id', as: 'facilities' });
    Venue.hasMany(models.VenueImage, { foreignKey: 'venue_id', as: 'images' });
    Venue.hasMany(models.VenuePost, { foreignKey: 'venue_id', as: 'posts' });
  };

  return Venue;
};
