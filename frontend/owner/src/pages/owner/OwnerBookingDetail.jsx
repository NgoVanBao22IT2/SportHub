import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileImage,
  ExternalLink,
  History,
  AlertTriangle
} from 'lucide-react';
import { getOwnerBookingDetail, approveBooking, rejectBooking } from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import RejectionModal from '../../components/domain/RejectionModal';

export default function OwnerBookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBookingDetail = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerBookingDetail(bookingId);
      if (res && res.data) {
        setBooking(res.data);
      } else {
        setBooking(res);
      }
    } catch (err) {
      console.error('Error fetching owner booking detail:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải thông tin đơn đặt sân.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetail();
  }, [fetchBookingDetail]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approveBooking(bookingId);
      showToast('Đã phê duyệt đơn đặt sân thành công!');
      setShowApproveConfirm(false);
      fetchBookingDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi duyệt đơn'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (bId, reason) => {
    try {
      setActionLoading(true);
      await rejectBooking(bId, reason);
      showToast('Đã từ chối đơn đặt sân!');
      setShowRejectModal(false);
      fetchBookingDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi từ chối đơn'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" radius="xl" />
          <div className="space-y-2">
            <Skeleton width="220px" height="24px" />
            <Skeleton width="140px" height="14px" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg" radius="2xl" className="space-y-4">
            <Skeleton width="140px" height="20px" />
            <Skeleton width="100%" height="100px" radius="xl" />
          </Card>
          <Card padding="lg" radius="2xl" className="space-y-4">
            <Skeleton width="140px" height="20px" />
            <Skeleton width="100%" height="100px" radius="xl" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Không tìm thấy đơn đặt sân"
          description={error || 'Đơn đặt sân này không tồn tại hoặc không thuộc quyền quản lý của bạn.'}
          onRetry={fetchBookingDetail}
        />
        <div className="mt-4 text-center">
          <Link to="/owner/bookings">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Quay lại danh sách đơn hàng
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const custName = booking.customer?.full_name || 'Khách đặt sân';
  const custEmail = booking.customer?.email || 'N/A';
  const custPhone = booking.customer?.phone_number || 'N/A';

  const courtName = booking.court?.court_name || 'Sân con';
  const branchName = booking.court?.branch?.branch_name || 'Chi nhánh chính';
  const venueName = booking.court?.branch?.venue?.venue_name || 'Câu lạc bộ';
  const venuePhone = booking.court?.branch?.venue?.contact_phone || '';

  const priceFormatted = booking.total_price ? `${parseFloat(booking.total_price).toLocaleString('vi-VN')}đ` : '0đ';
  const status = booking.booking_status;
  const payment = booking.payments && booking.payments.length > 0 ? booking.payments[0] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/owner/bookings">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Đơn đặt sân #{booking.booking_id?.substring(0, 8)}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Khởi tạo lúc: {new Date(booking.created_at || Date.now()).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(status === 'WAITING_OWNER_CONFIRMATION' || status === 'HOLDING' || status === 'PAYMENT_PENDING' || booking.payment_proof_url) && status !== 'CONFIRMED' && status !== 'REJECTED' && status !== 'CANCELLED' && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                leftIcon={<XCircle size={16} />}
              >
                Từ chối
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowApproveConfirm(true)}
                leftIcon={<CheckCircle2 size={16} />}
              >
                Duyệt đơn
              </Button>
            </>
          )}

          {status === 'CONFIRMED' && <Badge variant="success" size="md">ĐÃ DUYỆT ĐẶT SÂN</Badge>}
          {status === 'REJECTED' && <Badge variant="danger" size="md">ĐÃ TỪ CHỐI</Badge>}
          {status === 'CANCELLED' && <Badge variant="danger" size="md">ĐÃ HỦY</Badge>}
        </div>
      </div>

      {/* GRID DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CARD 1: CUSTOMER & VENUE INFO */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User size={16} className="text-brand-orange" />
              Thông tin Khách hàng & Sân
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block">Họ và tên khách hàng:</span>
              <span className="font-bold text-gray-900 text-sm">{custName}</span>
            </div>

            <div>
              <span className="text-text-muted block">Số điện thoại liên hệ:</span>
              <span className="font-bold text-brand-orange text-sm font-mono">{custPhone}</span>
            </div>

            <div>
              <span className="text-text-muted block">Email:</span>
              <span className="font-medium text-gray-900">{custEmail}</span>
            </div>

            <div className="pt-2 border-t border-border-subtle space-y-2">
              <div>
                <span className="text-text-muted block">Câu lạc bộ:</span>
                <span className="font-bold text-gray-900">{venueName} ({branchName})</span>
              </div>

              <div>
                <span className="text-text-muted block">Sân con đặt:</span>
                <span className="font-extrabold text-brand-orange text-sm">{courtName}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* CARD 2: BOOKING TIME & PRICE */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-brand-orange" />
              Thời gian & Chi phí
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block">Ngày chơi:</span>
              <span className="font-bold text-gray-900 text-sm">{booking.booking_date}</span>
            </div>

            <div>
              <span className="text-text-muted block">Khung giờ đặt:</span>
              <span className="font-bold text-gray-900 text-sm">{booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}</span>
            </div>

            <div>
              <span className="text-text-muted block">Trạng thái giữ sân:</span>
              <Badge variant={status === 'CONFIRMED' ? 'success' : 'warning'} size="sm">
                {status}
              </Badge>
            </div>

            <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
              <span className="font-bold text-gray-900 text-sm">Tổng tiền thanh toán:</span>
              <span className="font-extrabold text-brand-orange text-xl">{priceFormatted}</span>
            </div>
          </div>
        </Card>

      </div>

      {/* CARD 3: PAYMENT PROOF SECTION */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <CreditCard size={16} className="text-brand-orange" />
            Thông tin Thanh toán & Minh chứng Giao dịch
          </h2>
          <Badge variant="info" size="sm">{payment?.payment_method || 'BANK_TRANSFER'}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-text-muted block">Phương thức thanh toán:</span>
              <span className="font-bold text-gray-900">{payment?.payment_method || 'Chuyển khoản Ngân hàng'}</span>
            </div>

            <div>
              <span className="text-text-muted block">Trạng thái thanh toán:</span>
              <span className="font-bold text-emerald-600">{payment?.payment_status || 'CHỜ XÁC NHẬN'}</span>
            </div>

            {booking.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-1 mt-2">
                <span className="font-bold block">Lý do từ chối đơn:</span>
                <p>{booking.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Proof Image Box */}
          <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle text-center space-y-2">
            <span className="text-xs font-bold text-gray-900 block text-left">Ảnh minh chứng chuyển khoản:</span>
            {booking.payment_proof_url ? (
              <div>
                <a
                  href={booking.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block w-full max-h-60 overflow-hidden rounded-xl border"
                >
                  <img
                    src={booking.payment_proof_url}
                    alt="Proof"
                    className="w-full h-full object-contain max-h-60 group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-dark/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <ExternalLink size={16} /> Phóng to ảnh
                  </div>
                </a>
              </div>
            ) : (
              <div className="py-6 text-text-muted text-xs">
                Chưa có ảnh minh chứng được upload cho đơn hàng này.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* REJECTION MODAL */}
      <RejectionModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        booking={booking}
        onConfirmReject={handleReject}
        loading={actionLoading}
      />

      {/* CONFIRM APPROVE DIALOG */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận duyệt đơn</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn duyệt đơn đặt sân này không? Booking status sẽ chuyển sang <strong>CONFIRMED</strong>.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setShowApproveConfirm(false)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" loading={actionLoading} onClick={handleApprove}>
                Duyệt đơn ngay
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
