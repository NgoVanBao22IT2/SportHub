const OwnerService = require('../services/owner.service');

class OwnerController {
  static async getDashboard(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { venueId } = req.query;
      const data = await OwnerService.getDashboard(ownerId, { venueId });
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getBookings(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { page, limit, status, search, venueId } = req.query;
      const result = await OwnerService.getBookings(ownerId, { page, limit, status, search, venueId });
      res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async getBookingById(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;
      const booking = await OwnerService.getBookingById(ownerId, bookingId);
      res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async getRevenue(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { from, to, venueId, courtId, paymentMethod, page, limit, search } = req.query;
      const result = await OwnerService.getRevenue(ownerId, { from, to, venueId, courtId, paymentMethod, page, limit, search });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getReviews(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { page, limit, search, venueId, courtId, rating, sort } = req.query;
      const result = await OwnerService.getReviews(ownerId, { page, limit, search, venueId, courtId, rating, sort });
      res.status(200).json({ status: 'success', data: result.reviews, kpis: result.kpis, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async getReviewById(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { reviewId } = req.params;
      const review = await OwnerService.getReviewById(ownerId, reviewId);
      res.status(200).json({ status: 'success', data: review });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async replyReview(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { reviewId } = req.params;
      const { replyContent } = req.body;
      const review = await OwnerService.replyReview(ownerId, reviewId, replyContent);
      res.status(200).json({ status: 'success', data: review, message: 'Đã phản hồi đánh giá thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async getNotifications(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { page, limit, type, isRead, search } = req.query;
      const result = await OwnerService.getNotifications(ownerId, { page, limit, type, isRead, search });
      res.status(200).json({ status: 'success', data: result.notifications, unreadCount: result.unreadCount, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadNotificationCount(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const unreadCount = await OwnerService.getUnreadNotificationCount(ownerId);
      res.status(200).json({ status: 'success', unreadCount });
    } catch (error) {
      next(error);
    }
  }

  static async getNotificationById(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { notificationId } = req.params;
      const notif = await OwnerService.getNotificationById(ownerId, notificationId);
      res.status(200).json({ status: 'success', data: notif });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async markNotificationAsRead(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { notificationId } = req.params;
      const notif = await OwnerService.markNotificationAsRead(ownerId, notificationId);
      res.status(200).json({ status: 'success', data: notif, message: 'Đã đánh dấu là đã đọc' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async markAllNotificationsAsRead(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const result = await OwnerService.markAllNotificationsAsRead(ownerId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { notificationId } = req.params;
      const result = await OwnerService.deleteNotification(ownerId, notificationId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const result = await OwnerService.getOwnerProfile(ownerId);
      res.status(200).json({ status: 'success', data: result.user, stats: result.stats });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { full_name, phone_number } = req.body;
      const user = await OwnerService.updateOwnerProfile(ownerId, { full_name, phone_number });
      res.status(200).json({ status: 'success', data: user, message: 'Cập nhật thông tin hồ sơ thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const result = await OwnerService.changeOwnerPassword(ownerId, { currentPassword, newPassword, confirmPassword });
      res.status(200).json({ status: 'success', data: result, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async getCustomers(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { page, limit } = req.query;
      const result = await OwnerService.getCustomers(ownerId, { page, limit });
      res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async getRevenue(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const data = await OwnerService.getRevenue(ownerId);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingBookings(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { page, limit } = req.query;
      const result = await OwnerService.getPendingBookings(ownerId, { page, limit });
      res.status(200).json({ status: 'success', data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async approveBooking(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;
      const booking = await OwnerService.approveBooking(ownerId, bookingId);
      res.status(200).json({ status: 'success', data: booking, message: 'Đã duyệt đơn đặt sân thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async rejectBooking(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { bookingId } = req.params;
      const { reason } = req.body;
      const booking = await OwnerService.rejectBooking(ownerId, bookingId, reason);
      res.status(200).json({ status: 'success', data: booking, message: 'Đã từ chối đơn đặt sân' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async blockCourtSlot(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { courtId, date, startTime, endTime, reason } = req.body;
      const block = await OwnerService.blockCourtSlot(ownerId, { courtId, date, startTime, endTime, reason });
      res.status(201).json({ status: 'success', data: block, message: 'Đã khóa khung giờ thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async unblockCourtSlot(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { blockId } = req.params;
      const result = await OwnerService.unblockCourtSlot(ownerId, blockId);
      res.status(200).json({ status: 'success', data: result, message: 'Đã mở khóa khung giờ thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async getPaymentAccounts(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const accounts = await OwnerService.getOwnerPaymentAccounts(ownerId);
      res.status(200).json({ status: 'success', data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async createPaymentAccount(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const account = await OwnerService.createOwnerPaymentAccount(ownerId, req.body);
      res.status(201).json({ status: 'success', data: account, message: 'Tạo tài khoản thanh toán thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async updatePaymentAccount(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { accountId } = req.params;
      const account = await OwnerService.updateOwnerPaymentAccount(ownerId, accountId, req.body);
      res.status(200).json({ status: 'success', data: account, message: 'Cập nhật tài khoản thanh toán thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async deletePaymentAccount(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { accountId } = req.params;
      const result = await OwnerService.deleteOwnerPaymentAccount(ownerId, accountId);
      res.status(200).json({ status: 'success', data: result, message: 'Xóa tài khoản thanh toán thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async getPayments(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { page, limit, status, search, paymentMethod, venueId } = req.query;
      const result = await OwnerService.getPayments(ownerId, { page, limit, status, search, paymentMethod, venueId });
      res.status(200).json({ status: 'success', data: result.data, kpis: result.kpis, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentById(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { paymentId } = req.params;
      const payment = await OwnerService.getPaymentById(ownerId, paymentId);
      res.status(200).json({ status: 'success', data: payment });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async approvePaymentTransaction(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { paymentId } = req.params;
      const payment = await OwnerService.approvePaymentTransaction(ownerId, paymentId);
      res.status(200).json({ status: 'success', data: payment, message: 'Phê duyệt giao dịch thanh toán thành công' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }

  static async rejectPaymentTransaction(req, res, next) {
    try {
      const ownerId = req.user.userId;
      const { paymentId } = req.params;
      const { reason } = req.body;
      const payment = await OwnerService.rejectPaymentTransaction(ownerId, paymentId, reason);
      res.status(200).json({ status: 'success', data: payment, message: 'Đã từ chối giao dịch thanh toán' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: { message: error.message } });
      }
      next(error);
    }
  }
}

module.exports = OwnerController;
