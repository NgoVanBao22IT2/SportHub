import apiClient from './apiClient';

/**
 * Initiate or record payment transaction for a booking.
 * @param {Object} paymentData
 * @param {string} paymentData.booking_id
 * @param {string} paymentData.payment_method - 'momo' | 'banking' | 'onsite'
 * @param {number} paymentData.amount
 */
export const createPayment = async (paymentData) => {
  try {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
};

/**
 * Fetch payment status for a specific payment ID.
 * @param {string} paymentId
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await apiClient.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};

/**
 * Upload payment proof image for a transaction.
 * @param {string} paymentId
 * @param {string} proofUrl - URL or Base64 string of payment receipt
 */
export const uploadPaymentProof = async (paymentId, proofUrl) => {
  try {
    const response = await apiClient.post(`/payments/${paymentId}/proof`, { proofUrl });
    return response.data;
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    throw error;
  }
};
