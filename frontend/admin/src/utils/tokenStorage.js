/**
 * Token Storage Helper — Concurrent Multi-User Tab Isolation
 * Primary: sessionStorage (tab-isolated sandbox for Admin/Owner/Customer running concurrently)
 * Fallback: localStorage
 */

export const getAccessToken = () => {
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken') || '';
};

export const getRefreshToken = () => {
  return sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken') || '';
};

export const getUser = () => {
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setSession = (accessToken, rawRefreshToken, user) => {
  if (accessToken) {
    sessionStorage.setItem('accessToken', accessToken);
    localStorage.setItem('accessToken', accessToken);
  }
  if (rawRefreshToken) {
    sessionStorage.setItem('refreshToken', rawRefreshToken);
    localStorage.setItem('refreshToken', rawRefreshToken);
  }
  if (user) {
    const userStr = typeof user === 'string' ? user : JSON.stringify(user);
    sessionStorage.setItem('user', userStr);
    localStorage.setItem('user', userStr);
  }
};

export const clearSession = () => {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
