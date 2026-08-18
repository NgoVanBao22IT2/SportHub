import React from 'react';
import { X, CheckCircle2, XCircle, ExternalLink, Image as ImageIcon, CreditCard, User, Calendar, DollarSign } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function PaymentProofViewer({
  isOpen,
  onClose,
  proofUrl,
  booking,
  onApprove,
  onReject,
  loadingAction
}) {
  if (!isOpen || !booking) return null;

  const custName = booking.customer?.full_name || 'Khách hàng';
  const custPhone = booking.customer?.phone_number || '';
  const courtName = booking.court?.court_name || 'Sân con';
  const venueName = booking.court?.branch?.venue?.venue_name || 'Câu lạc bộ';
  const rawPrice = booking.total_amount || booking.total_price;
  const priceFormatted = rawPrice ? `${parseFloat(rawPrice).toLocaleString('vi-VN')}đ` : '0đ';
  const paymentMethod = booking.payments && booking.payments.length > 0 ? booking.payments[0].payment_method : 'BANK_TRANSFER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-3xl rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <CreditCard size={18} className="text-brand-orange" />
              Minh chứng giao dịch thanh toán #{booking.booking_id?.substring(0, 8)}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Xác minh ảnh minh chứng từ khách hàng để phê duyệt đơn đặt sân</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-text-muted hover:text-gray-900 hover:bg-surface-subtle transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Side: Proof Image Preview */}
          <div className="space-y-3 flex flex-col items-center justify-center bg-surface-subtle p-4 rounded-xl border border-border-subtle">
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 self-start">
              <ImageIcon size={16} className="text-brand-orange" />
              Ảnh chụp chuyển khoản:
            </span>

            {proofUrl ? (
              <div className="w-full flex flex-col items-center">
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block w-full max-h-80 overflow-hidden rounded-xl border border-border-subtle-medium bg-black/5"
                  title="Bấm để xem ảnh phóng to"
                >
                  <img
                    src={proofUrl}
                    alt="Payment Proof"
                    className="w-full h-full object-contain max-h-80 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-dark/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <ExternalLink size={16} /> Mở ảnh phóng to
                  </div>
                </a>
                <span className="text-[11px] text-text-muted mt-2">Bấm vào ảnh để xem kích thước đầy đủ</span>
              </div>
            ) : (
              <div className="py-12 text-center text-text-muted text-xs space-y-2">
                <ImageIcon size={36} className="mx-auto text-gray-300" />
                <p>Khách hàng chưa upload ảnh minh chứng giao dịch.</p>
              </div>
            )}
          </div>

          {/* Right Side: Booking Summary Details */}
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-3">
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Khách hàng:</span>
                <span className="font-bold text-gray-900">{custName} ({custPhone})</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Câu lạc bộ:</span>
                <span className="font-bold text-gray-900">{venueName}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Sân con:</span>
                <span className="font-semibold text-gray-900">{courtName}</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Ngày & Giờ chơi:</span>
                <span className="font-semibold text-gray-900">{booking.booking_date} ({booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)})</span>
              </div>
              <div className="flex justify-between border-b border-border-subtle pb-2">
                <span className="text-text-muted">Phương thức TT:</span>
                <span className="font-bold text-gray-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-gray-900 text-sm">Tổng tiền đơn:</span>
                <span className="font-extrabold text-brand-orange text-base">{priceFormatted}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Lưu ý:</strong> Vui lòng đối chiếu số tiền và tên người chuyển khoản trên ảnh minh chứng với ứng dụng Ngân hàng/MoMo của bạn trước khi phê duyệt.
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle bg-surface-subtle">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loadingAction}>
            Đóng
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="sm"
              loading={loadingAction}
              onClick={() => onReject(booking)}
              leftIcon={<XCircle size={16} />}
            >
              Từ chối đơn
            </Button>

            <Button
              variant="primary"
              size="sm"
              loading={loadingAction}
              onClick={() => onApprove(booking)}
              leftIcon={<CheckCircle2 size={16} />}
            >
              Xác nhận & Duyệt đơn
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
