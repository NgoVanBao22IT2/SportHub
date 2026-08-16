'use strict';

module.exports = (sequelize, DataTypes) => {
  const FavoriteVenue = sequelize.define('FavoriteVenue', {
    customer_user_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    venue_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    added_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'favorite_venues',
    underscored: true,
    timestamps: false
  });

  FavoriteVenue.associate = function(models) {
    FavoriteVenue.belongsTo(models.User, { foreignKey: 'customer_user_id', as: 'customer' });
    FavoriteVenue.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
  };

  return FavoriteVenue;
};
