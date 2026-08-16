import { useState, useEffect } from 'react';
import { Trophy, Filter, Search, RefreshCw } from 'lucide-react';
import { getAdminCourts } from '../../api/admin';

export default function AdminCourts() {
  const [courts, setCourts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourts = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (sportFilter) params.sport_category = sportFilter;
      const res = await getAdminCourts(params);
      setCourts(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts(1);
  }, [sportFilter]);

  const filteredCourts = courts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.court_name && c.court_name.toLowerCase().includes(q)) ||
      (c.branch?.venue?.venue_name && c.branch.venue.venue_name.toLowerCase().includes(q)) ||
      (c.sport_category && c.sport_category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Danh Mục Sân Con (Courts)</h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách 13,960 sân con thể thao trên toàn quốc ({meta.total} sân con theo bộ lọc DB).</p>
        </div>
        <button
          onClick={() => fetchCourts(meta.page)}
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
            placeholder="Tìm tên sân con, tên cụm sân..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả Bộ Môn Thể Thao</option>
            <option value="Pickleball">Pickleball</option>
            <option value="Cầu lông">Cầu lông</option>
            <option value="Bóng đá">Bóng đá</option>
            <option value="Tennis">Tennis</option>
            <option value="Bóng rổ">Bóng rổ</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Tên Sân Con</th>
                <th className="py-3.5 px-4">Cụm Sân Sở Hữu</th>
                <th className="py-3.5 px-4">Bộ Môn Thể Thao</th>
                <th className="py-3.5 px-4">Trạng Thái Sân</th>
                <th className="py-3.5 px-4">Ngày Khởi Tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách Sân con từ DB...
                  </td>
                </tr>
              ) : filteredCourts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Không tìm thấy sân con phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCourts.map((court) => (
                  <tr key={court.court_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center text-xs">
                          <Trophy size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{court.court_name}</p>
                          <p className="text-[10px] font-mono text-slate-500">ID: {court.court_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {court.branch?.venue?.venue_name || court.branch?.branch_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {court.sport_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {court.court_status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {court.created_at ? new Date(court.created_at).toLocaleDateString('vi-VN') : 'N/A'}
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
              onClick={() => fetchCourts(meta.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40"
            >
              Trang trước
            </button>
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchCourts(meta.page + 1)}
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
