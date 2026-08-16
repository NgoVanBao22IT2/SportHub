'use strict';

module.exports = (sequelize, DataTypes) => {
  const SlotBlocking = sequelize.define('SlotBlocking', {
    block_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    court_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    block_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    block_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_by_owner_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    }
  }, {
    tableName: 'slot_blockings',
    underscored: true,
    timestamps: true,
    updatedAt: false // It only has created_at
  });

  SlotBlocking.associate = function(models) {
    SlotBlocking.belongsTo(models.Court, { foreignKey: 'court_id', as: 'court' });
    SlotBlocking.belongsTo(models.User, { foreignKey: 'created_by_owner_id', as: 'owner' });
  };

  return SlotBlocking;
};
