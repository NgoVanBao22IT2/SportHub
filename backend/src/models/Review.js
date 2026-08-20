'use strict';

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    review_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true
    },
    customer_user_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    court_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    venue_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('PUBLISHED', 'HIDDEN'),
      allowNull: false,
      defaultValue: 'PUBLISHED'
    },
    owner_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    owner_reply_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'reviews',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Review.associate = function(models) {
    Review.belongsTo(models.User, { foreignKey: 'customer_user_id', as: 'customer' });
    Review.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    Review.belongsTo(models.Court, { foreignKey: 'court_id', as: 'court' });
    Review.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
  };

  return Review;
};
