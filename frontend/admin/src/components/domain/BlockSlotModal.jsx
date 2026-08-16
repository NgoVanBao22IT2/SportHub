import React, { useState, useEffect } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

export default function BlockSlotModal({
  isOpen,
  onClose,
  court,
  date,
  slot,
  onConfirmBlock,
  loading
}) {
  const [reason, setReason] = useState('Bảo trì sân định kỳ');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReason('Bảo trì sân định kỳ');
    setCustomReason('');
    setError('');
  }, [isOpen, slot]);

  if (!isOpen || !slot || !court) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = reason === 'Khác' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Vui lòng nhập hoặc chọn lý do khóa khung giờ.');
      return;
    }
    setError('');
    onConfirmBlock({
      courtId: court.court_id,
      date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      reason: finalReason
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2 text-red-600">
            <Lock size={18} />
            Khóa khung giờ đặt sân
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
          <div className="p-3 bg-surface-subtle border border-border-subtle rounded-xl space-y-1">
            <p className="font-bold text-gray-900">{court.court_name}</p>
            <p className="text-text-muted">
              Ngày: <strong>{date}</strong> • Giờ: <strong className="text-brand-orange">{slot.label || `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 block">Lý do khóa sân *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
            >
              <option value="Bảo trì sân định kỳ">Bảo trì sân định kỳ</option>
              <option value="Tổ chức giải đấu / Sự kiện">Tổ chức giải đấu / Sự kiện</option>
              <option value="Đã có khách đặt ngoài hệ thống">Đã có khách đặt ngoài hệ thống</option>
              <option value="Khác">Khác (Tự nhập lý do)</option>
            </select>

            {reason === 'Khác' && (
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full p-2.5 rounded-xl border border-border-subtle-medium focus:border-brand-orange focus:outline-none text-xs mt-2"
              />
            )}
            {error && <p className="text-red-600 font-semibold">{error}</p>}
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed">
            * Khung giờ sau khi bị khóa sẽ hiển thị trạng thái <strong>BLOCKED</strong> và khách hàng sẽ không thể tiến hành đặt sân trên trang Customer Portal.
          </p>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" size="sm" loading={loading} leftIcon={<Lock size={14} />}>
              Xác nhận khóa khung giờ
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
