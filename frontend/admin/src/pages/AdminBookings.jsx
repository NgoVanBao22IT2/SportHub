import { useState, useEffect } from 'react';
import { ClipboardList, Search, RefreshCw, Calendar, Clock } from 'lucide-react';
import { getAdminBookings } from '../api/admin';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async (page = 1, search = searchQuery) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search && search.trim()) params.search = search.trim();
      const res = await getAdminBookings(params);
      setBookings(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBookings(1, searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'WAITING_OWNER_CONFIRMATION':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Toàn Bộ Đơn Đặt Sân</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi dữ liệu ({meta.total.toLocaleString('vi-VN')} đơn đặt sân trên toàn hệ thống).
          </p>
        </div>
        <button
          onClick={() => fetchBookings(meta.page, searchQuery)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, tên khách hàng, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Mã Đơn Đặt</th>
                <th className="py-3.5 px-4">Khách Hàng (Customer)</th>
                <th className="py-3.5 px-4">Ngày Đặt & Khung Giờ</th>
                <th className="py-3.5 px-4">Tổng Tiền</th>
                <th className="py-3.5 px-4">Trạng Thái Đơn</th>
                <th className="py-3.5 px-4">Thời Gian Khởi Tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Đang nạp đơn đặt sân từ DB...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy đơn đặt sân phù hợp.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-cyan-400" />
                        <span className="font-mono font-bold text-cyan-300">#{b.booking_id.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-200 font-bold">{b.customer?.full_name || 'Khách hàng'}</p>
                      <p className="text-[11px] text-slate-400">{b.customer?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{b.booking_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5 font-mono">
                        <Clock size={12} />
                        <span>{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                      {parseInt(b.total_amount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold ${getStatusBadge(b.booking_status)}`}>
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString('vi-VN') : 'N/A'}
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
              onClick={() => fetchBookings(meta.page - 1, searchQuery)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchBookings(meta.page + 1, searchQuery)}
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
