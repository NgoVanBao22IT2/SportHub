'use strict';

module.exports = (sequelize, DataTypes) => {
  const VenuePostImage = sequelize.define('VenuePostImage', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    post_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    image_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'venue_post_images',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  VenuePostImage.associate = function(models) {
    VenuePostImage.belongsTo(models.VenuePost, { foreignKey: 'post_id', as: 'post' });
    VenuePostImage.belongsTo(models.VenueImage, { foreignKey: 'image_id', as: 'image' });
  };

  return VenuePostImage;
};
