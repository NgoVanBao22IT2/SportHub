import React, { useState, useEffect } from 'react';
import { X, Lock, AlertCircle, Clock } from 'lucide-react';
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
  const [blockScope, setBlockScope] = useState('ONE_TIME'); // ONE_TIME | 1_HOUR | 2_HOURS | LONG_TERM
  const [error, setError] = useState('');

  useEffect(() => {
    setReason('Bảo trì sân định kỳ');
    setCustomReason('');
    setBlockScope('ONE_TIME');
    setError('');
  }, [isOpen, slot]);

  if (!isOpen || !slot || !court) return null;

  // Calculate End Time based on Block Scope
  const calculateEndTime = () => {
    if (!slot.start_time) return slot.end_time;
    const [hStr, mStr] = slot.start_time.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);

    if (blockScope === '1_HOUR') {
      h += 1;
    } else if (blockScope === '2_HOURS') {
      h += 2;
    } else {
      return slot.end_time;
    }

    const sH = String(Math.min(h, 23)).padStart(2, '0');
    const sM = String(m).padStart(2, '0');
    return `${sH}:${sM}:00`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = reason === 'Khác' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Vui lòng nhập hoặc chọn lý do khóa khung giờ.');
      return;
    }
    setError('');

    const endTime = calculateEndTime();

    onConfirmBlock({
      courtId: court.court_id,
      date,
      startTime: slot.start_time,
      endTime: endTime || slot.end_time,
      blockType: blockScope === 'LONG_TERM' ? 'LONG_TERM' : 'ONE_TIME',
      durationScope: blockScope,
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
              Ngày áp dụng: <strong>{date}</strong> • Khung giờ bắt đầu: <strong className="text-brand-orange">{slot.label || `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`}</strong>
            </p>
          </div>

          {/* Block Duration / Scope selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 flex items-center gap-1.5">
              <Clock size={14} className="text-brand-orange" />
              Thời hạn / Phạm vi khóa *
            </label>
            <select
              value={blockScope}
              onChange={(e) => setBlockScope(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs font-medium"
            >
              <option value="ONE_TIME">Chỉ khung giờ này (30 phút)</option>
              <option value="1_HOUR">Khóa 1 giờ (2 khung 30 phút liên tiếp)</option>
              <option value="2_HOURS">Khóa 2 giờ (4 khung 30 phút liên tiếp)</option>
              <option value="LONG_TERM">Cho tới khi Owner mở lại (Khóa dài hạn các ngày tương lai)</option>
            </select>
          </div>

          {blockScope === 'LONG_TERM' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>Cảnh báo Khóa dài hạn</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Khung giờ này sẽ bị khóa trên <strong>tất cả các ngày trong tương lai</strong> tính từ ngày <strong>{date}</strong> cho đến khi bạn mở lại trên hệ thống. Khách hàng sẽ không thể đặt khung giờ này.
              </p>
            </div>
          )}

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
              {blockScope === 'LONG_TERM' ? 'Xác nhận khóa dài hạn' : 'Xác nhận khóa khung giờ'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
