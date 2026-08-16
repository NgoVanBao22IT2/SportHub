'use strict';

const courtService = require('../services/court.service');
const models = require('../models');

class CourtController {
  async createCourt(req, res) {
    try {
      const { venueId, branchId } = req.params;
      const result = await courtService.createCourt(req.user.userId, venueId, branchId, req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getCourtsByBranch(req, res) {
    try {
      const { venueId, branchId } = req.params;
      const result = await courtService.getCourtsByBranch(req.user.userId, venueId, branchId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getCourtById(req, res) {
    try {
      const { venueId, branchId, courtId } = req.params;
      const result = await courtService.getCourtByIdForOwner(req.user.userId, venueId, branchId, courtId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async updateCourt(req, res) {
    try {
      const { venueId, branchId, courtId } = req.params;
      const result = await courtService.updateCourt(req.user.userId, venueId, branchId, courtId, req.body, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async deleteCourt(req, res) {
    try {
      const { venueId, branchId, courtId } = req.params;
      const result = await courtService.deleteCourt(req.user.userId, venueId, branchId, courtId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }
}

module.exports = new CourtController();
