'use strict';

const venueService = require('../services/venue.service');
const models = require('../models');

class VenueController {
  async createVenue(req, res) {
    try {
      const result = await venueService.createVenue(req.user.userId, req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getMyVenues(req, res) {
    try {
      const result = await venueService.getVenuesByOwner(req.user.userId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getMyVenueById(req, res) {
    try {
      const { venueId } = req.params;
      const result = await venueService.getVenueByIdForOwner(req.user.userId, venueId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async updateVenue(req, res) {
    try {
      const { venueId } = req.params;
      const result = await venueService.updateVenue(req.user.userId, venueId, req.body, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async deleteVenue(req, res) {
    try {
      const { venueId } = req.params;
      const result = await venueService.deleteVenue(req.user.userId, venueId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getVenuePaymentAccounts(req, res) {
    try {
      const { venueId } = req.params;
      const result = await venueService.getVenuePaymentAccounts(venueId, models);
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

module.exports = new VenueController();
