import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Trophy, Users, Building2, ClipboardList, TrendingUp } from 'lucide-react';
import { getAdminReports } from '../../api/admin';

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getAdminReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch admin reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const courtsBySport = reports?.courts_by_sport || [];
  const usersByRole = reports?.users_by_role || [];
  const venuesByStatus = reports?.venues_by_status || [];
  const bookingsByStatus = reports?.bookings_by_status || [];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Báo Cáo Phân Tích Dữ Liệu Hệ Thống</h1>
          <p className="text-xs text-slate-400 mt-1">Tổng hợp phân bổ người dùng, cụm sân, đơn đặt và môn thể thao từ MySQL DB.</p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* CHARTS & DISTRIBUTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COURTS BY SPORT */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700/80 mb-4">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="font-bold text-white text-sm">Phân Bổ Sân Con Theo Bộ Môn Thể Thao</h3>
          </div>
          <div className="space-y-3">
            {courtsBySport.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.sport_category || 'Khác'}</span>
                  <span className="text-amber-400 font-bold font-mono">{parseInt(item.count).toLocaleString('vi-VN')} sân</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseInt(item.count) / 10000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* USERS BY ROLE */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700/80 mb-4">
            <Users size={18} className="text-blue-400" />
            <h3 className="font-bold text-white text-sm">Phân Bổ Người Dùng Theo Vai Trò (Role)</h3>
          </div>
          <div className="space-y-3">
            {usersByRole.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.primary_role}</span>
                  <span className="text-blue-400 font-bold font-mono">{parseInt(item.count).toLocaleString('vi-VN')} người</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseInt(item.count) / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VENUES BY OPERATING STATUS */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700/80 mb-4">
            <Building2 size={18} className="text-purple-400" />
            <h3 className="font-bold text-white text-sm">Trạng Thái Phê Duyệt Cụm Sân</h3>
          </div>
          <div className="space-y-3">
            {venuesByStatus.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.operating_status}</span>
                  <span className="text-purple-400 font-bold font-mono">{parseInt(item.count).toLocaleString('vi-VN')} sân</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseInt(item.count) / 2800) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOOKINGS BY STATUS */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700/80 mb-4">
            <ClipboardList size={18} className="text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Trạng Thái Đơn Đặt Sân Toàn Hệ Thống</h3>
          </div>
          <div className="space-y-3">
            {bookingsByStatus.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{item.booking_status}</span>
                  <span className="text-emerald-400 font-bold font-mono">{parseInt(item.count).toLocaleString('vi-VN')} đơn</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseInt(item.count) / 230000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
