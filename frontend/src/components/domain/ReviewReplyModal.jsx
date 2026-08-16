import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import Button from '../ui/Button';

export default function ReviewReplyModal({ isOpen, onClose, review, onSubmitReply, loading }) {
  const [replyContent, setReplyContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setErrorMsg('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    setErrorMsg('');
    onSubmitReply(review.review_id, replyContent);
  };

  const custName = review.customer?.full_name || 'Khách hàng';
  const courtName = review.court?.court_name || 'Sân con';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-subtle bg-surface-subtle">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-orange" />
            Phản hồi đánh giá của {custName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Review Quote */}
          <div className="bg-surface-subtle p-3 rounded-xl border border-border-subtle space-y-1">
            <p className="font-bold text-gray-900">Sân: {courtName} • Đánh giá: {review.rating} ★</p>
            <p className="text-gray-700 italic">"{review.comment || 'Khách hàng không để lại bình luận.'}"</p>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-bold">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Reply Textarea */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-900 block">
              Nội dung phản hồi từ Chủ sân: <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Cảm ơn bạn đã trải nghiệm dịch vụ tại sân của chúng tôi! Chúng tôi rất hân hạnh..."
              className="w-full p-3 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 focus:border-brand-orange focus:outline-none text-xs"
              required
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={loading}
              leftIcon={<Send size={14} />}
            >
              Gửi phản hồi
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
