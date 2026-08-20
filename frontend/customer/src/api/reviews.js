import apiClient from './apiClient';

/**
 * Fetch venue reviews, rating summary & star distribution
 * @param {string} venueId
 * @param {object} params - { page, limit, sort, rating }
 */
export const getVenueReviews = async (venueId, params = {}) => {
  const response = await apiClient.get(`/venues/${venueId}/reviews`, { params });
  return response.data;
};

/**
 * Check if authenticated user can review this venue
 * @param {string} venueId
 */
export const getVenueReviewEligibility = async (venueId) => {
  const response = await apiClient.get(`/venues/${venueId}/review-eligibility`);
  return response.data;
};

/**
 * Check if authenticated user can review a specific booking
 * @param {string} bookingId
 */
export const getBookingReviewEligibility = async (bookingId) => {
  const response = await apiClient.get(`/bookings/${bookingId}/review-eligibility`);
  return response.data;
};

/**
 * Submit a new review for a completed booking
 * @param {object} payload - { bookingId, rating, comment }
 */
export const createReview = async (payload) => {
  const response = await apiClient.post('/reviews', payload);
  return response.data;
};

/**
 * Owner reply to a review
 * @param {string} reviewId
 * @param {string} replyContent
 */
export const replyOwnerReview = async (reviewId, replyContent) => {
  const response = await apiClient.post(`/owner/reviews/${reviewId}/reply`, { replyContent });
  return response.data;
};
