'use strict';

const authService = require('../services/auth.service');
const models = require('../models');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async verifyOTP(req, res, next) {
    try {
      const { email, otpCode, purpose = 'REGISTRATION' } = req.body;
      const result = await authService.verifyOTP(email, otpCode, purpose, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(email, resetToken, newPassword, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await models.User.findByPk(req.user.userId, {
        attributes: ['user_id', 'full_name', 'email', 'phone_number', 'primary_role', 'account_status', 'email_verified_at', 'created_at']
      });
      if (!user) {
        return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User profile not found' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: err.message });
    }
  }
}

module.exports = new AuthController();
