'use strict';

const venueSearchService = require('../services/venue-search.service');
const models = require('../models');

class VenueSearchController {
  async searchVenues(req, res) {
    try {
      const result = await venueSearchService.searchVenues(req.query, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getVenueDetails(req, res) {
    try {
      const { venueId } = req.params;
      const result = await venueSearchService.getVenueDetails(venueId, models);
      if (!result) {
        return res.status(404).json({ success: false, code: 'VENUE_NOT_FOUND', message: 'Venue not found' });
      }
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getSimilarVenues(req, res) {
    try {
      const { venueId } = req.params;
      const result = await venueSearchService.getSimilarVenues(venueId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getSportsCategories(req, res) {
    try {
      const result = await venueSearchService.getSportsCategories(models);
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

module.exports = new VenueSearchController();
