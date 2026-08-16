import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

export default function RejectionModal({
  isOpen,
  onClose,
  booking,
  onConfirmReject,
  loading
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối đơn đặt sân.');
      return;
    }
    setError('');
    onConfirmReject(booking.booking_id, reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            Từ chối đơn đặt sân #{booking.booking_id?.substring(0, 8)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-text-muted hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-gray-700">
            Bạn có chắc chắn muốn từ chối đơn đặt sân của <strong>{booking.customer?.full_name || 'Khách hàng'}</strong> ngày <strong>{booking.booking_date}</strong> không?
          </p>

          <div className="space-y-1.5">
            <label htmlFor="rejection-reason-input" className="font-bold text-gray-900 block">
              Lý do từ chối đơn <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="VD: Khách chuyển nhầm tiền, sân đang sửa chữa đột xuất..."
              className="w-full p-3 rounded-xl border border-border-subtle-medium focus:border-brand-orange focus:outline-none text-xs"
            />
            {error && <p className="text-red-600 text-[11px] font-semibold">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" size="sm" loading={loading}>
              Xác nhận từ chối
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
