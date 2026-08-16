import { useState, useEffect } from 'react';
import { Search, Filter, Shield, ShieldAlert, CheckCircle, XCircle, RefreshCw, Edit3 } from 'lucide-react';
import { getAdminUsers, updateAdminUser } from '../../api/admin';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (roleFilter) params.role = roleFilter;
      const res = await getAdminUsers(params);
      setUsers(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter]);

  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      setActionLoading(true);
      await updateAdminUser(userId, { account_status: newStatus });
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã cập nhật trạng thái người dùng.', type: 'success' });
      fetchUsers(meta.page);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user status:', err);
      setNoticeModal({ open: true, title: 'Lỗi', message: err.response?.data?.message || 'Không thể cập nhật trạng thái người dùng.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await updateAdminUser(userId, { primary_role: newRole });
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã cập nhật vai trò người dùng thành công.', type: 'success' });
      fetchUsers(meta.page);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setNoticeModal({ open: true, title: 'Lỗi', message: err.response?.data?.message || 'Không thể cập nhật vai trò người dùng.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone_number && u.phone_number.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Tài Khoản Người Dùng</h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách tài khoản hệ thống SportHubAI ({meta.total} tài khoản trong DB).</p>
        </div>
        <button
          onClick={() => fetchUsers(meta.page)}
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
            placeholder="Tìm theo tên, email, sđt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả Vai trò (Role)</option>
            <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
            <option value="OWNER">Chủ sân (OWNER)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Email / SĐT</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách tài khoản từ DB...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.full_name || 'Chưa đặt tên'}</p>
                          <p className="text-[10px] font-mono text-slate-500">ID: {user.user_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-200 font-medium">{user.email}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{user.phone_number || 'Chưa có SĐT'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          user.primary_role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : user.primary_role === 'OWNER'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {user.primary_role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          user.account_status === 'SUSPENDED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {user.account_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold transition-colors"
                      >
                        <Edit3 size={12} /> Sửa
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
              onClick={() => fetchUsers(meta.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchUsers(meta.page + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Chỉnh Sửa Tài Khoản: {editingUser.full_name}</h3>
            <p className="text-xs text-slate-400">Email: {editingUser.email}</p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cập nhật Trạng thái Tài khoản</label>
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(editingUser.user_id, 'ACTIVE')}
                    className="flex-1 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold text-xs border border-emerald-500/40"
                  >
                    Kích hoạt (ACTIVE)
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(editingUser.user_id, 'SUSPENDED')}
                    className="flex-1 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-bold text-xs border border-rose-500/40"
                  >
                    Tạm khóa (SUSPENDED)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cập nhật Vai trò (Role)</label>
                <div className="grid grid-cols-3 gap-2">
                  {['CUSTOMER', 'OWNER', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      disabled={actionLoading}
                      onClick={() => handleUpdateRole(editingUser.user_id, r)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        editingUser.primary_role === r
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
