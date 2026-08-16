import { useState, useEffect } from 'react';
import { Search, UserCheck, RefreshCw, Edit3, Building2 } from 'lucide-react';
import { getAdminUsers, updateAdminUser } from '../../api/admin';

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOwners = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ page, limit: 10, role: 'OWNER' });
      setOwners(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners(1);
  }, []);

  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      await updateAdminUser(userId, { account_status: nextStatus });
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã cập nhật trạng thái chủ sân.', type: 'success' });
      fetchOwners(meta.page);
    } catch (err) {
      console.error('Failed to update owner status:', err);
      setNoticeModal({ open: true, title: 'Lỗi', message: err.response?.data?.message || 'Không thể cập nhật trạng thái chủ sân.', type: 'error' });
    }
  };

  const filteredOwners = owners.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.full_name && o.full_name.toLowerCase().includes(q)) ||
      (o.email && o.email.toLowerCase().includes(q)) ||
      (o.phone_number && o.phone_number.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Tài Khoản Chủ Sân (Owners)</h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách đối tác quản lý cụm sân thể thao ({meta.total} tài khoản Owner trong DB).</p>
        </div>
        <button
          onClick={() => fetchOwners(meta.page)}
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
            placeholder="Tìm theo tên chủ sân, email, sđt..."
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
                <th className="py-3.5 px-4">Tên Chủ Sân</th>
                <th className="py-3.5 px-4">Email Liên Hệ</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Trạng Thái Account</th>
                <th className="py-3.5 px-4">Ngày Đăng Ký</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách Chủ sân từ DB...
                  </td>
                </tr>
              ) : filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy tài khoản Chủ sân phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner.user_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-xs">
                          {owner.full_name ? owner.full_name.charAt(0).toUpperCase() : 'O'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{owner.full_name || 'Chủ sân'}</p>
                          <p className="text-[10px] font-mono text-slate-500">ID: {owner.user_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{owner.email}</td>
                    <td className="py-3.5 px-4 text-slate-300">{owner.phone_number || 'Chưa cập nhật'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          owner.account_status === 'SUSPENDED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {owner.account_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {owner.created_at ? new Date(owner.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(owner.user_id, owner.account_status)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                          owner.account_status === 'SUSPENDED'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {owner.account_status === 'SUSPENDED' ? 'Mở khóa' : 'Khóa tài khoản'}
                      </button>
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
              onClick={() => fetchOwners(meta.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchOwners(meta.page + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <h3 className="text-base font-bold text-white">{noticeModal.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{noticeModal.message}</p>
            <div className="pt-2">
              <button
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
