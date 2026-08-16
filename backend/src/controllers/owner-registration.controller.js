'use strict';

const OwnerRegistrationService = require('../services/owner-registration.service');

class OwnerRegistrationController {
  /**
   * Customer: Submit owner registration application
   */
  async createRegistration(req, res, next) {
    try {
      const registration = await OwnerRegistrationService.createRegistration(req.user.userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Venue owner registration application submitted successfully. Pending Admin review.',
        data: registration
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Customer: Get my latest registration application
   */
  async getMyRegistration(req, res, next) {
    try {
      const registration = await OwnerRegistrationService.getMyRegistration(req.user.userId);
      return res.status(200).json({
        success: true,
        data: registration
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Customer: Cancel my pending registration application
   */
  async cancelMyRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const registration = await OwnerRegistrationService.cancelMyRegistration(req.user.userId, id);
      return res.status(200).json({
        success: true,
        message: 'Registration application cancelled successfully.',
        data: registration
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Admin: List registration applications
   */
  async getAdminRegistrations(req, res, next) {
    try {
      const { page, limit, status, search } = req.query;
      const result = await OwnerRegistrationService.getAdminRegistrations({ page, limit, status, search });
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Admin: Approve registration application
   */
  async approveRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const registration = await OwnerRegistrationService.approveRegistration(req.user.userId, id);
      return res.status(200).json({
        success: true,
        message: 'Owner registration application approved successfully. User role upgraded to OWNER.',
        data: registration
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Admin: Reject registration application
   */
  async rejectRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const { admin_note } = req.body;
      const registration = await OwnerRegistrationService.rejectRegistration(req.user.userId, id, admin_note);
      return res.status(200).json({
        success: true,
        message: 'Owner registration application rejected successfully.',
        data: registration
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Admin: Update registration application
   */
  async updateRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const registration = await OwnerRegistrationService.updateRegistration(req.user.userId, id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Cập nhật hồ sơ đăng ký chủ sân thành công.',
        data: registration
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  /**
   * Admin: Delete registration application
   */
  async deleteRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const result = await OwnerRegistrationService.deleteRegistration(req.user.userId, id);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }
}

module.exports = new OwnerRegistrationController();
