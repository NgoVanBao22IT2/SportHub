'use strict';

module.exports = (sequelize, DataTypes) => {
  const OperatingSchedule = sequelize.define('OperatingSchedule', {
    schedule_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    scope_target_type: {
      type: DataTypes.ENUM('VENUE', 'BRANCH', 'COURT'),
      allowNull: false
    },
    scope_target_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    day_scope: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    opening_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    closing_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    base_hourly_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    peak_price_rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'operating_schedules',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return OperatingSchedule;
};
