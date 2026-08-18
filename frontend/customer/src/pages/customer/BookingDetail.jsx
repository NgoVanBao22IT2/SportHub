import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, RefreshCw, ArrowLeft, AlertCircle, ShieldCheck, CreditCard, XCircle, Tag, UserCheck } from 'lucide-react';
import { getBookingById, cancelBooking } from '../../api/bookings';

// Design System Imports
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

// Centralized Cancellable Booking Statuses based on Backend Audit (booking.service.js)
const CANCELLABLE_BOOKING_STATUSES = ['HOLDING', 'CONFIRMED'];

const isBookingCancellable = (statusStr) => {
  if (!statusStr) return false;
  return CANCELLABLE_BOOKING_STATUSES.includes(String(statusStr).toUpperCase());
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // State Management
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);

  // Cancellation States
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [refreshError, setRefreshError] = useState('');

  // Fetch Booking Detail from Backend API (Strict Source of Truth)
  const fetchDetail = useCallback(async () => {
    // 1. Strict Booking ID Validation before calling API (Section 5)
    const cleanId = String(bookingId || '').trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      setErrorCode(400);
      setErrorMessage('Yêu cầu xem đơn đặt sân không hợp lệ.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorCode(null);
      setErrorMessage('');
      setUnauthorized(false);
      setCancelError('');
      setRefreshError('');

      const res = await getBookingById(cleanId);
      const bookingData = res?.data || res;

      // Section 9: Required booking object validation (Malformed response protection)
      if (
        !bookingData ||
        typeof bookingData !== 'object' ||
        Array.isArray(bookingData) ||
        (!bookingData.booking_id && !bookingData.id)
      ) {
        setErrorCode(422);
        setErrorMessage('Dữ liệu đơn đặt sân không hợp lệ. Vui lòng thử lại.');
        setBooking(null);
      } else {
        setBooking(bookingData);
      }
    } catch (err) {
      console.error("Failed to fetch booking detail", err);
      const status = err.response?.status;
      setErrorCode(status || 500);

      if (status === 401) {
        setUnauthorized(true);
        setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (status === 400) {
        setErrorMessage('Yêu cầu xem đơn đặt sân không hợp lệ.');
      } else if (status === 403) {
        setErrorMessage('Bạn không có quyền xem đơn đặt sân này.');
      } else if (status === 404) {
        // Section 11: Security-neutral error message for HTTP 404
        setErrorMessage('Không tìm thấy đơn đặt sân hoặc bạn không có quyền xem đơn này.');
      } else if (status === 409) {
        setErrorMessage('Đơn đặt sân vừa có sự thay đổi. Vui lòng tải lại trang.');
      } else if (status === 429) {
        setErrorMessage('Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau.');
      } else {
        setErrorMessage('Máy chủ đang gặp sự cố. Vui lòng thử lại.');
      }
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState('');

  // Handle Confirmed Cancellation via Backend API
  const handleConfirmCancel = async () => {
    if (!booking || cancelling) return;
    if (!cancelReason.trim()) {
      setCancelReasonError('Vui lòng nhập lý do hủy đơn đặt sân.');
      return;
    }
    const currentBookingId = booking.booking_id || booking.id || bookingId;

    try {
      setCancelling(true);
      setCancelError('');
      setCancelReasonError('');
      setRefreshError('');

      // 1. Send Real Cancel Request
      await cancelBooking(currentBookingId, cancelReason.trim());
      setShowCancelModal(false);

      // 2. Separate Refetch Flow (Distinguish Cancel Success vs Refetch Failure)
      try {
        await fetchDetail();
      } catch (refetchErr) {
        console.warn("Cancel API succeeded, but detail refetch failed", refetchErr);
        setRefreshError('Đơn đã được hủy thành công, nhưng chưa thể tải lại chi tiết. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error("Failed to cancel booking in detail view", err);
      const status = err.response?.status;
      let msg = err.response?.data?.message;

      if (status === 400) {
        msg = msg || 'Đơn đặt sân này không thể hủy ở trạng thái hiện tại.';
      } else if (status === 403) {
        msg = msg || 'Bạn không có quyền thực hiện thao tác này.';
      } else if (status === 404) {
        msg = 'Không tìm thấy đơn hoặc bạn không có quyền thao tác.';
      } else if (status === 409) {
        msg = msg || 'Đơn đặt sân vừa thay đổi. Vui lòng tải lại danh sách.';
      } else if (status === 429) {
        msg = 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau.';
      } else {
        msg = msg || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
      }

      setCancelError(msg);
    } finally {
      setCancelling(false);
    }
  };

  // Status Badge Helper for Booking Status (Neutral fallback for unmapped/missing statuses)
  const getBookingStatusBadge = (statusStr) => {
    if (!statusStr) return { variant: 'default', label: 'Trạng thái: Chưa có dữ liệu' };
    const status = String(statusStr).toUpperCase();
    switch (status) {
      case 'CONFIRMED':
        return { variant: 'success', label: 'Đã xác nhận (CONFIRMED)' };
      case 'WAITING_OWNER_CONFIRMATION':
        return { variant: 'warning', label: 'Chờ chủ sân xác nhận' };
      case 'PAYMENT_SUCCESS':
        return { variant: 'success', label: 'Thanh toán thành công — Chờ xác nhận' };
      case 'REJECTED':
        return { variant: 'danger', label: 'Chủ sân từ chối' };
      case 'HOLDING':
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return { variant: 'warning', label: 'Đang giữ chỗ (10 phút)' };
      case 'COMPLETED':
        return { variant: 'info', label: 'Đã hoàn thành' };
      case 'CANCELLED':
        return { variant: 'neutral', label: 'Đã hủy' };
      case 'CANCEL_REQUESTED':
        return { variant: 'warning', label: 'Chờ chủ sân duyệt hủy & hoàn tiền' };
      case 'EXPIRED':
        return { variant: 'neutral', label: 'Hết hạn giữ chỗ' };
      case 'FAILED':
      case 'PAYMENT_FAILED':
        return { variant: 'danger', label: 'Đặt thất bại' };
      default:
        return { variant: 'default', label: `Trạng thái: ${statusStr}` };
    }
  };

  // Status Badge Helper for Payment Status (Independent State Machine & Neutral Fallback)
  const getPaymentStatusBadge = (statusStr) => {
    if (!statusStr) return { variant: 'default', label: 'Thanh toán: Chưa có dữ liệu' };
    const status = String(statusStr).toUpperCase();
    switch (status) {
      case 'PAID':
        return { variant: 'success', label: 'Đã thanh toán' };
      case 'PENDING':
      case 'UNPAID':
      case 'PAYMENT_PENDING':
        return { variant: 'warning', label: 'Chưa thanh toán' };
      case 'REFUNDED':
        return { variant: 'info', label: 'Đã hoàn tiền' };
      case 'FAILED':
        return { variant: 'danger', label: 'Thanh toán thất bại' };
      default:
        return { variant: 'default', label: `Thanh toán: ${statusStr}` };
    }
  };

  // 401 Unauthorized State
  if (unauthorized) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-3xl">
        <EmptyState
          title="Yêu cầu đăng nhập"
          description={errorMessage || "Vui lòng đăng nhập tài khoản để xem thông tin đơn đặt sân."}
          action={
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          }
        />
      </main>
    );
  }

  // Error State (400, 403, 404, 422, 5xx, Network)
  if (errorCode && !loading) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-3xl space-y-4">
        <ErrorState
          title={errorCode === 404 ? "Không tìm thấy đơn đặt sân" : "Không thể tải chi tiết đơn"}
          description={errorMessage}
          action={
            <div className="flex gap-3">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/my-bookings')}>
                Về danh sách đơn
              </Button>
              <Button variant="primary" leftIcon={<RefreshCw size={16} />} onClick={fetchDetail}>
                Thử lại
              </Button>
            </div>
          }
        />
      </main>
    );
  }

  const bookingStatusRaw = booking?.booking_status || booking?.status;
  const paymentStatusRaw = booking?.payment_status || (booking?.payments && booking?.payments.length > 0 ? booking.payments[0].payment_status : null);
  const canCancel = isBookingCancellable(bookingStatusRaw);

  const bookingBadge = getBookingStatusBadge(bookingStatusRaw);
  const paymentBadge = getPaymentStatusBadge(paymentStatusRaw);

  const displayId = booking?.booking_id || booking?.id || bookingId || '';

  const venueName = booking?.court?.branch?.venue?.venue_name || booking?.Venue?.venue_name || booking?.venue_name || (booking?.court_id ? `Mã sân: ${booking.court_id}` : 'Chưa có thông tin sân');
  const courtName = booking?.court?.court_name || booking?.Court?.court_name || booking?.court_name || (booking?.court_id ? `Mã sân: ${booking.court_id}` : 'Chưa có thông tin sân');

  const dateStr = booking?.booking_date || 'Chưa có dữ liệu';
  const timeLabel = (booking?.start_time && booking?.end_time)
    ? `${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`
    : 'Chưa có dữ liệu';

  // Section 3: Read strictly booking.total_amount without fallback to booking.price or default numeric values
  const totalAmount = booking?.total_amount;

  return (
    <main className="w-full bg-surface-subtle min-h-screen pb-20">
      {/* HEADER SECTION */}
      <section className="bg-surface border-b border-border-subtle-medium py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="flex items-center text-xs text-text-muted gap-2">
            <Link to="/" className="hover:text-accent-primary">Trang chủ</Link>
            <span>/</span>
            <Link to="/my-bookings" className="hover:text-accent-primary">Đơn đặt của tôi</Link>
            {/* <span>/</span>
            <span className="text-gray-900 font-medium font-mono">#{displayId.substring(0, 8)}</span> */}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                aria-label="Quay lại danh sách đơn"
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => navigate('/my-bookings')}
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  Chi tiết đơn đặt sân
                </h1>
                {/*  */}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={fetchDetail}
            >
              Cập nhật
            </Button>
          </div>

          {cancelError && (
            <div role="alert" className="p-4 bg-status-danger-bg border border-status-danger-text/20 rounded-xl text-status-danger-text text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          {refreshError && (
            <div role="alert" className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm flex items-center justify-between gap-2">
              <span>{refreshError}</span>
              <Button variant="outline" size="sm" onClick={fetchDetail}>
                Tải lại chi tiết
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        {loading ? (
          /* SKELETON LOADING STATE */
          <Card padding="lg" radius="xl" className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
              <Skeleton variant="text" width="40%" height="2rem" />
              <Skeleton variant="rectangular" width="100px" height="30px" radius="full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton variant="rectangular" height="80px" radius="lg" />
              <Skeleton variant="rectangular" height="80px" radius="lg" />
              <Skeleton variant="rectangular" height="80px" radius="lg" />
              <Skeleton variant="rectangular" height="80px" radius="lg" />
            </div>
          </Card>
        ) : (
          /* SUCCESS CONTENT */
          <div className="space-y-6">
            {/* OVERVIEW CARD */}
            <Card padding="lg" radius="xl" className="border border-border-subtle-medium shadow-sm space-y-6">

              {/* CARD TOP BAR: STATUS BADGES */}
              <div className="pb-4 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={bookingBadge.variant} size="md" className="font-bold">
                    {bookingBadge.label}
                  </Badge>
                  <Badge variant={paymentBadge.variant} size="md" className="font-bold">
                    {paymentBadge.label}
                  </Badge>
                </div>
                {/* <span className="text-xs font-mono text-accent-primary bg-surface-subtle px-3 py-1 rounded-lg border border-border-subtle">
                  Mã: #{displayId.substring(0, 8)}
                </span> */}
              </div>

              {/* VENUE & COURT INFO */}
              <div className="space-y-2">
                <p className="text-md  text-text-muted flex items-center gap-2">
                  <Tag size={22} className="text-accent-primary shrink-0" />
                  <p className="text-md text-text-muted text-gray-900 flex items-center gap-2">
                  Mã đơn: {displayId}
                </p>
                </p>
                <p className="text-md text-text-muted text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-accent-primary" size={22} />
                  {venueName}
                </p>
                
              </div>

              {/* BOOKING DETAILS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-surface-subtle rounded-xl border border-border-subtle space-y-1">
                  <div className="flex items-center text-xs text-text-muted gap-1.5">
                    <Calendar size={15} className="text-accent-primary shrink-0" />
                    <span>Ngày chơi</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{dateStr}</p>
                </div>

                <div className="p-4 bg-surface-subtle rounded-xl border border-border-subtle space-y-1">
                  <div className="flex items-center text-xs text-text-muted gap-1.5">
                    <Clock size={15} className="text-accent-primary shrink-0" />
                    <span>Khung giờ</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{timeLabel}</p>
                </div>

                <div className="p-4 bg-surface-subtle rounded-xl border border-border-subtle space-y-1">
                  <div className="flex items-center text-xs text-text-muted gap-1.5">
                    <CreditCard size={15} className="text-brand-orange shrink-0" />
                    <span>Tổng tiền thanh toán</span>
                  </div>
                  <p className="font-bold text-brand-orange text-lg">
                    {totalAmount !== undefined && totalAmount !== null
                      ? `${Number(totalAmount).toLocaleString('vi-VN')}đ`
                      : 'Chưa có dữ liệu'}
                  </p>
                </div>

                <div className="p-4 bg-surface-subtle rounded-xl border border-border-subtle space-y-1">
                  <div className="flex items-center text-xs text-text-muted gap-1.5">
                    <UserCheck size={15} className="text-accent-primary shrink-0" />
                    <span>Ngày tạo đơn</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {(booking?.createdAt || booking?.created_at) ? new Date(booking.createdAt || booking.created_at).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
                  </p>
                </div>
              </div>

              {/* HOLDING EXPIRY WARNING */}
              {booking?.hold_expiry_at && String(bookingStatusRaw).toUpperCase() === 'HOLDING' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-center gap-3">
                  <AlertCircle size={20} className="shrink-0 text-amber-600" />
                  <div>
                    <strong className="block font-semibold">Đang giữ chỗ tạm thời</strong>
                    <span className="text-xs">Thời hạn giữ chỗ sẽ hết vào lúc: {new Date(booking.hold_expiry_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              )}

              {/* CANCELLATION REASON IF CANCELLED */}
              {booking?.cancellation_reason && String(bookingStatusRaw).toUpperCase() === 'CANCELLED' && (
                <div className="p-4 bg-surface-subtle border border-border-subtle-medium rounded-xl text-sm space-y-1">
                  <span className="text-xs font-bold text-text-muted block uppercase tracking-wider">Lý do hủy đơn</span>
                  <p className="text-gray-800 italic">"{booking.cancellation_reason}"</p>
                  {booking.cancelled_at && (
                    <span className="text-[11px] text-text-muted block pt-1">
                      Thời gian hủy: {new Date(booking.cancelled_at).toLocaleString('vi-VN')}
                    </span>
                  )}
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-border-subtle flex flex-wrap justify-between items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => navigate('/my-bookings')}
                >
                  Trở về danh sách đơn đặt
                </Button>

                {canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelling}
                    aria-busy={cancelling}
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setShowCancelModal(true)}
                  >
                    Hủy đơn này
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* CONFIRMATION OVERLAY FOR DESTRUCTIVE CANCELLATION ACTION */}
      {showCancelModal && (
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
            <Card.Body className="space-y-4 text-sm text-gray-700">
              <p className="text-xs">
                Bạn đang thực hiện hủy đơn <span className="font-mono font-bold">#{displayId.substring(0, 8)}</span> tại <strong className="text-gray-900">{venueName}</strong>.
              </p>

              {/* CHÍNH SÁCH HOÀN TIỀN BLOCK */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-3 text-left">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <span>Chính sách hoàn tiền</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Tỷ lệ hoàn tiền tự động tính dựa trên thời gian hủy trước giờ chơi:
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-amber-200/50">
                    <span className="flex items-center gap-1.5 text-amber-900 font-medium">
                      <Clock size={14} className="text-amber-600 shrink-0" /> Trên 24 giờ trước giờ chơi
                    </span>
                    <span className="font-bold text-amber-900">Hoàn 100%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-amber-200/50">
                    <span className="flex items-center gap-1.5 text-amber-900 font-medium">
                      <Clock size={14} className="text-amber-600 shrink-0" /> 12 – 24 giờ trước giờ chơi
                    </span>
                    <span className="font-bold text-amber-900">Hoàn 70%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-amber-200/50">
                    <span className="flex items-center gap-1.5 text-amber-900 font-medium">
                      <Clock size={14} className="text-amber-600 shrink-0" /> 2 – 12 giờ trước giờ chơi
                    </span>
                    <span className="font-bold text-amber-900">Hoàn 50%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5 text-amber-900 font-medium">
                      <Clock size={14} className="text-amber-600 shrink-0" /> Dưới 2 giờ trước giờ chơi
                    </span>
                    <span className="font-bold text-rose-700">Không hoàn tiền</span>
                  </div>
                </div>
              </div>

              {/* LÝ DO HỦY ĐƠN */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-900 block">Lý do hủy đơn sân *</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => { setCancelReason(e.target.value); setCancelReasonError(''); }}
                  placeholder="Nhập lý do hủy đơn (VD: Có việc bận đột xuất, đổi lịch chơi cùng bạn...)"
                  className="w-full p-3 rounded-xl border border-border-subtle-medium text-xs font-medium focus:outline-none focus:border-brand-orange bg-surface"
                />
                {cancelReasonError && <p className="text-[11px] font-bold text-rose-600">{cancelReasonError}</p>}
              </div>
            </Card.Body>
            <Card.Footer className="pt-3 border-t border-border-subtle flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
              >
                Quay lại
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelling}
                aria-busy={cancelling}
                leftIcon={<XCircle size={16} />}
                onClick={handleConfirmCancel}
              >
                {cancelling ? 'Đang xử lý hủy...' : 'Xác nhận hủy'}
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}
    </main>
  );
}
