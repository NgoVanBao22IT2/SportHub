import { useState, useEffect } from 'react';
import { CreditCard, Search, RefreshCw, DollarSign } from 'lucide-react';
import { getAdminPayments } from '../../api/admin';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminPayments({ page, limit: 10 });
      setPayments(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.payment_id && p.payment_id.toLowerCase().includes(q)) ||
      (p.user?.full_name && p.user.full_name.toLowerCase().includes(q)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Giao Dịch Thanh Toán</h1>
          <p className="text-xs text-slate-400 mt-1">Kiểm soát toàn bộ dòng tiền thanh toán trên hệ thống ({meta.total} giao dịch trong DB).</p>
        </div>
        <button
          onClick={() => fetchPayments(meta.page)}
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
            placeholder="Tìm mã thanh toán, người trả, phương thức..."
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
                <th className="py-3.5 px-4">Mã Giao Dịch</th>
                <th className="py-3.5 px-4">Người Thanh Toán</th>
                <th className="py-3.5 px-4">Số Tiền</th>
                <th className="py-3.5 px-4">Phương Thức</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách giao dịch từ DB...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy giao dịch phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-purple-400" />
                        <span className="font-mono font-bold text-purple-300">#{p.payment_id.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <p className="font-bold text-white">{p.user?.full_name || 'Khách hàng'}</p>
                      <p className="text-[11px] text-slate-400">{p.user?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 font-mono">
                      {parseInt(p.amount || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-200 border border-slate-600">
                        {p.payment_method || 'BANK_TRANSFER'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          p.payment_status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : p.payment_status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleString('vi-VN') : 'N/A'}
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
              onClick={() => fetchPayments(meta.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchPayments(meta.page + 1)}
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
