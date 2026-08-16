import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUserProfile, logoutUser } from '../api/auth';

const AuthContext = createContext(null);

/**
 * AuthProvider — provides isAuthenticated, currentUser, login/logout helpers
 * across the entire app.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // hydration guard

  /**
   * Attempt to restore session from localStorage on mount.
   * If accessToken exists but /me fails, clear stale tokens.
   */
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    // Restore from cached user first for instant UI
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch {
        // corrupted cache — ignore
      }
    }

    // Then verify with backend
    getCurrentUserProfile()
      .then((res) => {
        const user = res?.data || null;
        setCurrentUser(user);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      })
      .catch(() => {
        // Token expired or invalid — clear auth state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setCurrentUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * Call after successful login API response to persist session.
   */
  const saveSession = useCallback((accessToken, rawRefreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', rawRefreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  /**
   * Logout: revoke refresh token on backend then clear local state.
   */
  const logout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
  }, []);

  const isAuthenticated = Boolean(currentUser);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isLoading, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume auth context anywhere in the app.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
