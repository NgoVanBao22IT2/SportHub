'use strict';

module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    reset_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    is_consumed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    consumed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'password_reset_tokens',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  PasswordResetToken.associate = function(models) {
    PasswordResetToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return PasswordResetToken;
};
