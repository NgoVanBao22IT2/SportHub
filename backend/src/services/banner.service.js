'use strict';

const { Banner } = require('../models');
const { v4: uuidv4 } = require('uuid');

class BannerService {
  /**
   * Get active banner for a specific page (Public)
   */
  static async getBannerByPageKey(pageKey = 'EXPLORE_PAGE') {
    let banner = await Banner.findOne({
      where: {
        page_key: pageKey,
        is_active: true,
      },
      order: [['updated_at', 'DESC']],
    });

    if (!banner) {
      // Fallback default
      banner = {
        banner_id: 'default',
        page_key: pageKey,
        title: 'Khám Phá & Kết Nối Thể Thao',
        subtitle: 'SportHub Community Discovery Hub',
        description: 'Tìm chân vãng lai ghép đội, nhượng lại vé pass sân nhanh chóng hoặc cáp kèo giao lưu đỉnh cao cùng hàng ngàn thể thao thủ tại địa phương.',
        image_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1600&auto=format&fit=crop&q=80',
        button_text: 'Đăng bài mới ngay',
        button_url: '',
        is_active: true,
      };
    }

    return banner;
  }

  /**
   * Get all banners (Admin)
   */
  static async getAllBanners(pageKey = 'EXPLORE_PAGE') {
    return await Banner.findAll({
      where: { page_key: pageKey },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Create new banner (Admin)
   */
  static async createBanner(bannerData) {
    const {
      page_key = 'EXPLORE_PAGE',
      title,
      subtitle,
      description,
      image_url,
      button_text,
      button_url,
      is_active = true,
    } = bannerData;

    if (!title) {
      const error = new Error('Tiêu đề banner là bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    const banner = await Banner.create({
      banner_id: uuidv4(),
      page_key,
      title,
      subtitle: subtitle || null,
      description: description || null,
      image_url: image_url || null,
      button_text: button_text || 'Đăng bài mới ngay',
      button_url: button_url || null,
      is_active: is_active ?? true,
    });

    return banner;
  }

  /**
   * Update existing banner (Admin) - Upsert fallback if missing
   */
  static async updateBanner(bannerId, updateData) {
    let banner = null;

    if (bannerId && bannerId !== 'default') {
      banner = await Banner.findByPk(bannerId);
    }

    if (!banner && updateData.page_key) {
      banner = await Banner.findOne({
        where: { page_key: updateData.page_key },
        order: [['created_at', 'DESC']],
      });
    }

    if (!banner) {
      return await this.createBanner({
        banner_id: (bannerId && bannerId !== 'default') ? bannerId : undefined,
        ...updateData,
      });
    }

    const {
      title,
      subtitle,
      description,
      image_url,
      button_text,
      button_url,
      is_active,
    } = updateData;

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (description !== undefined) banner.description = description;
    if (image_url !== undefined) banner.image_url = image_url;
    if (button_text !== undefined) banner.button_text = button_text;
    if (button_url !== undefined) banner.button_url = button_url;
    if (is_active !== undefined) banner.is_active = is_active;

    await banner.save();
    return banner;
  }

  /**
   * Delete banner (Admin)
   */
  static async deleteBanner(bannerId) {
    const banner = await Banner.findByPk(bannerId);
    if (!banner) {
      const error = new Error('Banner không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    await banner.destroy();
    return true;
  }
}

module.exports = BannerService;
