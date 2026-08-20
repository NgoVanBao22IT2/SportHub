import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getFavorites, addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite } from '../api/favorites';
import Button from '../components/ui/Button';
import { Heart, LogIn } from 'lucide-react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch favorite list from backend when authenticated
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    try {
      setLoadingFavorites(true);
      const res = await getFavorites();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setFavorites(list);
      const ids = new Set(list.map((v) => String(v.venue_id || v.id)));
      setFavoriteIds(ids);
    } catch (err) {
      console.error('Failed to fetch favorite venues:', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites, currentUser]);

  const isFavorite = useCallback(
    (venueId) => {
      if (!venueId) return false;
      return favoriteIds.has(String(venueId));
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (venue) => {
      if (!isAuthenticated) {
        setAuthModalOpen(true);
        return { success: false, requireAuth: true };
      }

      if (!venue) return { success: false };

      const venueId = String(venue.venue_id || venue.id || venue);
      const isCurrentlyFav = favoriteIds.has(venueId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFav) {
          next.delete(venueId);
        } else {
          next.add(venueId);
        }
        return next;
      });

      if (isCurrentlyFav) {
        setFavorites((prev) => prev.filter((v) => String(v.venue_id || v.id) !== venueId));
      } else if (typeof venue === 'object') {
        setFavorites((prev) => [venue, ...prev]);
      }

      try {
        if (isCurrentlyFav) {
          await apiRemoveFavorite(venueId);
        } else {
          await apiAddFavorite(venueId);
        }
        return { success: true, isFavorite: !isCurrentlyFav };
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
        // Rollback on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyFav) {
            next.add(venueId);
          } else {
            next.delete(venueId);
          }
          return next;
        });
        await fetchFavorites();
        return { success: false, error: err };
      }
    },
    [isAuthenticated, favoriteIds, fetchFavorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        loadingFavorites,
        fetchFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}

      {/* Reusable Auth Prompt Modal when clicking favorite while unauthenticated */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-gray-100 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <Heart size={24} className="fill-current text-red-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">Yêu cầu đăng nhập</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Vui lòng đăng nhập tài khoản để lưu sân yêu thích và dễ dàng đặt lại bất cứ lúc nào.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<LogIn size={16} />}
                onClick={() => {
                  setAuthModalOpen(false);
                  navigate('/login');
                }}
              >
                Đăng nhập ngay
              </Button>
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => setAuthModalOpen(false)}
              >
                Để sau
              </Button>
            </div>
          </div>
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
