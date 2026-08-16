import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Building2,
  Clock,
  ClipboardList,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { getAdminDashboard, getAdminVenues, updateAdminVenueStatus, getAdminBookings, getAdminOwnerRegistrations, approveAdminOwnerRegistration } from '../../api/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingVenues, setPendingVenues] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [dashStats, venuesRes, bookingsRes, regsRes] = await Promise.all([
        getAdminDashboard(),
        getAdminVenues({ status: 'PENDING', limit: 5 }),
        getAdminBookings({ limit: 5 }),
        getAdminOwnerRegistrations({ status: 'PENDING', limit: 5 }).catch(() => ({ data: [] }))
      ]);

      setStats(dashStats);
      setPendingVenues(venuesRes.data || []);
      setRecentBookings(bookingsRes.data || []);
      setPendingRegistrations(regsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'error' });

  const handleApproveVenue = async (venueId) => {
    try {
      setActionLoadingId(venueId);
      await updateAdminVenueStatus(venueId, 'APPROVED');
      setNoticeModal({ open: true, title: 'Phê duyệt thành công', message: 'Cụm sân đã được phê duyệt hoạt động trên hệ thống.', type: 'success' });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to approve venue:', err);
      setNoticeModal({ open: true, title: 'Thao tác thất bại', message: err.response?.data?.message || 'Không thể phê duyệt cụm sân. Vui lòng thử lại.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-32 bg-slate-800/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700 max-w-lg mx-auto my-12">
        <AlertTriangle size={40} className="text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Không thể nạp dữ liệu Dashboard</h3>
        <p className="text-xs text-slate-400 mb-6">Đã xảy ra lỗi kết nối với máy chủ API quản trị.</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Tổng Người dùng',
      value: stats?.total_users || 0,
      sub: `${stats?.total_owners || 0} Chủ sân`,
      icon: Users,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'Tổng Chủ sân (Owner)',
      value: stats?.total_owners || 0,
      sub: 'Tài khoản Quản lý sân',
      icon: UserCheck,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'Tổng Cụm sân',
      value: stats?.total_venues || 0,
      sub: `${stats?.pending_venues || 0} sân chờ duyệt`,
      icon: Building2,
      color: 'from-purple-600 to-pink-600'
    },
    {
      title: 'Sân Chờ Phê Duyệt',
      value: stats?.pending_venues || 0,
      sub: 'Yêu cầu kích hoạt mới',
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
      badge: stats?.pending_venues > 0 ? 'Cần xử lý' : null
    },
    {
      title: 'Tổng Đơn Đặt Sân',
      value: (stats?.total_bookings || 0).toLocaleString('vi-VN'),
      sub: 'Lịch đặt toàn hệ thống',
      icon: ClipboardList,
      color: 'from-cyan-600 to-blue-600'
    },
    {
      title: 'Tổng Doanh Thu Đã Thu',
      value: `${((stats?.total_revenue || 0)).toLocaleString('vi-VN')} đ`,
      sub: 'Giao dịch PAID thành công',
      icon: DollarSign,
      color: 'from-green-600 to-emerald-600'
    },
    {
      title: 'Giao Dịch Thanh Toán',
      value: (stats?.total_transactions || 0).toLocaleString('vi-VN'),
      sub: 'Tổng số lần giao dịch',
      icon: CreditCard,
      color: 'from-violet-600 to-purple-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Thống kê chỉ số tổng quan hệ thống SportHubAI thời gian thực.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
        >
          <RefreshCw size={14} /> Cập nhật dữ liệu
        </button>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">{card.title}</p>
                  <h3 className="text-2xl font-extrabold text-white mt-2 tracking-tight">{card.value}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">{card.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon size={22} />
                </div>
              </div>

              {card.badge && (
                <div className="mt-3">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⚠️ {card.badge}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TWO COLUMN GRID FOR PENDING VENUES & RECENT BOOKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENDING APPROVAL VENUES */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-bold text-white text-sm">Yêu Cầu Duyệt Sân Mới</h3>
            </div>
            <Link to="/admin/venues" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          {pendingVenues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle size={36} className="text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-slate-300">Không có sân chờ duyệt</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tất cả cụm sân mới đăng ký đã được phê duyệt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVenues.map((venue) => (
                <div
                  key={venue.venue_id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-white truncate">{venue.venue_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Chủ sân: <span className="text-slate-300 font-semibold">{venue.owner?.full_name || 'N/A'}</span> ({venue.owner?.email})
                    </p>
                  </div>
                  <button
                    disabled={actionLoadingId === venue.venue_id}
                    onClick={() => handleApproveVenue(venue.venue_id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    {actionLoadingId === venue.venue_id ? 'Đang duyệt...' : 'Phê duyệt'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT BOOKINGS */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-4">
            <h3 className="font-bold text-white text-sm">Đơn Đặt Sân Mới Nhất</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ClipboardList size={36} className="text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-300">Chưa có đơn đặt sân</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b.booking_id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] text-indigo-400">#{b.booking_id.substring(0, 8)}</span>
                      <span className="text-xs text-slate-200 font-semibold truncate">{b.customer?.full_name || 'Khách hàng'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {b.booking_date} | {b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-xs text-emerald-400">{parseInt(b.total_amount || 0).toLocaleString('vi-VN')} đ</p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 mt-0.5">
                      {b.booking_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENDING OWNER REGISTRATIONS */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-md flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <h3 className="font-bold text-white text-sm">Hồ Sơ Đăng Ký Kinh Doanh Chủ Sân Mới (Chờ Duyệt)</h3>
            </div>
            <Link to="/admin/owner-registrations" className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1">
              Quản lý hồ sơ <ArrowRight size={14} />
            </Link>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle size={32} className="text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-slate-300">Không có hồ sơ đăng ký chủ sân chờ duyệt</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tất cả yêu cầu đăng ký kinh doanh từ người dùng đã được xử lý.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingRegistrations.map((reg) => (
                <div
                  key={reg.registration_id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-white truncate">{reg.business_name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {reg.business_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Người nộp: <strong className="text-slate-200">{reg.representative_name}</strong> ({reg.email})
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Địa chỉ: {reg.street_address}, {reg.district}, {reg.city_province}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                    <span className="text-[10px] text-slate-500">
                      Nộp ngày: {new Date(reg.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <Link
                      to="/admin/owner-registrations"
                      className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition-colors"
                    >
                      Xét duyệt ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
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
