'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    recipient_user_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    notification_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    entity_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      defaultValue: null
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, { foreignKey: 'recipient_user_id', as: 'recipient' });
  };

  return Notification;
};
