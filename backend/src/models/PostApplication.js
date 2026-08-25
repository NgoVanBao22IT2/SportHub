'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PostApplication extends Model {
    static associate(models) {
      this.belongsTo(models.CommunityPost, { foreignKey: 'post_id', as: 'post' });
      this.belongsTo(models.User, { foreignKey: 'applicant_user_id', as: 'applicant' });
    }
  }

  PostApplication.init(
    {
      application_id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      post_id: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      applicant_user_id: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
    },
    {
      sequelize,
      modelName: 'PostApplication',
      tableName: 'post_applications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return PostApplication;
};
