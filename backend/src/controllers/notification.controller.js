'use strict';

const NotificationService = require('../services/notification.service');

class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page, limit, type, isRead, search } = req.query;
      const result = await NotificationService.getUserNotifications(userId, {
        page,
        limit,
        type,
        isRead,
        search
      });
      res.status(200).json({
        status: 'success',
        data: result.notifications,
        unreadCount: result.unreadCount,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await NotificationService.getUnreadCount(userId);
      res.status(200).json({
        status: 'success',
        unreadCount: result.unreadCount
      });
    } catch (err) {
      next(err);
    }
  }

  static async markNotificationAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;
      const result = await NotificationService.markNotificationAsRead(userId, notificationId);
      res.status(200).json({
        status: 'success',
        message: 'Đã đánh dấu thông báo là đã đọc.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAllNotificationsAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await NotificationService.markAllNotificationsAsRead(userId);
      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;
      const result = await NotificationService.deleteNotification(userId, notificationId);
      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
