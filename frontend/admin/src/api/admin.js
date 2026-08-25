import apiClient from './apiClient';

/**
 * Fetch platform-wide Admin Dashboard KPI statistics.
 */
export const getAdminDashboard = async () => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data.data;
};

/**
 * Fetch community discovery posts for Admin management
 */
export const getAdminCommunityPosts = async (params = {}) => {
  const response = await apiClient.get('/admin/community/posts', { params });
  return response.data;
};

/**
 * Update community post status (OPEN, CLOSED, CANCELLED)
 */
export const updateAdminCommunityPostStatus = async (postId, status) => {
  const response = await apiClient.put(`/admin/community/posts/${postId}/status`, { status });
  return response.data;
};

/**
 * Delete community post
 */
export const deleteAdminCommunityPost = async (postId) => {
  const response = await apiClient.delete(`/admin/community/posts/${postId}`);
  return response.data;
};

/**
 * Fetch platform-wide user list (with pagination, role & status filters).
 */
export const getAdminUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

/**
 * Update user primary_role or account_status (ACTIVE / SUSPENDED).
 */
export const updateAdminUser = async (userId, data) => {
  const response = await apiClient.patch(`/admin/users/${userId}`, data);
  return response.data.data;
};

/**
 * Fetch platform-wide venue list (with pagination & operating_status filter).
 */
export const getAdminVenues = async (params = {}) => {
  const response = await apiClient.get('/admin/venues', { params });
  return response.data;
};

/**
 * Update venue operating_status (APPROVED / REJECTED / SUSPENDED / PENDING).
 */
export const updateAdminVenueStatus = async (venueId, status) => {
  const response = await apiClient.patch(`/admin/venues/${venueId}/status`, { status });
  return response.data.data;
};

/**
 * Fetch platform-wide court list (with pagination & sport_category filter).
 */
export const getAdminCourts = async (params = {}) => {
  const response = await apiClient.get('/admin/courts', { params });
  return response.data;
};

/**
 * Fetch platform-wide booking list (with pagination).
 */
export const getAdminBookings = async (params = {}) => {
  const response = await apiClient.get('/admin/bookings', { params });
  return response.data;
};

/**
 * Fetch platform-wide payment list (with pagination).
 */
export const getAdminPayments = async (params = {}) => {
  const response = await apiClient.get('/admin/payments', { params });
  return response.data;
};

/**
 * Fetch platform-wide review list (with pagination, rating, hide_request_status filters).
 */
export const getAdminReviews = async (params = {}) => {
  const response = await apiClient.get('/admin/reviews', { params });
  return response.data;
};

/**
 * Admin approves or rejects review hide request, or unhides a review.
 * @param {string} reviewId
 * @param {'APPROVE'|'REJECT'|'UNHIDE'} action
 */
export const updateAdminReviewHideStatus = async (reviewId, action) => {
  const response = await apiClient.put(`/admin/reviews/${reviewId}/hide-status`, { action });
  return response.data;
};

/**
 * Fetch aggregated reports & statistics data for chart visualizations.
 */
export const getAdminReports = async () => {
  const response = await apiClient.get('/admin/reports');
  return response.data.data;
};

/**
 * Fetch platform-wide owner registrations list (Admin only).
 */
export const getAdminOwnerRegistrations = async (params = {}) => {
  const response = await apiClient.get('/owner-registrations/admin/list', { params });
  return response.data;
};

/**
 * Approve owner registration (Admin only). Upgrades user role to OWNER.
 */
export const approveAdminOwnerRegistration = async (id) => {
  const response = await apiClient.patch(`/owner-registrations/admin/${id}/approve`);
  return response.data;
};

/**
 * Reject owner registration (Admin only).
 */
export const rejectAdminOwnerRegistration = async (id, admin_note) => {
  const response = await apiClient.patch(`/owner-registrations/admin/${id}/reject`, { admin_note });
  return response.data;
};

/**
 * Update owner registration details (Admin only).
 */
export const updateAdminOwnerRegistration = async (id, data) => {
  const response = await apiClient.put(`/owner-registrations/admin/${id}`, data);
  return response.data;
};

/**
 * Delete owner registration (Admin only).
 */
export const deleteAdminOwnerRegistration = async (id) => {
  const response = await apiClient.delete(`/owner-registrations/admin/${id}`);
  return response.data;
};
