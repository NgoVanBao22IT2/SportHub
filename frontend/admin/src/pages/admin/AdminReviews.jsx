import { useState, useEffect } from 'react';
import { Star, Search, RefreshCw, Filter } from 'lucide-react';
import { getAdminReviews } from '../../api/admin';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (ratingFilter) params.rating = ratingFilter;
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
  }, [ratingFilter]);

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.customer?.full_name && r.customer.full_name.toLowerCase().includes(q)) ||
      (r.court?.court_name && r.court.court_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Đánh Giá Của Khách Hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách đánh giá & phản hồi trải nghiệm đặt sân ({meta.total} đánh giá trong DB).</p>
        </div>
        <button
          onClick={() => fetchReviews(meta.page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên khách hàng, nội dung đánh giá..."
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
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
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

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Sân Con / Cụm Sân</th>
                <th className="py-3.5 px-4">Điểm Đánh Giá</th>
                <th className="py-3.5 px-4">Bình Luận / Nhận Xét</th>
                <th className="py-3.5 px-4">Ngày Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách đánh giá từ DB...
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Chưa có đánh giá nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr key={r.review_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <p className="font-bold text-white">{r.customer?.full_name || 'Khách hàng'}</p>
                      <p className="text-[11px] text-slate-400">{r.customer?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <p className="font-bold text-slate-200">{r.court?.court_name || 'Sân con'}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                        {r.court?.sport_category || 'Thể thao'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={14} className="fill-amber-400" />
                        <span>{r.rating} / 5</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-md truncate italic">
                      "{r.comment || 'Không có nhận xét văn bản.'}"
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                  </tr>
                ))
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
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchReviews(meta.page + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
