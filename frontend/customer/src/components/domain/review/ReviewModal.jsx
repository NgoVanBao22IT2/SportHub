import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import Button from '../../ui/Button';
import { createReview } from '../../../api/reviews';

const RATING_LABELS = {
  1: 'Rất tệ',
  2: 'Không tốt',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Tuyệt vời'
};

export default function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  venueName = 'Câu lạc bộ thể thao',
  courtName,
  bookingDate,
  onSuccess
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setComment('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, bookingId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const currentDisplayRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingId) {
      setError('Thiếu mã đơn đặt sân (bookingId).');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao đánh giá (1 - 5 sao).');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await createReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(res.data);
      }

      // Close modal after brief success feedback
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error submitting review:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl border border-border-subtle-medium overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-border-subtle flex items-start justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-brand-orange/5 to-transparent">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-900 mb-1.5">
              <Star size={12} className="fill-amber-500 text-amber-500" /> Đánh giá trải nghiệm
            </span>
            <h2 id="review-modal-title" className="text-xl font-bold text-gray-900 leading-tight">
              {venueName}
            </h2>
            {(courtName || bookingDate) && (
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-accent-primary" />
                <span>{courtName || 'Sân tiêu chuẩn'}</span>
                {bookingDate && <span>• Ngày chơi: <strong>{bookingDate}</strong></span>}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-text-muted hover:text-gray-900 hover:bg-gray-100 transition disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* SUCCESS STATE */}
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs animate-in zoom-in-75">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Cảm ơn bạn đã gửi đánh giá!</h3>
              <p className="text-sm text-text-muted max-w-xs">
                Ý kiến đóng góp chân thực của bạn giúp cộng đồng thể thao có thêm thông tin hữu ích.
              </p>
            </div>
          ) : (
            <>
              {/* ERROR BANNER */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* STAR RATING SELECTOR */}
              <div className="text-center space-y-2 py-2 bg-surface-subtle rounded-2xl border border-border-subtle p-4">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                  Bạn đánh giá trải nghiệm thế nào?
                </label>

                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= currentDisplayRating;
                    return (
                      <button
                        type="button"
                        key={starValue}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-xl transition hover:scale-125 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                        aria-label={`${starValue} sao - ${RATING_LABELS[starValue]}`}
                      >
                        <Star
                          size={36}
                          className={`transition-colors duration-150 ${
                            isFilled
                              ? 'text-amber-500 fill-amber-500 drop-shadow-xs'
                              : 'text-gray-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-sm font-extrabold text-amber-600 transition-all duration-150">
                  {RATING_LABELS[currentDisplayRating] || 'Chọn số sao'}
                </div>
              </div>

              {/* COMMENT TEXTAREA */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="review-comment" className="font-semibold text-gray-800">
                    Chia sẻ nhận xét của bạn <span className="text-text-muted font-normal">(Không bắt buộc)</span>
                  </label>
                  <span className={`text-[11px] ${comment.length > 1800 ? 'text-amber-600 font-bold' : 'text-text-muted'}`}>
                    {comment.length} / 2000
                  </span>
                </div>

                <textarea
                  id="review-comment"
                  rows={4}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chất lượng mặt sân, ánh sáng, thái độ nhân viên, tiện ích bãi xe, không gian thoáng mát..."
                  className="w-full p-3.5 bg-surface border border-border-subtle rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none resize-none transition"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  disabled={loading}
                >
                  Hủy
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading || rating < 1}
                  leftIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} className="fill-current" />}
                  className="min-w-[140px]"
                >
                  {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
