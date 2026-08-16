import apiClient from './apiClient';

/**
 * Create a new court booking record on backend with optional Idempotency-Key header.
 * @param {Object} bookingData
 * @param {string} bookingData.court_id
 * @param {string} bookingData.booking_date - Format YYYY-MM-DD
 * @param {string} bookingData.start_time - Format HH:mm:ss
 * @param {string} bookingData.end_time - Format HH:mm:ss
 * @param {string} [idempotencyKey] - Category A Idempotency Key header
 */
export const createBooking = async (bookingData, idempotencyKey = null) => {
  try {
    const config = {};
    if (idempotencyKey) {
      config.headers = { 'Idempotency-Key': idempotencyKey };
    }
    const response = await apiClient.post('/bookings', bookingData, config);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Fetch details for a specific booking record by ID.
 * @param {string} bookingId
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

/**
 * Fetch all booking records for the authenticated user.
 * @param {Object} [params]
 */
export const getUserBookings = async (params = {}) => {
  try {
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Cancel a court booking record on backend API.
 * @param {string} bookingId
 * @param {string} [reason]
 */
export const cancelBooking = async (bookingId, reason = 'Khách hàng yêu cầu hủy đơn') => {
  try {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};
