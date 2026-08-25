'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CommunityPost extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
      this.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
      this.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
      this.hasMany(models.PostApplication, { foreignKey: 'post_id', as: 'applications' });
    }
  }

  CommunityPost.init(
    {
      post_id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      post_type: {
        type: DataTypes.ENUM('RECRUIT', 'PASS_BOOKING', 'FIND_SLOT', 'CHALLENGE', 'COURSE'),
        allowNull: false,
        defaultValue: 'RECRUIT',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      venue_id: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      booking_id: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      sport_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Badminton',
      },
      play_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      skill_level: {
        type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL'),
        allowNull: false,
        defaultValue: 'ALL',
      },
      slots_needed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      slots_joined: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price_per_slot: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      original_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      pass_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      location_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      contact_zalo: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('OPEN', 'FULL', 'CLOSED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
    },
    {
      sequelize,
      modelName: 'CommunityPost',
      tableName: 'community_posts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return CommunityPost;
};
