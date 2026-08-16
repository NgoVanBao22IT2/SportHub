import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  getOwnerPaymentDetail,
  approveOwnerPayment,
  rejectOwnerPayment
} from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import RejectionModal from '../../components/domain/RejectionModal';

export default function OwnerPaymentDetail() {
  const { paymentId } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPaymentDetail = useCallback(async () => {
    if (!paymentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerPaymentDetail(paymentId);
      if (res && res.data) {
        setPayment(res.data);
      } else {
        setPayment(res);
      }
    } catch (err) {
      console.error('Error fetching owner payment detail:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải thông tin giao dịch.');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchPaymentDetail();
  }, [fetchPaymentDetail]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approveOwnerPayment(paymentId);
      showToast('Đã phê duyệt giao dịch thanh toán thành công!');
      setShowApproveConfirm(false);
      fetchPaymentDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi duyệt giao dịch'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (pId, reason) => {
    try {
      setActionLoading(true);
      await rejectOwnerPayment(paymentId, reason);
      showToast('Đã từ chối giao dịch thanh toán!');
      setShowRejectModal(false);
      fetchPaymentDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi từ chối giao dịch'));
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

  if (error || !payment) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Không tìm thấy giao dịch"
          description={error || 'Giao dịch thanh toán này không tồn tại hoặc không thuộc quyền quản lý của bạn.'}
          onRetry={fetchPaymentDetail}
        />
        <div className="mt-4 text-center">
          <Link to="/owner/payments">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Quay lại danh sách giao dịch
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const booking = payment.booking || {};
  const custName = booking.customer?.full_name || 'Khách đặt sân';
  const custEmail = booking.customer?.email || 'N/A';
  const custPhone = booking.customer?.phone_number || 'N/A';

  const courtName = booking.court?.court_name || 'Sân con';
  const branchName = booking.court?.branch?.branch_name || 'Chi nhánh chính';
  const venueName = booking.court?.branch?.venue?.venue_name || 'Câu lạc bộ';

  const amountFormatted = payment.amount ? `${parseFloat(payment.amount).toLocaleString('vi-VN')}đ` : '0đ';
  const pStatus = payment.payment_status;

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
          <Link to="/owner/payments">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Chi tiết giao dịch #{payment.payment_id?.substring(0, 8)}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Khởi tạo lúc: {new Date(payment.created_at || Date.now()).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(pStatus === 'INITIATED' || pStatus === 'PROCESSING') && (
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
                Phê duyệt thanh toán
              </Button>
            </>
          )}

          {pStatus === 'SUCCESS' && <Badge variant="success" size="md">ĐÃ THANH TOÁN (SUCCESS)</Badge>}
          {pStatus === 'FAILED' && <Badge variant="danger" size="md">ĐÃ TỪ CHỐI (FAILED)</Badge>}
        </div>
      </div>

      {/* GRID DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CARD 1: PAYMENT & TRANSACTION INFO */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-brand-orange" />
              Thông tin Thanh toán
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block">Mã giao dịch (Payment ID):</span>
              <span className="font-mono font-bold text-gray-900">{payment.payment_id}</span>
            </div>

            <div>
              <span className="text-text-muted block">Phương thức thanh toán:</span>
              <Badge variant="info" size="xs">{payment.payment_method || 'BANK_TRANSFER'}</Badge>
            </div>

            <div>
              <span className="text-text-muted block">Mã tham chiếu / Mã đơn Provider:</span>
              <span className="font-mono font-medium text-gray-700">{payment.provider_order_id || 'N/A'}</span>
            </div>

            <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
              <span className="font-bold text-gray-900 text-sm">Số tiền thanh toán:</span>
              <span className="font-extrabold text-brand-orange text-xl">{amountFormatted}</span>
            </div>
          </div>
        </Card>

        {/* CARD 2: CUSTOMER & BOOKING INFO */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User size={16} className="text-brand-orange" />
              Thông tin Khách hàng & Booking
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block">Họ và tên khách hàng:</span>
              <span className="font-bold text-gray-900 text-sm">{custName} ({custPhone})</span>
            </div>

            <div>
              <span className="text-text-muted block">Câu lạc bộ & Sân:</span>
              <span className="font-bold text-gray-900">{venueName} • {courtName}</span>
            </div>

            <div>
              <span className="text-text-muted block">Ngày & Giờ đặt:</span>
              <span className="font-semibold text-gray-900">{booking.booking_date} ({booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)})</span>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <span className="text-text-muted block">Mã đơn đặt sân:</span>
              <Link to={`/owner/bookings/${booking.booking_id}`} className="font-mono font-bold text-brand-orange hover:underline">
                #{booking.booking_id}
              </Link>
            </div>
          </div>
        </Card>

      </div>

      {/* CARD 3: PAYMENT PROOF PHOTO */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-orange" />
            Minh chứng Giao dịch Thanh toán từ Khách hàng
          </h2>
        </div>

        <div className="bg-surface-subtle p-4 rounded-xl border border-border-subtle text-center space-y-2">
          {booking.payment_proof_url ? (
            <div className="space-y-2">
              <a
                href={booking.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full max-h-80 overflow-hidden rounded-xl border"
              >
                <img
                  src={booking.payment_proof_url}
                  alt="Payment Proof"
                  className="w-full h-full object-contain max-h-80 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-dark/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <ExternalLink size={16} /> Mở ảnh phóng to
                </div>
              </a>
              <span className="text-[11px] text-text-muted block">Bấm vào ảnh để xem kích thước đầy đủ</span>
            </div>
          ) : (
            <div className="py-8 text-text-muted text-xs">
              Khách hàng chưa upload ảnh chụp chuyển khoản minh chứng.
            </div>
          )}
        </div>
      </Card>

      {/* REJECTION MODAL */}
      <RejectionModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        booking={booking}
        onConfirmReject={(bId, reason) => handleReject(paymentId, reason)}
        loading={actionLoading}
      />

      {/* CONFIRM APPROVE DIALOG */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận duyệt thanh toán</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn duyệt giao dịch này không? Booking status sẽ chuyển sang <strong>CONFIRMED</strong> và Payment status sẽ chuyển sang <strong>SUCCESS</strong>.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setShowApproveConfirm(false)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" loading={actionLoading} onClick={handleApprove}>
                Duyệt giao dịch ngay
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
