import apiClient from './apiClient';

/**
 * Fetch owner dashboard statistics and aggregated data.
 */
export const getOwnerDashboard = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner dashboard metrics:', error);
    throw error;
  }
};

/**
 * Fetch all bookings belonging to owner with filtering.
 */
export const getOwnerBookings = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/bookings', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    throw error;
  }
};

/**
 * Fetch single booking detail by bookingId owned by owner.
 */
export const getOwnerBookingDetail = async (bookingId) => {
  try {
    const response = await apiClient.get(`/owner/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching owner booking detail ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Fetch pending bookings waiting for owner confirmation.
 */
export const getPendingBookings = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/bookings/pending', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner pending bookings:', error);
    throw error;
  }
};

/**
 * Approve a pending booking.
 * @param {string} bookingId
 */
export const approveBooking = async (bookingId) => {
  try {
    const response = await apiClient.post(`/owner/bookings/${bookingId}/approve`);
    return response.data;
  } catch (error) {
    console.error(`Error approving booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Reject a pending booking.
 * @param {string} bookingId
 * @param {string} reason
 */
export const rejectBooking = async (bookingId, reason) => {
  try {
    const response = await apiClient.post(`/owner/bookings/${bookingId}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Fetch list of venues owned by logged-in owner.
 */
export const getOwnerVenues = async () => {
  try {
    const response = await apiClient.get('/owner/venues');
    return response.data;
  } catch (error) {
    console.error('Error fetching owner venues:', error);
    throw error;
  }
};

/**
 * Fetch single venue details by ID for owner.
 */
export const getOwnerVenueById = async (venueId) => {
  try {
    const response = await apiClient.get(`/venues/${venueId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching owner venue ${venueId}:`, error);
    throw error;
  }
};

/**
 * Create a new venue owned by logged-in owner.
 */
export const createOwnerVenue = async (venueData) => {
  try {
    const response = await apiClient.post('/venues', venueData);
    return response.data;
  } catch (error) {
    console.error('Error creating venue:', error);
    throw error;
  }
};

/**
 * Update an existing venue owned by logged-in owner.
 */
export const updateOwnerVenue = async (venueId, venueData) => {
  try {
    const response = await apiClient.put(`/venues/${venueId}`, venueData);
    return response.data;
  } catch (error) {
    console.error(`Error updating venue ${venueId}:`, error);
    throw error;
  }
};

/**
 * Fetch daily availability schedule matrix for a venue.
 */
export const getVenueDailyAvailability = async (venueId, date) => {
  try {
    const response = await apiClient.get(`/availability/venue/${venueId}`, {
      params: { date }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching daily availability for venue ${venueId}:`, error);
    throw error;
  }
};

/**
 * Block a court time slot as owner.
 */
export const blockCourtSlot = async (blockData) => {
  try {
    const response = await apiClient.post('/owner/schedules/block', blockData);
    return response.data;
  } catch (error) {
    console.error('Error blocking court slot:', error);
    throw error;
  }
};

/**
 * Unblock a court time slot as owner.
 */
export const unblockCourtSlot = async (blockId) => {
  try {
    const response = await apiClient.delete(`/owner/schedules/block/${blockId}`);
    return response.data;
  } catch (error) {
    console.error(`Error unblocking court slot ${blockId}:`, error);
    throw error;
  }
};

/**
 * Fetch owner's payment accounts.
 */
export const getOwnerPaymentAccounts = async () => {
  try {
    const response = await apiClient.get('/owner/payment-accounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching owner payment accounts:', error);
    throw error;
  }
};

/**
 * Create a new payment account as owner.
 */
export const createOwnerPaymentAccount = async (accountData) => {
  try {
    const response = await apiClient.post('/owner/payment-accounts', accountData);
    return response.data;
  } catch (error) {
    console.error('Error creating owner payment account:', error);
    throw error;
  }
};

/**
 * Update an existing payment account as owner.
 */
export const updateOwnerPaymentAccount = async (accountId, accountData) => {
  try {
    const response = await apiClient.put(`/owner/payment-accounts/${accountId}`, accountData);
    return response.data;
  } catch (error) {
    console.error(`Error updating owner payment account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Delete a payment account as owner.
 */
export const deleteOwnerPaymentAccount = async (accountId) => {
  try {
    const response = await apiClient.delete(`/owner/payment-accounts/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting owner payment account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Fetch list of payment transactions for owner's venues with filtering & KPIs.
 */
export const getOwnerPayments = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/payments', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner payment transactions:', error);
    throw error;
  }
};

/**
 * Fetch single payment transaction detail for owner.
 */
export const getOwnerPaymentDetail = async (paymentId) => {
  try {
    const response = await apiClient.get(`/owner/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching owner payment detail ${paymentId}:`, error);
    throw error;
  }
};

/**
 * Approve payment transaction as owner (atomic DB update).
 */
export const approveOwnerPayment = async (paymentId) => {
  try {
    const response = await apiClient.post(`/owner/payments/${paymentId}/approve`);
    return response.data;
  } catch (error) {
    console.error(`Error approving owner payment ${paymentId}:`, error);
    throw error;
  }
};

/**
 * Reject payment transaction as owner (atomic DB update).
 */
export const rejectOwnerPayment = async (paymentId, reason) => {
  try {
    const response = await apiClient.post(`/owner/payments/${paymentId}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting owner payment ${paymentId}:`, error);
    throw error;
  }
};

/**
 * Fetch owner revenue & financial analytics report.
 */
export const getOwnerRevenue = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/revenue', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner revenue analytics:', error);
    throw error;
  }
};

/**
 * Fetch customer reviews & rating analytics for owner.
 */
export const getOwnerReviews = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/reviews', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner reviews:', error);
    throw error;
  }
};

