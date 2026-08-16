'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

/**
 * Hash plaintext string using bcrypt
 */
async function hashPassword(plainText) {
  return await bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compare plaintext with bcrypt hash
 */
async function comparePassword(plainText, hash) {
  return await bcrypt.compare(plainText, hash);
}

/**
 * Hash token using SHA-256 for fast lookup
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate cryptographically secure random token hex
 */
function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate 6-digit numeric OTP code
 */
function generateNumericOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  hashPassword,
  comparePassword,
  hashToken,
  generateRandomToken,
  generateNumericOTP
};
