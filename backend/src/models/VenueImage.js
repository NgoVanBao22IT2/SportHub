'use strict';

const StorageService = require('../services/storage.service');

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
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    cover: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    original_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cloudinary_public_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
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
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'PUBLISHED'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    event_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    promotion_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    tournament_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    course_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },

    // ==========================================
    // VIRTUAL ATTRIBUTES (Dynamic on-the-fly URLs)
    // Ensures 100% backward compatibility for all API & Frontend consumers
    // without storing redundant variant URLs or metadata in MySQL.
    // ==========================================
    thumbnail_url: {
      type: DataTypes.VIRTUAL,
      get() {
        const url = this.getDataValue('original_url');
        return StorageService.getTransformedUrl(url, 'thumbnail');
      }
    },
    medium_url: {
      type: DataTypes.VIRTUAL,
      get() {
        const url = this.getDataValue('original_url');
        return StorageService.getTransformedUrl(url, 'medium');
      }
    },
    large_url: {
      type: DataTypes.VIRTUAL,
      get() {
        const url = this.getDataValue('original_url');
        return StorageService.getTransformedUrl(url, 'large');
      }
    },
    image_url: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('original_url');
      },
      set(val) {
        this.setDataValue('original_url', val);
      }
    },
    file_size: {
      type: DataTypes.VIRTUAL,
      get() {
        return 0;
      }
    },
    mime_type: {
      type: DataTypes.VIRTUAL,
      get() {
        return 'image/webp';
      }
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
