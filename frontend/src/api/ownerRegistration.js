import apiClient from './apiClient';

/**
 * Fetch customer's own latest venue owner registration status.
 */
export const getMyOwnerRegistration = async () => {
  const response = await apiClient.get('/owner-registrations/me');
  return response.data.data;
};

/**
 * Submit a new venue owner registration application.
 */
export const createOwnerRegistration = async (data) => {
  const response = await apiClient.post('/owner-registrations', data);
  return response.data;
};

/**
 * Cancel a PENDING venue owner registration application.
 */
export const cancelMyOwnerRegistration = async (id) => {
  const response = await apiClient.post(`/owner-registrations/${id}/cancel`);
  return response.data;
};
