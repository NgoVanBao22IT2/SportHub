import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, RefreshCw, ArrowRight, AlertCircle, ShieldCheck, XCircle, CheckCircle2, Star } from 'lucide-react';
import { getUserBookings, cancelBooking } from '../api/bookings';

// Design System Imports
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Tabs from '../components/ui/Tabs';
import ReviewModal from '../components/domain/review/ReviewModal';

// Centralized Cancellable Booking Statuses based on Backend Audit (booking.service.js)
const CANCELLABLE_BOOKING_STATUSES = ['HOLDING', 'CONFIRMED'];

const isBookingCancellable = (statusStr) => {
  return CANCELLABLE_BOOKING_STATUSES.includes(String(statusStr || '').toUpperCase());
};

export default function MyBooking() {
  const navigate = useNavigate();

  // State Management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Hardened Cancellation States
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(null);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [actionError, setActionError] = useState('');
  const [refreshError, setRefreshError] = useState('');

  // Fetch Booking History from Backend API (No Fake Data / Backend Source of Truth)
  const fetchBookingHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      setUnauthorized(false);
      setActionError('');
      setRefreshError('');

      const response = await getUserBookings({ page: 1, limit: 50 });
      const bookingList = response?.data || response?.bookings || (Array.isArray(response) ? response : []);
      setBookings(bookingList);
    } catch (err) {
      console.error("Failed to fetch booking history", err);
      if (err.response?.status === 401) {
        setUnauthorized(true);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingHistory();
  }, [fetchBookingHistory]);

  // Handle Confirmed Cancellation via Backend API (PATCH /api/v1/bookings/:id/cancel)
  const handleConfirmCancel = async () => {
    if (!confirmCancelModal) return;
    const bookingId = confirmCancelModal.booking_id || confirmCancelModal.id;

    try {
      setCancellingId(bookingId);
      setActionError('');
      setRefreshError('');

      // 1. Execute Real Cancel Request
      await cancelBooking(bookingId, 'Khách hàng hủy giữ chỗ từ MyBooking');
      setConfirmCancelModal(null);

      // 2. Separate Refetch Flow (Distinguish Cancel Success vs Refetch Failure)
      try {
        await fetchBookingHistory();
      } catch (refetchErr) {
        console.warn("Cancel API succeeded, but refetching booking history failed", refetchErr);
        setRefreshError('Đơn đã được hủy thành công, nhưng chưa thể tải lại danh sách. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error("Failed to cancel booking", err);
      const status = err.response?.status;
      let msg = err.response?.data?.message;

      if (status === 400) {
        msg = msg || 'Đơn đặt sân này không thể hủy ở trạng thái hiện tại.';
      } else if (status === 403) {
        msg = msg || 'Bạn không có quyền thực hiện thao tác này.';
      } else if (status === 404) {
        // Neutral error message for 404 per Section 10 contract
        msg = 'Không tìm thấy đơn hoặc bạn không có quyền thao tác.';
      } else if (status === 409) {
        msg = msg || 'Đơn đặt sân vừa thay đổi. Vui lòng tải lại danh sách.';
      } else if (status === 429) {
        msg = 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau.';
      } else {
        msg = msg || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
      }

      setActionError(msg);
    } finally {
      // Guaranteed State Reset in Finally Block
      setCancellingId(null);
    }
  };

  // Filter Bookings Based on Active Tab
  const filteredBookings = bookings.filter((item) => {
    const status = String(item.booking_status || item.status || '').toUpperCase();
    if (activeTab === 'upcoming') {
      return ['HOLDING', 'PENDING', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'WAITING_OWNER_CONFIRMATION', 'CONFIRMED'].includes(status);
    }
    if (activeTab === 'completed') {
      return status === 'COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return ['CANCELLED', 'EXPIRED', 'FAILED', 'REJECTED', 'PAYMENT_FAILED'].includes(status);
    }
    return true;
  });

  // Booking Status Badge Variant Mapping
  const getStatusBadge = (statusStr) => {
    const status = String(statusStr || '').toUpperCase();
    switch (status) {
      case 'CONFIRMED':
        return { variant: 'success', label: 'Đã xác nhận' };
      case 'WAITING_OWNER_CONFIRMATION':
        return { variant: 'warning', label: 'Chờ chủ sân duyệt' };
      case 'PAYMENT_SUCCESS':
        return { variant: 'success', label: 'Thanh toán TC — Chờ duyệt' };
      case 'REJECTED':
        return { variant: 'danger', label: 'Chủ sân từ chối' };
      case 'HOLDING':
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return { variant: 'warning', label: 'Đang giữ sân (10m)' };
      case 'COMPLETED':
        return { variant: 'info', label: 'Đã hoàn thành' };
      case 'CANCELLED':
        return { variant: 'neutral', label: 'Đã hủy' };
      case 'EXPIRED':
        return { variant: 'neutral', label: 'Hết hạn giữ sân' };
      case 'FAILED':
      case 'PAYMENT_FAILED':
        return { variant: 'danger', label: 'Đặt thất bại' };
      default:
        return { variant: 'default', label: status || 'Chờ xử lý' };
    }
  };

  // 401 Unauthorized State
  if (unauthorized) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập tài khoản để xem danh sách và lịch sử đặt sân của bạn."
          action={
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          }
        />
      </div>
    );
  }

  // 5xx / Network Error State
  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <ErrorState
          title="Không thể tải danh sách đơn đặt sân"
          description="Đã xảy ra sự cố khi kết nối tới hệ thống. Vui lòng thử lại."
          action={
            <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchBookingHistory}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* HEADER SECTION */}
      <section className="bg-surface border-b border-border-subtle-medium py-8 px-4">
        <div className="container mx-auto max-w-6xl space-y-4">
          {/* <div className="flex items-center text-xs text-text-muted gap-2">
            <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Đơn đặt của tôi</span>
          </div> */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={28} className="text-accent-primary" />
                Lịch sử & Đơn đặt sân cá nhân
              </h1>
              {/* <p className="text-sm text-text-muted mt-1">
                Quản lý các lượt giữ sân, thông tin đặt sân và lịch sử thanh toán từ SportHub
              </p> */}
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={fetchBookingHistory}
            >
              Làm mới
            </Button>
          </div>

          {actionError && (
            <div role="alert" className="p-4 bg-status-danger-bg border border-status-danger-text/20 rounded-xl text-status-danger-text text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {refreshError && (
            <div role="alert" className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0 text-amber-600" />
                <span>{refreshError}</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBookingHistory}>
                Thử lại
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 max-w-6xl py-8 space-y-6">
        
        {/* FILTER TABS */}
        <div className="bg-surface p-2 rounded-2xl border border-border-subtle-medium shadow-sm">
          <Tabs
            items={[
              { id: 'all', label: `Tất cả (${bookings.length})` },
              { id: 'upcoming', label: 'Sắp tới & Giữ sân' },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'cancelled', label: 'Đã hủy & Hết hạn' },
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* LOADING SKELETON STATE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} padding="md" radius="xl" className="border border-border-subtle-medium space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton variant="text" width="60%" height="1.5rem" />
                  <Skeleton variant="rectangular" width="90px" height="24px" radius="full" />
                </div>
                <Skeleton variant="text" width="40%" height="1rem" />
                <div className="space-y-2 pt-2">
                  <Skeleton variant="rectangular" height="40px" radius="lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12">
            <EmptyState
              title={activeTab === 'all' ? "Bạn chưa có đơn đặt sân nào" : "Không tìm thấy đơn đặt sân phù hợp"}
              description={
                activeTab === 'all'
                  ? "Danh sách lịch giữ sân và lịch sử đặt sân thể thao của bạn sẽ xuất hiện tại đây."
                  : "Vui lòng chọn tab lọc khác hoặc tìm kiếm thêm sân mới."
              }
              action={
                <Button variant="primary" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/search')}>
                  Khám phá danh sách sân
                </Button>
              }
            />
          </div>
        ) : (
          /* BOOKINGS LIST GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBookings.map((item) => {
              const bookingId = item.booking_id || item.id;
              const venueName = item.Venue?.venue_name || item.venue_name || 'Câu lạc bộ thể thao';
              const courtName = item.Court?.court_name || item.court_name || 'Sân tiêu chuẩn';
              const dateStr = item.booking_date || 'Chưa xác định';
              const timeLabel = item.start_time && item.end_time
                ? `${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}`
                : 'Khung giờ tiêu chuẩn';
              const price = item.total_amount || item.price;
              const statusStr = String(item.booking_status || item.status || '').toUpperCase();
              const badgeInfo = getStatusBadge(statusStr);
              
              // Cancellable Status Guard strictly derived from Backend Audit (HOLDING, CONFIRMED)
              const canCancel = isBookingCancellable(statusStr);
              const isCancelling = cancellingId === bookingId;
              const isGlobalPending = cancellingId !== null;

              return (
                <Card
                  key={bookingId}
                  padding="md"
                  radius="xl"
                  className="border border-border-subtle-medium hover:border-accent-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
                >
                  <Card.Header className="pb-3 border-b border-border-subtle flex justify-between items-start gap-2">
                    <div>
                      <Badge variant={badgeInfo.variant} size="sm" className="mb-1.5 font-bold">
                        {badgeInfo.label}
                      </Badge>
                      <h3 className="font-bold text-gray-900 text-lg leading-snug">
                        {venueName}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-accent-primary" />
                        <span>{courtName}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-accent-primary bg-surface-subtle px-2 py-1 rounded border border-border-subtle shrink-0">
                      #{bookingId.substring(0, 8)}
                    </span>
                  </Card.Header>

                  <Card.Body className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center text-xs text-text-muted gap-2">
                      <Calendar size={14} className="text-accent-primary shrink-0" />
                      <span>Ngày chơi: <strong className="text-gray-900">{dateStr}</strong></span>
                    </div>

                    <div className="flex items-center text-xs text-text-muted gap-2">
                      <Clock size={14} className="text-accent-primary shrink-0" />
                      <span>Khung giờ: <strong className="text-gray-900">{timeLabel}</strong></span>
                    </div>

                    {item.hold_expiry_at && (statusStr === 'HOLDING') && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5 mt-2">
                        <AlertCircle size={14} className="shrink-0 text-amber-600" />
                        <span>Hết hạn giữ sân lúc: {new Date(item.hold_expiry_at).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                      <span className="text-xs text-text-muted">Tổng thanh toán:</span>
                      <span className="font-bold text-brand-orange text-base">
                        {price ? `${Number(price).toLocaleString('vi-VN')}đ` : 'Theo báo giá sân'}
                      </span>
                    </div>
                  </Card.Body>

                  <Card.Footer className="pt-2 flex flex-wrap gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/my-bookings/${bookingId}`)}
                    >
                      Xem chi tiết
                    </Button>

                    {/* COMPLETED Booking Review Action */}
                    {statusStr === 'COMPLETED' && (
                      item.review ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Đã đánh giá ({item.review.rating}★)</span>
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 shadow-xs"
                          leftIcon={<Star size={14} className="fill-current" />}
                          onClick={() => setReviewModalBooking(item)}
                        >
                          Đánh giá
                        </Button>
                      )
                    )}

                    {/* CTA "Hủy đơn" rendered ONLY for verified Backend Cancellable Statuses (HOLDING, CONFIRMED) */}
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        disabled={isGlobalPending}
                        aria-busy={isCancelling}
                        leftIcon={<XCircle size={15} />}
                        onClick={() => {
                          if (!isGlobalPending) {
                            setConfirmCancelModal(item);
                          }
                        }}
                      >
                        Hủy đơn
                      </Button>
                    )}
                  </Card.Footer>
                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* REVIEW MODAL FOR COMPLETED BOOKINGS */}
      {reviewModalBooking && (
        <ReviewModal
          isOpen={Boolean(reviewModalBooking)}
          onClose={() => setReviewModalBooking(null)}
          bookingId={reviewModalBooking.booking_id || reviewModalBooking.id}
          venueName={reviewModalBooking.court?.branch?.venue?.venue_name || reviewModalBooking.Venue?.venue_name || reviewModalBooking.venue_name || 'Câu lạc bộ thể thao'}
          courtName={reviewModalBooking.court?.court_name || reviewModalBooking.Court?.court_name || reviewModalBooking.court_name}
          bookingDate={reviewModalBooking.booking_date}
          onSuccess={(createdReview) => {
            setBookings((prev) =>
              prev.map((b) =>
                (b.booking_id || b.id) === (reviewModalBooking.booking_id || reviewModalBooking.id)
                  ? { ...b, review: createdReview }
                  : b
              )
            );
          }}
        />
      )}

      {/* CONFIRMATION OVERLAY FOR DESTRUCTIVE CANCELLATION ACTION */}
      {confirmCancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <Card padding="lg" radius="xl" className="max-w-md w-full border border-border-subtle-medium shadow-2xl space-y-4 bg-surface">
            <Card.Header className="pb-2 border-b border-border-subtle flex items-center gap-2 text-status-danger-text">
              <AlertCircle size={22} className="shrink-0" />
              <h3 id="cancel-modal-title" className="font-bold text-lg text-gray-900">
                Xác nhận hủy đơn đặt sân
              </h3>
            </Card.Header>
            <Card.Body className="space-y-2 text-sm text-gray-700">
              <p>
                Bạn có chắc chắn muốn hủy đơn giữ sân tại <strong className="text-gray-900">{confirmCancelModal.Venue?.venue_name || confirmCancelModal.venue_name || 'sân thể thao'}</strong> (<span className="font-mono text-accent-primary text-xs">#{(confirmCancelModal.booking_id || confirmCancelModal.id).substring(0, 8)}</span>)?
              </p>
              <p className="text-xs text-text-muted">
                Sau khi xác nhận hủy, trạng thái đơn sẽ được cập nhật thành <strong style={{ color : "Red"}}>Đã hủy</strong> theo quy định SportHub.
              </p>
            </Card.Body>
            <Card.Footer className="pt-3 border-t border-border-subtle flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!!cancellingId}
                onClick={() => setConfirmCancelModal(null)}
              >
                Quay lại
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!!cancellingId}
                aria-busy={!!cancellingId}
                leftIcon={<XCircle size={16} />}
                onClick={handleConfirmCancel}
              >
                {cancellingId ? 'Đang xử lý hủy...' : 'Xác nhận hủy'}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}
    </div>
  );
}
