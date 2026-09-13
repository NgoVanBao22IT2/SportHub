import apiClient from './apiClient';

export const communityApi = {
  // Fetch active page banner
  getBanner: async (pageKey = 'EXPLORE_PAGE') => {
    const response = await apiClient.get('/community/banner', { params: { page_key: pageKey } });
    return response.data;
  },

  // Fetch community posts with filters
  getPosts: async (params = {}) => {
    const response = await apiClient.get('/community/posts', { params });
    return response.data;
  },

  // Get single post detail
  getPostById: async (id) => {
    const response = await apiClient.get(`/community/posts/${id}`);
    return response.data;
  },

  // Create new post
  createPost: async (postData) => {
    const response = await apiClient.post('/community/posts', postData);
    return response.data;
  },

  // Apply to join / pass / challenge
  applyPost: async (postId, message) => {
    const response = await apiClient.post(`/community/posts/${postId}/apply`, { message });
    return response.data;
  },

  // Fetch user's upcoming bookings for pass-booking selection
  getMyUpcomingBookings: async () => {
    const response = await apiClient.get('/community/my-upcoming-bookings');
    return response.data;
  },

  // Update post
  updatePost: async (postId, postData) => {
    const response = await apiClient.put(`/community/posts/${postId}`, postData);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/community/posts/${postId}`);
    return response.data;
  },

  // Accept/Reject application
  updateApplicationStatus: async (applicationId, status) => {
    const response = await apiClient.put(`/community/applications/${applicationId}/status`, { status });
    return response.data;
  },
};

export default communityApi;
