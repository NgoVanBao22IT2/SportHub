'use strict';

module.exports = (sequelize, DataTypes) => {
  const Banner = sequelize.define('Banner', {
    banner_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    page_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'EXPLORE_PAGE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subtitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    button_text: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    button_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'banners',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Banner;
};
