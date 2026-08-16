'use strict';

const facilityService = require('../services/facility.service');
const models = require('../models');

class FacilityController {
  async createFacility(req, res) {
    try {
      const result = await facilityService.createFacility(req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getFacilities(req, res) {
    try {
      const result = await facilityService.getFacilities(models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async assignFacilityToVenue(req, res) {
    try {
      const { venueId } = req.params;
      const { facilityId } = req.body;
      const result = await facilityService.assignFacilityToVenue(req.user.userId, venueId, facilityId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async removeFacilityFromVenue(req, res) {
    try {
      const { venueId, facilityId } = req.params;
      const result = await facilityService.removeFacilityFromVenue(req.user.userId, venueId, facilityId, models);
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

module.exports = new FacilityController();
