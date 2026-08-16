import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUserProfile, logoutUser } from '../api/auth';
import { getAccessToken, getUser, setSession, clearSession } from '../utils/tokenStorage';

const AuthContext = createContext(null);

/**
 * AuthProvider — provides isAuthenticated, currentUser, login/logout helpers
 * across the entire app with tab-isolated multi-role support.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // hydration guard

  /**
   * Attempt to restore session from tab storage on mount.
   * If accessToken exists but /me fails, clear stale tokens.
   */
  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    // Restore from cached user first for instant UI
    const cachedUser = getUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
    }

    // Then verify with backend
    getCurrentUserProfile()
      .then((res) => {
        const user = res?.data || null;
        setCurrentUser(user);
        if (user) setSession(accessToken, null, user);
      })
      .catch(() => {
        // Token expired or invalid — clear auth state
        clearSession();
        setCurrentUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * Call after successful login API response to persist session.
   */
  const saveSession = useCallback((accessToken, rawRefreshToken, user) => {
    setSession(accessToken, rawRefreshToken, user);
    setCurrentUser(user);
  }, []);

  /**
   * Logout: revoke refresh token on backend then clear local state.
   */
  const logout = useCallback(async () => {
    await logoutUser();
    clearSession();
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
