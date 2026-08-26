'use strict';

const BannerService = require('../services/banner.service');

class BannerController {
  /**
   * Public: Get active banner for page
   */
  static async getPublicBanner(req, res, next) {
    try {
      const pageKey = req.query.page_key || 'EXPLORE_PAGE';
      const banner = await BannerService.getBannerByPageKey(pageKey);
      res.json({
        success: true,
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get all banners for page
   */
  static async getAdminBanners(req, res, next) {
    try {
      const pageKey = req.query.page_key || 'EXPLORE_PAGE';
      const banners = await BannerService.getAllBanners(pageKey);
      res.json({
        success: true,
        data: banners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Create new banner
   */
  static async createBanner(req, res, next) {
    try {
      const banner = await BannerService.createBanner(req.body);
      res.status(201).json({
        success: true,
        data: banner,
        message: 'Tạo banner mới thành công!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update banner
   */
  static async updateBanner(req, res, next) {
    try {
      const { id } = req.params;
      const banner = await BannerService.updateBanner(id, req.body);
      res.json({
        success: true,
        data: banner,
        message: 'Cập nhật banner thành công!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete banner
   */
  static async deleteBanner(req, res, next) {
    try {
      const { id } = req.params;
      await BannerService.deleteBanner(id);
      res.json({
        success: true,
        message: 'Xóa banner thành công!',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BannerController;
