import apiClient from './apiClient';

/**
 * Fetch all favorite venues for the authenticated user.
 * GET /api/v1/favorites
 */
export const getFavorites = async () => {
  try {
    const response = await apiClient.get('/favorites');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

/**
 * Add a venue to the user's favorites list.
 * POST /api/v1/favorites
 * @param {string} venueId
 */
export const addFavorite = async (venueId) => {
  try {
    const response = await apiClient.post('/favorites', { venue_id: venueId });
    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

/**
 * Remove a venue from the user's favorites list.
 * DELETE /api/v1/favorites/:venueId
 * @param {string} venueId
 */
export const removeFavorite = async (venueId) => {
  try {
    const response = await apiClient.delete(`/favorites/${venueId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};
