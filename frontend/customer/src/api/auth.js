import apiClient from './apiClient';
import { getRefreshToken, clearSession } from '../utils/tokenStorage';

/**
 * Register a new user account.
 * POST /api/v1/auth/register
 */
export const register = async ({ email, password, full_name, phone_number, primary_role = 'CUSTOMER' }) => {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    full_name,
    phone_number,
    primary_role,
  });
  return response.data;
};

/**
 * Verify OTP code to activate account.
 * POST /api/v1/auth/verify-otp
 */
export const verifyOTP = async ({ email, otpCode, purpose = 'REGISTRATION' }) => {
  const response = await apiClient.post('/auth/verify-otp', {
    email,
    otpCode,
    purpose,
  });
  return response.data;
};

/**
 * Login with email and password.
 * POST /api/v1/auth/login
 * Returns: { success, data: { accessToken, refreshToken, user } }
 */
export const login = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Refresh access token using a valid refresh token.
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = async (rawRefreshToken) => {
  const response = await apiClient.post('/auth/refresh-token', {
    refreshToken: rawRefreshToken,
  });
  return response.data;
};

/**
 * Send forgot password OTP/token to email.
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset user password using reset token from email.
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async ({ email, resetToken, newPassword }) => {
  const response = await apiClient.post('/auth/reset-password', {
    email,
    resetToken,
    newPassword,
  });
  return response.data;
};

/**
 * Logout the authenticated user and clean up local session tokens.
 * POST /api/v1/auth/logout
 */
export const logoutUser = async () => {
  try {
    const storedRefreshToken = getRefreshToken();
    if (storedRefreshToken) {
      await apiClient.post('/auth/logout', { refreshToken: storedRefreshToken });
    }
  } catch (error) {
    const status = error.response?.status;
    if (status === 401) {
      // Session already invalidated — safe to ignore
    } else {
      // Non-critical logout error — still clean up locally
    }
  } finally {
    clearSession();
  }
};

/**
 * Fetch authenticated user profile details from backend.
 * GET /api/v1/auth/me
 */
export const getCurrentUserProfile = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
