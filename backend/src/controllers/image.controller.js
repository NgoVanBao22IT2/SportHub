'use strict';

const imageService = require('../services/image.service');
const models = require('../models');

class ImageController {
  async uploadImage(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const result = await imageService.uploadImage(req.user.userId, targetType, targetId, req.body, models);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async getImagesByTarget(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const result = await imageService.getImagesByTarget(targetType, targetId, models);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || 'SERVER_ERROR',
        message: err.message
      });
    }
  }

  async deleteImage(req, res) {
    try {
      const { imageId } = req.params;
      const result = await imageService.deleteImage(req.user.userId, imageId, req.body, models);
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

module.exports = new ImageController();
