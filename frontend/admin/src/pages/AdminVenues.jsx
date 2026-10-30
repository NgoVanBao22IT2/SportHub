import { useState, useEffect } from 'react';
import { Search, Filter, Building2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { getAdminVenues, updateAdminVenueStatus } from '../api/admin';
import Pagination from '../components/ui/Pagination';

export default function AdminVenues() {
  const [venues, setVenues] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVenues = async (page = 1, status = statusFilter, search = searchQuery) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (search && search.trim()) params.search = search.trim();
      const res = await getAdminVenues(params);
      setVenues(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch venues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVenues(1, statusFilter, searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, statusFilter]);


  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const handleUpdateStatus = async (venueId, newStatus) => {
    try {
      setActionLoading(true);
      await updateAdminVenueStatus(venueId, newStatus);
      setNoticeModal({ open: true, title: 'Thành công', message: 'Đã cập nhật trạng thái cụm sân thành công.', type: 'success' });
      fetchVenues(meta.page, statusFilter, searchQuery);
      setSelectedVenue(null);
    } catch (err) {
      console.error('Failed to update venue status:', err);
      setNoticeModal({ open: true, title: 'Lỗi', message: err.response?.data?.message || 'Không thể cập nhật trạng thái cụm sân.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý & Duyệt Cụm Sân Thể Thao</h1>
          {/* <p className="text-xs text-slate-400 mt-1">Danh sách 2,792 Cụm sân trên toàn hệ thống ({meta.total} sân theo bộ lọc DB).</p> */}
        </div>
        <button
          onClick={() => fetchVenues(meta.page, statusFilter, searchQuery)}
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
            placeholder="Tìm tên sân, tên chủ sân, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="APPROVED">Đã duyệt </option>
            <option value="PENDING">Chờ duyệt </option>
            <option value="REJECTED">Từ chối </option>
            <option value="SUSPENDED">Tạm khóa </option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Tên Cụm Sân</th>
                <th className="py-3.5 px-4">Chủ Sân </th>
                <th className="py-3.5 px-4">SĐT </th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-2">Ngày Tạo</th>
                <th className="py-3.5 px-2">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách Cụm sân từ DB...
                  </td>
                </tr>
              ) : venues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy cụm sân phù hợp.
                  </td>
                </tr>
              ) : (
                venues.map((venue) => (
                  <tr key={venue.venue_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center text-xs">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-white max-w-xs truncate">{venue.venue_name}</p>
                          <p className="text-[10px] font-mono text-slate-500">ID: {venue.venue_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-200 font-medium">{venue.owner?.full_name || 'N/A'}</p>
                      <p className="text-[11px] text-slate-400">{venue.owner?.email || 'N/A'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{venue.contact_phone || 'Chưa có'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          venue.operating_status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : venue.operating_status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : venue.operating_status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}
                      >
                        {venue.operating_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {(venue.created_at || venue.createdAt) ? new Date(venue.created_at || venue.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 ">
                      <button
                        onClick={() => setSelectedVenue(venue)}
                        className="px-2 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold border border-indigo-500/40 transition-colors"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* UNIFIED PAGINATION */}
        <Pagination
          currentPage={meta.page}
          totalPages={Math.ceil(meta.total / meta.limit) || 1}
          totalItems={meta.total}
          itemLabel="cụm sân"
          onPageChange={(p) => fetchVenues(p, statusFilter, searchQuery)}
          className="p-4 border-t border-slate-700/80 bg-slate-900/40 rounded-none border-x-0 border-b-0"
        />
      </div>

      {/* VENUE ACTION MODAL */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedVenue.venue_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mã ID: {selectedVenue.venue_id}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {selectedVenue.operating_status}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <p><span className="text-slate-500 font-semibold">Chủ sở hữu:</span> <strong className="text-white">{selectedVenue.owner?.full_name}</strong> </p>
              <p><span className="text-slate-500 font-semibold">Email:</span> <strong className="text-slate-200">{selectedVenue.owner?.email}</strong></p>
              <p><span className="text-slate-500 font-semibold">SĐT:</span> <strong className="text-slate-200">{selectedVenue.contact_phone || 'N/A'}</strong></p>
              <p><span className="text-slate-500 font-semibold">Mô tả:</span> <span className="text-slate-300 italic">{selectedVenue.venue_description || 'Chưa cập nhật mô tả.'}</span></p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-300">Cập nhật trạng thái </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedVenue.venue_id, 'APPROVED')}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  Phê duyệt 
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedVenue.venue_id, 'REJECTED')}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                >
                  Từ chối 
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedVenue.venue_id, 'SUSPENDED')}
                  className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
                >Tạm khóa 
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedVenue.venue_id, 'PENDING')}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Đặt lại 
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVenue(null)}
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
