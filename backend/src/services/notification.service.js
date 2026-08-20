'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');
const { Notification, User } = require('../models');

class NotificationService {
  /**
   * Internal helper to create a persistent notification
   */
  static async createNotification({ recipientUserId, type, title, message, entityType = null, entityId = null }, transaction = null) {
    if (!recipientUserId || !title || !message) return null;
    try {
      const notif = await Notification.create({
        notification_id: crypto.randomUUID(),
        recipient_user_id: recipientUserId,
        notification_type: type || 'SYSTEM_ANNOUNCEMENT',
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
        is_read: false
      }, transaction ? { transaction } : {});
      return notif;
    } catch (err) {
      console.error('Error creating notification:', err);
      return null;
    }
  }

  /**
   * Get paginated notifications for any authenticated user
   */
  static async getUserNotifications(userId, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const where = { recipient_user_id: userId };

    if (options.type && options.type !== 'ALL') {
      const t = String(options.type).toUpperCase();
      if (t === 'BOOKING' || t === 'BOOKING_CONFIRMED') {
        where.notification_type = { [Op.like]: 'BOOKING%' };
      } else if (t === 'REVIEW' || t === 'NEW_REVIEW') {
        where.notification_type = { [Op.or]: [{ [Op.like]: '%REVIEW%' }] };
      } else if (t === 'PAYMENT') {
        where.notification_type = { [Op.or]: [{ [Op.like]: 'PAYMENT%' }, { [Op.like]: 'REFUND%' }] };
      } else if (t === 'SYSTEM' || t === 'EVENT') {
        where.notification_type = { [Op.or]: ['SYSTEM_ANNOUNCEMENT', 'EVENT_NEW', 'VENUE_POST'] };
      } else {
        where.notification_type = options.type;
      }
    }

    if (options.isRead !== undefined && options.isRead !== 'ALL' && options.isRead !== '') {
      where.is_read = options.isRead === 'true' || options.isRead === true;
    }

    if (options.search && options.search.trim() !== '') {
      const searchVal = `%${options.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchVal } },
        { message: { [Op.like]: searchVal } }
      ];
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const unreadCount = await Notification.count({
      where: {
        recipient_user_id: userId,
        is_read: false
      }
    });

    return {
      notifications: rows,
      unreadCount,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1
      }
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    const unreadCount = await Notification.count({
      where: {
        recipient_user_id: userId,
        is_read: false
      }
    });
    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  static async markNotificationAsRead(userId, notificationId) {
    const notif = await Notification.findOne({
      where: {
        notification_id: notificationId,
        recipient_user_id: userId
      }
    });

    if (!notif) {
      const err = new Error('Không tìm thấy thông báo.');
      err.statusCode = 404;
      throw err;
    }

    notif.is_read = true;
    notif.read_at = new Date();
    await notif.save();

    return notif;
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllNotificationsAsRead(userId) {
    await Notification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          recipient_user_id: userId,
          is_read: false
        }
      }
    );

    return { message: 'Đã đánh dấu tất cả thông báo là đã đọc.' };
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(userId, notificationId) {
    const deleted = await Notification.destroy({
      where: {
        notification_id: notificationId,
        recipient_user_id: userId
      }
    });

    if (!deleted) {
      const err = new Error('Không tìm thấy thông báo để xóa.');
      err.statusCode = 404;
      throw err;
    }

    return { message: 'Đã xóa thông báo thành công.' };
  }
}

module.exports = NotificationService;
