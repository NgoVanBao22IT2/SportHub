import apiClient from './apiClient';

/**
 * Fetch paginated notifications for current user
 * @param {object} params - { page, limit, type, isRead, search }
 */
export const getNotifications = async (params = {}) => {
  const response = await apiClient.get('/notifications', { params });
  return response.data;
};

/**
 * Get count of unread notifications
 */
export const getUnreadNotificationCount = async () => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a single notification as read
 * @param {string} notificationId
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};

/**
 * Delete a notification
 * @param {string} notificationId
 */
export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};
