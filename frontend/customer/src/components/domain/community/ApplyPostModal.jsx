import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import communityApi from '../../../api/communityApi';

export default function ApplyPostModal({ isOpen, onClose, post, onSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await communityApi.applyPost(post.post_id, message);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            {post.post_type === 'PASS_BOOKING' ? 'Nhận suất pass' : 'Đăng ký tham gia'}
          </span>
          <h3 className="font-bold text-lg text-gray-900 mt-2 line-clamp-1">{post.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Tác giả: {post.author?.full_name}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-bold text-gray-900 text-base">Gửi yêu cầu thành công!</h4>
            <p className="text-xs text-gray-500">Tác giả bài viết sẽ nhận được thông báo ngay lập tức.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Lời nhắn gửi tới tác giả (SĐT, Zalo hoặc trình độ của bạn)
              </label>
              <textarea
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Chào bạn, mình xin đăng ký 1 slot tham gia nhé! SĐT/Zalo của mình là..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
