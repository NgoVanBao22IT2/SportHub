'use strict';

/**
 * Migration: Optimize venue_images schema & standardize Cloudinary storage
 * 
 * Objectives:
 * 1. Add `cloudinary_public_id` VARCHAR(255) NULL to track Cloudinary assets for clean lifecycle management.
 * 2. Remove redundant technical metadata columns: `width`, `height`, `mime_type`, `file_size` (100% verified redundant / in-memory validated).
 * 3. Remove redundant precomputed variant URL columns: `thumbnail_url`, `medium_url`, `large_url` (Replaced by dynamic Cloudinary transformation virtual getters on `original_url`).
 * 
 * Rollback capability:
 * Down function restores all removed columns with their original schema types and removes `cloudinary_public_id`.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = 'venue_images';

    const checkColumnExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`
      );
      return results.length > 0;
    };

    // 1. Add `cloudinary_public_id` if it does not already exist
    const hasPublicId = await checkColumnExists('cloudinary_public_id');
    if (!hasPublicId) {
      await queryInterface.addColumn(tableName, 'cloudinary_public_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        after: 'original_url'
      });
      console.log(`[Migration UP] Added column 'cloudinary_public_id' to ${tableName}`);
    } else {
      console.log(`[Migration UP] Column 'cloudinary_public_id' already exists in ${tableName}, skipping.`);
    }

    // 2. Remove redundant columns
    const columnsToRemove = [
      'thumbnail_url',
      'medium_url',
      'large_url',
      'width',
      'height',
      'mime_type',
      'file_size'
    ];

    for (const col of columnsToRemove) {
      const exists = await checkColumnExists(col);
      if (exists) {
        await queryInterface.removeColumn(tableName, col);
        console.log(`[Migration UP] Successfully removed column '${col}' from ${tableName}`);
      } else {
        console.log(`[Migration UP] Column '${col}' already removed from ${tableName}, skipping.`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = 'venue_images';

    const checkColumnExists = async (columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`
      );
      return results.length > 0;
    };

    // 1. Restore removed columns
    const columnsToRestore = {
      thumbnail_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      medium_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      large_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }
    };

    for (const [col, def] of Object.entries(columnsToRestore)) {
      const exists = await checkColumnExists(col);
      if (!exists) {
        await queryInterface.addColumn(tableName, col, def);
        console.log(`[Migration DOWN] Restored column '${col}' in ${tableName}`);
      } else {
        console.log(`[Migration DOWN] Column '${col}' already exists in ${tableName}, skipping.`);
      }
    }

    // 2. Remove `cloudinary_public_id` if present
    const hasPublicId = await checkColumnExists('cloudinary_public_id');
    if (hasPublicId) {
      await queryInterface.removeColumn(tableName, 'cloudinary_public_id');
      console.log(`[Migration DOWN] Removed column 'cloudinary_public_id' from ${tableName}`);
    }
  }
};
