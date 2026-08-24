import React, { useState } from 'react';
import { X, EyeOff, AlertTriangle, CheckSquare, Square, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

const HIDE_REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'offensive', label: 'Nội dung xúc phạm' },
  { id: 'advertisement', label: 'Quảng cáo' },
  { id: 'irrelevant', label: 'Không liên quan' },
  { id: 'policy_violation', label: 'Vi phạm chính sách' },
  { id: 'other', label: 'Khác' },
];

export default function ReviewHideModal({
  isOpen,
  onClose,
  review,
  onSubmit,
  loading = false
}) {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !review) return null;

  const toggleReason = (label) => {
    setErrorMsg('');
    if (selectedReasons.includes(label)) {
      setSelectedReasons(selectedReasons.filter(r => r !== label));
    } else {
      setSelectedReasons([...selectedReasons, label]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedReasons.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một lý do yêu cầu ẩn đánh giá.');
      return;
    }

    if (selectedReasons.includes('Khác') && !otherText.trim()) {
      setErrorMsg('Vui lòng nhập chi tiết lý do khi chọn "Khác".');
      return;
    }

    let finalReasonStr = selectedReasons.join(', ');
    if (selectedReasons.includes('Khác') && otherText.trim()) {
      finalReasonStr = finalReasonStr.replace('Khác', `Khác (${otherText.trim()})`);
    }

    onSubmit(review.review_id, finalReasonStr);
  };

  const custName = review.customer?.full_name || 'Khách hàng';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface rounded-2xl border border-border-subtle-medium shadow-2xl max-w-lg w-full overflow-hidden text-left animate-scale-up"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <EyeOff size={16} />
            </div>
            <span>Yêu cầu ẩn đánh giá</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-text-muted hover:text-gray-900 hover:bg-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Review Snippet */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-border-subtle text-xs space-y-1.5">
            <div className="flex items-center justify-between text-text-muted font-medium">
              <span>Đánh giá từ khách hàng: <strong className="text-gray-900">{custName}</strong></span>
              <span>⭐ {review.rating}/5</span>
            </div>
            <p className="text-gray-700 italic line-clamp-2">"{review.comment || 'Không có bình luận văn bản'}"</p>
          </div>

          {/* Reason Checkbox Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
              Lý do yêu cầu ẩn <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-text-muted -mt-1">
              Chọn một hoặc nhiều lý do vi phạm để gửi đến Quản trị viên SportHub xem xét:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {HIDE_REASONS.map((item) => {
                const isChecked = selectedReasons.includes(item.label);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleReason(item.label)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-rose-50/80 border-rose-400 text-rose-800 shadow-xs'
                        : 'bg-surface hover:bg-surface-subtle border-border-subtle text-gray-700 hover:border-border-subtle-medium'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare size={16} className="text-rose-600 flex-shrink-0" />
                    ) : (
                      <Square size={16} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea for "Khác" or additional notes */}
          {selectedReasons.includes('Khác') && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-xs font-medium text-gray-700">
                Chi tiết lý do khác <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả cụ thể lý do đánh giá này vi phạm..."
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full p-3 rounded-xl border border-border-subtle bg-surface text-xs text-gray-900 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all resize-none"
              />
            </div>
          )}

          {/* Notice Alert */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Yêu cầu ẩn đánh giá sẽ được chuyển đến <strong>Quản trị viên SportHub</strong>. Sau khi Quản trị viên SportHub xem xét và phê duyệt lý do, đánh giá sẽ được chính thức ẩn khỏi trang.
            </p>
          </div>

          {/* Validation Error */}
          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium animate-shake">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={loading}
              leftIcon={loading ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
            >
              {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu ẩn'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
