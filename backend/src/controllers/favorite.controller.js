'use strict';

const favoriteService = require('../services/favorite.service');

class FavoriteController {
  async getFavorites(req, res, next) {
    try {
      const userId = req.user.user_id || req.user.userId;
      const data = await favoriteService.getFavorites(userId);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async addFavorite(req, res, next) {
    try {
      const userId = req.user.user_id || req.user.userId;
      const { venue_id } = req.body;
      const result = await favoriteService.addFavorite(userId, venue_id);
      return res.status(201).json({
        success: true,
        message: 'Venue added to favorites',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async removeFavorite(req, res, next) {
    try {
      const userId = req.user.user_id || req.user.userId;
      const { venueId } = req.params;
      const result = await favoriteService.removeFavorite(userId, venueId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FavoriteController();