/**
 * Fetch single review detail for owner.
 */
export const getOwnerReviewDetail = async (reviewId) => {
  try {
    const response = await apiClient.get(`/owner/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching owner review detail ${reviewId}:`, error);
    throw error;
  }
};

/**
 * Submit owner response to a customer review.
 */
export const replyOwnerReview = async (reviewId, replyContent) => {
  try {
    const response = await apiClient.post(`/owner/reviews/${reviewId}/reply`, { replyContent });
    return response.data;
  } catch (error) {
    console.error(`Error replying to owner review ${reviewId}:`, error);
    throw error;
  }
};

/**
 * Fetch owner notifications list with filters & pagination.
 */
export const getOwnerNotifications = async (params = {}) => {
  try {
    const response = await apiClient.get('/owner/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching owner notifications:', error);
    throw error;
  }
};

/**
 * Fetch unread notification count badge.
 */
export const getOwnerUnreadNotificationCount = async () => {
  try {
    const response = await apiClient.get('/owner/notifications/unread-count');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
};

/**
 * Fetch single notification detail & auto mark as read.
 */
export const getOwnerNotificationById = async (notificationId) => {
  try {
    const response = await apiClient.get(`/owner/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching notification detail ${notificationId}:`, error);
    throw error;
  }
};

/**
 * Mark notification as read.
 */
export const markOwnerNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/owner/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification as read ${notificationId}:`, error);
    throw error;
  }
};

/**
 * Mark all notifications as read.
 */
export const markAllOwnerNotificationsAsRead = async () => {
  try {
    const response = await apiClient.put('/owner/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification.
 */
export const deleteOwnerNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/owner/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
};

/**
 * Fetch owner profile & account stats.
 */
export const getOwnerProfile = async () => {
  try {
    const response = await apiClient.get('/owner/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching owner profile:', error);
    throw error;
  }
};

/**
 * Update owner profile (full_name, phone_number).
 */
export const updateOwnerProfile = async (data) => {
  try {
    const response = await apiClient.put('/owner/profile', data);
    return response.data;
  } catch (error) {
    console.error('Error updating owner profile:', error);
    throw error;
  }
};

/**
 * Change owner password securely.
 */
export const changeOwnerPassword = async (data) => {
  try {
    const response = await apiClient.put('/owner/password', data);
    return response.data;
  } catch (error) {
    console.error('Error changing owner password:', error);
    throw error;
  }
};

// ==========================================
// BRANCH MANAGEMENT APIs
// ==========================================
export const getOwnerBranches = async (venueId) => {
  const response = await apiClient.get(`/venues/${venueId}/branches`);
  return response.data;
};

export const createOwnerBranch = async (venueId, branchData) => {
  const response = await apiClient.post(`/venues/${venueId}/branches`, branchData);
  return response.data;
};

export const updateOwnerBranch = async (venueId, branchId, branchData) => {
  const response = await apiClient.put(`/venues/${venueId}/branches/${branchId}`, branchData);
  return response.data;
};

export const deleteOwnerBranch = async (venueId, branchId) => {
  const response = await apiClient.delete(`/venues/${venueId}/branches/${branchId}`);
  return response.data;
};

// ==========================================
// COURT MANAGEMENT APIs
// ==========================================
export const getOwnerCourts = async (venueId, branchId) => {
  const response = await apiClient.get(`/venues/${venueId}/branches/${branchId}/courts`);
  return response.data;
};

export const createOwnerCourt = async (venueId, branchId, courtData) => {
  const response = await apiClient.post(`/venues/${venueId}/branches/${branchId}/courts`, courtData);
  return response.data;
};

export const updateOwnerCourt = async (venueId, branchId, courtId, courtData) => {
  const response = await apiClient.put(`/venues/${venueId}/branches/${branchId}/courts/${courtId}`, courtData);
  return response.data;
};

export const deleteOwnerCourt = async (venueId, branchId, courtId) => {
  const response = await apiClient.delete(`/venues/${venueId}/branches/${branchId}/courts/${courtId}`);
  return response.data;
};

// ==========================================
// OPERATING SCHEDULE & PRICING APIs
// ==========================================
export const getOwnerSchedules = async (scopeTargetType, scopeTargetId) => {
  const response = await apiClient.get(`/schedules/${scopeTargetType}/${scopeTargetId}`);
  return response.data;
};

export const createOwnerSchedule = async (scopeTargetType, scopeTargetId, scheduleData) => {
  const response = await apiClient.post(`/schedules/${scopeTargetType}/${scopeTargetId}`, scheduleData);
  return response.data;
};

export const deleteOwnerSchedule = async (scheduleId) => {
  const response = await apiClient.delete(`/schedules/${scheduleId}`);
  return response.data;
};

// ==========================================
// FACILITY MANAGEMENT APIs
// ==========================================
export const getOwnerFacilities = async () => {
  const response = await apiClient.get('/facilities');
  return response.data;
};

export const assignOwnerFacility = async (venueId, facilityData) => {
  const response = await apiClient.post(`/venues/${venueId}/facilities`, facilityData);
  return response.data;
};

export const removeOwnerFacility = async (venueId, facilityId) => {
  const response = await apiClient.delete(`/venues/${venueId}/facilities/${facilityId}`);
  return response.data;
};
