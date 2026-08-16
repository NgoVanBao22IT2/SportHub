'use strict';

const crypto = require('crypto');
const { hashPassword, comparePassword, hashToken, generateNumericOTP, generateRandomToken } = require('../utils/hash');
const { generateAccessToken } = require('../utils/jwt');
const emailService = require('./email.service');

// TBD Configuration Placeholders (Preserving TBD-AUTH-01, TBD-AUTH-02, TBD-AUTH-03)
const OTP_TTL_MINUTES = parseInt(process.env.AUTH_OTP_TTL_MINUTES || '10', 10);
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.AUTH_REFRESH_TTL_DAYS || '7', 10);
const RESET_TOKEN_TTL_MINUTES = parseInt(process.env.AUTH_RESET_TTL_MINUTES || '15', 10);

class AuthService {
  /**
   * Task 05.01: Register new User
   */
  async register(data, models, transaction = null) {
    const { email, password, full_name, phone_number, primary_role = 'CUSTOMER' } = data;

    // Input validation guards — prevent 500 from DB constraint errors
    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      error.code = 'EMAIL_REQUIRED';
      throw error;
    }

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      const error = new Error('Full name is required');
      error.statusCode = 400;
      error.code = 'FULL_NAME_REQUIRED';
      throw error;
    }

    if (!phone_number || typeof phone_number !== 'string' || !phone_number.trim()) {
      const error = new Error('Phone number is required');
      error.statusCode = 400;
      error.code = 'PHONE_NUMBER_REQUIRED';
      throw error;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    // Check existing email
    const existingUser = await models.User.findOne({ where: { email: email.trim() } });
    if (existingUser) {
      const error = new Error('Email address is already registered');
      error.statusCode = 409;
      error.code = 'EMAIL_DUPLICATE';
      throw error;
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();

    const user = await models.User.create({
      user_id: userId,
      full_name,
      email,
      phone_number,
      password_hash: hashedPassword,
      primary_role,
      account_status: 'UNVERIFIED'
    }, { transaction });

    // Task 05.02: Generate & Deliver OTP
    const rawOtp = generateNumericOTP();
    const hashedOtp = await hashPassword(rawOtp);
    const otpId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await models.OtpVerification.create({
      otp_id: otpId,
      email,
      otp_code_hash: hashedOtp,
      purpose: 'REGISTRATION',
      attempt_count: 0,
      is_consumed: false,
      expires_at: expiresAt
    }, { transaction });

    await emailService.sendOTP(email, rawOtp, 'REGISTRATION');

    return {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      primary_role: user.primary_role,
      account_status: user.account_status,
      message: 'Registration successful. Please verify your email with the OTP sent.'
    };
  }

  /**
   * Task 05.03: Verify OTP and activate user
   */
  async verifyOTP(email, otpCode, purpose, models) {
    const otpRecord = await models.OtpVerification.findOne({
      where: {
        email,
        purpose,
        is_consumed: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!otpRecord) {
      const error = new Error('Invalid or expired OTP verification code');
      error.statusCode = 400;
      error.code = 'INVALID_OTP';
      throw error;
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      const error = new Error('OTP verification code has expired');
      error.statusCode = 400;
      error.code = 'EXPIRED_OTP';
      throw error;
    }

    const isMatch = await comparePassword(otpCode, otpRecord.otp_code_hash);
    if (!isMatch) {
      await otpRecord.increment('attempt_count');
      const error = new Error('Incorrect OTP code');
      error.statusCode = 400;
      error.code = 'INCORRECT_OTP';
      throw error;
    }

    // Atomic OTP consumption and User Activation
    const t = await models.sequelize.transaction();
    try {
      await otpRecord.update({ is_consumed: true }, { transaction: t });

      if (purpose === 'REGISTRATION') {
        await models.User.update({
          account_status: 'ACTIVE',
          email_verified_at: new Date()
        }, {
          where: { email },
          transaction: t
        });
      }

      await t.commit();
      return { success: true, message: 'Email verified successfully. Account activated.' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Task 05.04: Login
   */
  async login(email, password, models) {
    // Input validation guards — prevent 500 from undefined args
    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      error.code = 'EMAIL_REQUIRED';
      throw error;
    }

    if (!password || typeof password !== 'string') {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    const user = await models.User.findOne({ where: { email: email.trim() } });

    // Generic error to prevent account enumeration
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (user.account_status === 'SUSPENDED') {
      const error = new Error('Account has been suspended. Please contact administrator.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_SUSPENDED';
      throw error;
    }

    if (user.account_status === 'UNVERIFIED') {
      const error = new Error('Account email is not verified. Please verify your email first.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_UNVERIFIED';
      throw error;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Task 05.05: Access Token
    const accessToken = generateAccessToken(user);

    // Task 05.06: Refresh Token persistence (hashed)
    const rawRefreshToken = generateRandomToken(32);
    const hashedRefreshToken = hashToken(rawRefreshToken);
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await models.RefreshToken.create({
      token_id: tokenId,
      user_id: user.user_id,
      token_hash: hashedRefreshToken,
      is_revoked: false,
      expires_at: expiresAt
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        primary_role: user.primary_role,
        account_status: user.account_status
      }
    };
  }

  /**
   * Task 05.06: Refresh Token Renewal
   */
  async refreshToken(rawRefreshToken, models) {
    // Validate token before hashing to prevent crypto crash on undefined
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string' || !rawRefreshToken.trim()) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const hashed = hashToken(rawRefreshToken);
    const tokenRecord = await models.RefreshToken.findOne({
      where: {
        token_hash: hashed,
        is_revoked: false
      },
      include: [{ model: models.User, as: 'user' }]
    });

    if (!tokenRecord || new Date() > new Date(tokenRecord.expires_at)) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const newAccessToken = generateAccessToken(tokenRecord.user);
    return { accessToken: newAccessToken };
  }

  /**
   * Task 05.06: Revoke Refresh Token (Logout)
   */
  async logout(rawRefreshToken, models) {
    if (!rawRefreshToken) return { success: true };

    const hashed = hashToken(rawRefreshToken);
    await models.RefreshToken.update({
      is_revoked: true,
      revoked_at: new Date()
    }, {
      where: { token_hash: hashed }
    });

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Task 05.07: Forgot Password
   */
  async forgotPassword(email, models) {
    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      error.code = 'EMAIL_REQUIRED';
      throw error;
    }

    const user = await models.User.findOne({ where: { email: email.trim() } });
    // Generic response to prevent enumeration
    if (!user) {
      return { success: true, message: 'If an account with that email exists, a reset code has been sent.' };
    }

    const rawResetToken = generateNumericOTP(); // or random token string
    const hashedResetToken = await hashPassword(rawResetToken);
    const resetId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await models.PasswordResetToken.create({
      reset_id: resetId,
      user_id: user.user_id,
      token_hash: hashedResetToken,
      is_consumed: false,
      expires_at: expiresAt
    });

    await emailService.sendPasswordResetLink(email, rawResetToken);

    return { success: true, message: 'If an account with that email exists, a reset code has been sent.' };
  }

  /**
   * Task 05.08: Reset Password
   */
  async resetPassword(email, resetToken, newPassword, models) {
    if (!email || typeof email !== 'string' || !email.trim()) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      error.code = 'EMAIL_REQUIRED';
      throw error;
    }

    if (!resetToken || typeof resetToken !== 'string' || !resetToken.trim()) {
      const error = new Error('Reset token is required');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_REQUIRED';
      throw error;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    const user = await models.User.findOne({ where: { email: email.trim() } });
    if (!user) {
      const error = new Error('Invalid or expired password reset token');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const resetRecord = await models.PasswordResetToken.findOne({
      where: {
        user_id: user.user_id,
        is_consumed: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!resetRecord || new Date() > new Date(resetRecord.expires_at)) {
      const error = new Error('Invalid or expired password reset token');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const isMatch = await comparePassword(resetToken.trim(), resetRecord.token_hash);
    if (!isMatch) {
      const error = new Error('Invalid password reset token');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const newHashedPassword = await hashPassword(newPassword);

    const t = await models.sequelize.transaction();
    try {
      await user.update({ password_hash: newHashedPassword }, { transaction: t });
      await resetRecord.update({ is_consumed: true, consumed_at: new Date() }, { transaction: t });
      await t.commit();
      return { message: 'Password has been reset successfully. You can now log in.' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}

module.exports = new AuthService();
