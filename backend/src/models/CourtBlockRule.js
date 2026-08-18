'use strict';

module.exports = (sequelize, DataTypes) => {
  const CourtBlockRule = sequelize.define('CourtBlockRule', {
    rule_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    court_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    created_by_owner_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null // NULL means "Cho tới khi Owner mở lại" (Indefinite)
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    block_type: {
      type: DataTypes.ENUM('ONE_TIME', 'FIXED_DURATION', 'LONG_TERM'),
      allowNull: false,
      defaultValue: 'LONG_TERM'
    },
    block_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    }
  }, {
    tableName: 'court_block_rules',
    underscored: true,
    timestamps: true
  });

  CourtBlockRule.associate = function(models) {
    CourtBlockRule.belongsTo(models.Court, { foreignKey: 'court_id', as: 'court' });
    CourtBlockRule.belongsTo(models.User, { foreignKey: 'created_by_owner_id', as: 'owner' });
  };

  return CourtBlockRule;
};
