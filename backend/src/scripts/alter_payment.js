'use strict';
require('dotenv').config();
const { sequelize } = require('../models');

async function run() {
  try {
    await sequelize.query("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('MOMO', 'BANK_TRANSFER', 'CASH') NOT NULL DEFAULT 'BANK_TRANSFER';");
    console.log('Successfully updated payments table payment_method ENUM!');
    process.exit(0);
  } catch (err) {
    console.error('Error altering table:', err);
    process.exit(1);
  }
}

run();
