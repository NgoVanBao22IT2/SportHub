import { useState, useEffect } from 'react';
import {
  Star,
  Search,
  RefreshCw,
  Filter,
  EyeOff,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  User,
  Loader2
} from 'lucide-react';
import { getAdminReviews, updateAdminReviewHideStatus } from '../../api/admin';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('');
  const [tabFilter, setTabFilter] = useState('ALL'); // 'ALL' | 'PENDING_HIDE' | 'HIDDEN'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (ratingFilter) params.rating = ratingFilter;
      if (tabFilter === 'PENDING_HIDE') params.hideRequestStatus = 'PENDING';
      if (tabFilter === 'HIDDEN') params.status = 'HIDDEN';

      const res = await getAdminReviews(params);
      setReviews(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [ratingFilter, tabFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateHideStatus = async (reviewId, action, reviewCustName) => {
    try {
      setActionLoadingId(reviewId);
      await updateAdminReviewHideStatus(reviewId, action);
      if (action === 'APPROVE') {
        showToast(`Đã duyệt ẩn đánh giá của "${reviewCustName}". Đánh giá đã bị ẩn khỏi trang khách hàng.`);
      } else if (action === 'REJECT') {
        showToast(`Đã từ chối yêu cầu ẩn. Đánh giá của "${reviewCustName}" vẫn hiển thị bình thường.`);
      } else if (action === 'UNHIDE') {
        showToast(`Đã khôi phục hiển thị đánh giá của "${reviewCustName}".`);
      }
      fetchReviews(meta.page);
    } catch (err) {
      console.error('Error updating review hide status:', err);
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi cập nhật trạng thái'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = reviews.filter(r => r.hide_request_status === 'PENDING').length;

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.customer?.full_name && r.customer.full_name.toLowerCase().includes(q)) ||
      (r.customer?.email && r.customer.email.toLowerCase().includes(q)) ||
      (r.court?.court_name && r.court.court_name.toLowerCase().includes(q)) ||
      (r.court?.branch?.venue?.venue_name && r.court.branch.venue.venue_name.toLowerCase().includes(q)) ||
      (r.hide_reason && r.hide_reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Đánh Giá Của Khách Hàng</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm duyệt và xử lý các yêu cầu ẩn đánh giá từ Chủ sân (Owner) theo quy định ({meta.total} đánh giá).
          </p>
        </div>
        <button
          onClick={() => fetchReviews(meta.page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* TABS & FILTER BAR */}
      <div className="space-y-3">
        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setTabFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tabFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            Tất cả đánh giá
          </button>

          <button
            onClick={() => setTabFilter('PENDING_HIDE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tabFilter === 'PENDING_HIDE'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/60 text-amber-400 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <Clock size={13} />
            <span>Yêu cầu ẩn từ Chủ sân</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-slate-950">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTabFilter('HIDDEN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              tabFilter === 'HIDDEN'
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <EyeOff size={13} />
            <span>Đã ẩn</span>
          </button>
        </div>

        {/* SEARCH & RATING FILTER */}
        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo khách hàng, sân, lý do ẩn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Tất cả Số Sao</option>
              <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
              <option value="4">4 Sao ⭐⭐⭐⭐</option>
              <option value="3">3 Sao ⭐⭐⭐</option>
              <option value="2">2 Sao ⭐⭐</option>
              <option value="1">1 Sao ⭐</option>
            </select>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Cụm Sân / Chủ Sân</th>
                <th className="py-3.5 px-4">Điểm Đánh Giá</th>
                <th className="py-3.5 px-4">Nhận Xét & Lý Do Ẩn</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác Duyệt Ẩn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 size={22} className="animate-spin mx-auto text-indigo-500 mb-2" />
                    Đang nạp danh sách đánh giá từ DB...
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có đánh giá nào trong danh mục này.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const venueName = r.court?.branch?.venue?.venue_name || 'Cụm sân';
                  const ownerName = r.court?.branch?.venue?.owner?.full_name || 'Chủ sân';
                  const isActionLoading = actionLoadingId === r.review_id;

                  return (
                    <tr key={r.review_id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{r.customer?.full_name || 'Khách hàng'}</p>
                        <p className="text-[11px] text-slate-400">{r.customer?.email || r.customer?.phone_number || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
                        </p>
                      </td>

                      {/* Venue & Owner */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-indigo-300">{venueName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{r.court?.court_name || 'Sân tiêu chuẩn'}</p>
                        <p className="text-[10px] text-slate-500">Chủ sân: {ownerName}</p>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 font-bold">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span>{r.rating} / 5</span>
                        </div>
                      </td>

                      {/* Comment & Hide Reason */}
                      <td className="py-3.5 px-4 max-w-sm space-y-1.5">
                        <p className="text-slate-200 text-xs italic leading-relaxed">
                          "{r.comment || 'Không có nhận xét văn bản.'}"
                        </p>

                        {/* Hide Request Reason Alert */}
                        {r.hide_reason && (
                          <div className={`p-2 rounded-lg border text-[11px] font-medium flex items-start gap-1.5 ${
                            r.hide_request_status === 'PENDING'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : r.hide_request_status === 'APPROVED'
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                              : 'bg-slate-700/50 border-slate-600 text-slate-400'
                          }`}>
                            <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                            <div>
                              <span className="font-bold">Lý do chủ sân báo cáo:</span> {r.hide_reason}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {r.status === 'HIDDEN' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <EyeOff size={11} /> Đã ẩn
                          </span>
                        ) : r.hide_request_status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            <Clock size={11} /> Chờ duyệt ẩn
                          </span>
                        ) : r.hide_request_status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                            Đã từ chối ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Eye size={11} /> Hiển thị
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {r.hide_request_status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleUpdateHideStatus(r.review_id, 'APPROVE', r.customer?.full_name)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                              title="Xác nhận lý do và ẩn đánh giá này khỏi trang khách hàng"
                            >
                              <EyeOff size={12} />
                              {isActionLoading ? 'Đang duyệt...' : 'Duyệt ẩn'}
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleUpdateHideStatus(r.review_id, 'REJECT', r.customer?.full_name)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                              title="Từ chối yêu cầu và tiếp tục hiển thị đánh giá"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : r.status === 'HIDDEN' ? (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleUpdateHideStatus(r.review_id, 'UNHIDE', r.customer?.full_name)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-indigo-300 font-bold text-xs transition-colors flex items-center gap-1 ml-auto disabled:opacity-50 cursor-pointer"
                          >
                            <Eye size={12} /> Hiện lại
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleUpdateHideStatus(r.review_id, 'APPROVE', r.customer?.full_name)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 font-semibold text-xs transition-colors flex items-center gap-1 ml-auto border border-slate-700 cursor-pointer"
                            title="Admin chủ động ẩn đánh giá này"
                          >
                            <EyeOff size={12} /> Ẩn
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-900/40 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Hiển thị trang <span className="font-bold text-white">{meta.page}</span> / {Math.ceil(meta.total / meta.limit) || 1}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchReviews(meta.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchReviews(meta.page + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
