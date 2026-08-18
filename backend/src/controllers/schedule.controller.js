'use strict';

const scheduleService = require('../services/schedule.service');
const models = require('../models');

class ScheduleController {
  async createSchedule(req, res) {
    try {
      const { scopeTargetType, scopeTargetId } = req.params;
      const result = await scheduleService.createSchedule(req.user.userId, scopeTargetType, scopeTargetId, req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getSchedulesByScope(req, res) {
    try {
      const { scopeTargetType, scopeTargetId } = req.params;
      const result = await scheduleService.getSchedulesByScope(scopeTargetType, scopeTargetId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const result = await scheduleService.updateSchedule(req.user.userId, scheduleId, req.body, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async duplicateSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const result = await scheduleService.duplicateSchedule(req.user.userId, scheduleId, req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async toggleScheduleStatus(req, res) {
    try {
      const { scheduleId } = req.params;
      const result = await scheduleService.toggleScheduleStatus(req.user.userId, scheduleId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const result = await scheduleService.deleteSchedule(req.user.userId, scheduleId, req.body, models);
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

module.exports = new ScheduleController();
