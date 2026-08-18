'use strict';

module.exports = (sequelize, DataTypes) => {
  const BookingStatusHistory = sequelize.define('BookingStatusHistory', {
    history_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    from_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    to_status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    changed_by_user_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    change_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'booking_status_history',
    underscored: true,
    timestamps: true,
    updatedAt: false // Only created_at is needed
  });

  BookingStatusHistory.associate = function(models) {
    BookingStatusHistory.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    BookingStatusHistory.belongsTo(models.User, { foreignKey: 'changed_by_user_id', as: 'changed_by' });
  };

  return BookingStatusHistory;
};
