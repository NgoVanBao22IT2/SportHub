import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, RefreshCw, ArrowRight } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

// Design System Imports
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import VenueCard from '../components/domain/VenueCard';

export default function Favorite() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { favorites, loadingFavorites: loading, fetchFavorites, toggleFavorite } = useFavorites();

  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (venue) => {
    try {
      await toggleFavorite(venue);
    } catch (err) {
      console.error("Failed to remove favorite venue", err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: 'Không thể xoá sân khỏi danh sách yêu thích.', type: 'error' });
    }
  };

  // 401 / Auth Required Error State
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập để xem danh sách sân thể thao yêu thích của bạn."
          action={
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* HEADER & BREADCRUMB */}
      <section className="bg-surface border-b border-border-subtle-medium py-8 px-4">
        <div className="container mx-auto max-w-6xl space-y-4">
          <div className="flex items-center text-xs text-text-muted gap-2">
            <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Sân yêu thích</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart size={28} className="text-status-error fill-current" />
                Danh sách sân yêu thích
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Lưu và theo dõi các sân thể thao yêu thích của bạn để dễ dàng quay lại đặt lịch
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={fetchFavorites}
            >
              Làm mới danh sách
            </Button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 max-w-6xl py-8">
        
        {/* LOADING SKELETON STATE */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} padding="none" radius="xl" className="overflow-hidden border border-border-subtle-medium">
                <Skeleton variant="rectangular" height="180px" />
                <div className="p-4 space-y-3">
                  <Skeleton variant="text" width="75%" height="1.5rem" />
                  <Skeleton variant="text" width="50%" height="1rem" />
                  <Skeleton variant="rectangular" height="40px" radius="lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12">
            <EmptyState
              title="Chưa có sân yêu thích"
              description="Lưu những sân bạn yêu thích để dễ dàng theo dõi và quay lại đặt lịch nhanh chóng."
              action={
                <Button variant="primary" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/search')}>
                  Khám phá danh sách sân
                </Button>
              }
            />
          </div>
        ) : (
          /* FAVORITES GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((venue) => {
              const vId = venue.venue_id || venue.id;

              return (
                <VenueCard
                  key={vId}
                  venue={venue}
                  isFavorite={true}
                  onFavorite={() => handleRemoveFavorite(venue)}
                />
              );
            })}
          </div>
        )}

      </div>

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
