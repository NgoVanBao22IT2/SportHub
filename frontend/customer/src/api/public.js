import apiClient from './apiClient';

/**
 * Fetch public venue media gallery
 */
export const getPublicVenueMedia = async (venueId, params = {}) => {
  const response = await apiClient.get(`/public/venues/${venueId}/media`, { params });
  return response.data;
};

/**
 * Fetch public venue posts / events
 */
export const getPublicVenuePosts = async (venueId, params = {}) => {
  const response = await apiClient.get(`/public/venues/${venueId}/posts`, { params });
  return response.data;
};

/**
 * Fetch public post / event detail by slug
 */
export const getPublicPostBySlug = async (slug) => {
  const response = await apiClient.get(`/public/posts/${slug}`);
  return response.data;
};

/**
 * Fetch public featured events / promotions for homepage
 */
export const getPublicFeaturedEvents = async (params = {}) => {
  const response = await apiClient.get('/public/featured-events', { params });
  return response.data;
};
