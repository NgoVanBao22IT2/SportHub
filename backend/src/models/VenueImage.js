'use strict';

module.exports = (sequelize, DataTypes) => {
  const VenueImage = sequelize.define('VenueImage', {
    image_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    venue_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    uploaded_by: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    target_type: {
      type: DataTypes.ENUM('VENUE', 'COURT'),
      allowNull: true,
      defaultValue: 'VENUE'
    },
    target_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    thumbnail_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medium_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    large_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    original_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_type: {
      type: DataTypes.ENUM('COVER', 'AVATAR', 'VENUE', 'FACILITY', 'EVENT', 'PROMOTION', 'TOURNAMENT', 'COURSE', 'OTHER'),
      allowNull: false,
      defaultValue: 'VENUE'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    alt_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_cover: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_avatar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'venue_images',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  VenueImage.associate = function(models) {
    VenueImage.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    VenueImage.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
  };

  return VenueImage;
};
