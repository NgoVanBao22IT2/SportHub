'use strict';

module.exports = (sequelize, DataTypes) => {
  const VenuePost = sequelize.define('VenuePost', {
    post_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    venue_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    author_user_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    content_type: {
      type: DataTypes.ENUM('POST', 'PROMOTION', 'EVENT', 'TOURNAMENT', 'COURSE', 'ANNOUNCEMENT'),
      allowNull: false,
      defaultValue: 'POST'
    },
    cover_image_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    cover_image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    publish_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    registration_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fee_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    promo_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    discount_info: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    instructor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact_hotline: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'venue_posts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  VenuePost.associate = function(models) {
    VenuePost.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    VenuePost.belongsTo(models.User, { foreignKey: 'author_user_id', as: 'author' });
    VenuePost.belongsTo(models.VenueImage, { foreignKey: 'cover_image_id', as: 'cover_image' });
    VenuePost.hasMany(models.VenuePostImage, { foreignKey: 'post_id', as: 'post_images' });
  };

  return VenuePost;
};
