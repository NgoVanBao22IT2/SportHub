'use strict';

const branchService = require('../services/branch.service');
const models = require('../models');

class BranchController {
  async createBranch(req, res) {
    try {
      const { venueId } = req.params;
      const result = await branchService.createBranch(req.user.userId, venueId, req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getBranchesByVenue(req, res) {
    try {
      const { venueId } = req.params;
      const result = await branchService.getBranchesByVenue(req.user.userId, venueId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getBranchById(req, res) {
    try {
      const { venueId, branchId } = req.params;
      const result = await branchService.getBranchByIdForOwner(req.user.userId, venueId, branchId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async updateBranch(req, res) {
    try {
      const { venueId, branchId } = req.params;
      const result = await branchService.updateBranch(req.user.userId, venueId, branchId, req.body, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async deleteBranch(req, res) {
    try {
      const { venueId, branchId } = req.params;
      const result = await branchService.deleteBranch(req.user.userId, venueId, branchId, models);
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

module.exports = new BranchController();
