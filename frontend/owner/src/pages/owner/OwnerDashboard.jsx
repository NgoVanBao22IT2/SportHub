import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  CreditCard,
  Star,
  Bell,
  RefreshCw,
  Building2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileImage,
  ArrowRight,
  ClipboardList,
  CalendarDays,
  ShieldCheck,
  User
} from 'lucide-react';
import { getOwnerDashboard, getOwnerVenues } from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVenueId, setSelectedVenueId] = useState('ALL');
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');

  // Fetch Venues list for filter
  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await getOwnerVenues();
        const vList = res?.data || res || [];
        setVenues(vList);
      } catch (err) {
        console.error('Error loading venues for dashboard filter:', err);
      }
    }
    loadVenues();
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerDashboard({
        venueId: selectedVenueId === 'ALL' ? undefined : selectedVenueId
      });

      if (res && res.data) {
        setDashboardData(res.data);
      } else {
        setDashboardData(res);
      }
      setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error('Error fetching owner dashboard:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải dữ liệu Dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedVenueId]);

  // Initial fetch and 45s polling interval
  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 45000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const summary = dashboardData?.summary || {
    todayRevenue: 0,
    todayRevenueChangePercent: 0,
    todayBookings: 0,
    confirmedBookingsToday: 0,
    pendingBookingsCount: 0,
    pendingPaymentsCount: 0,
    averageRating: 0,
    totalReviews: 0,
    unreadNotificationsCount: 0,
    totalVenues: 0,
    totalCourts: 0
  };

  const revenueTrend = dashboardData?.revenueTrend || { labels: [], values: [] };
  const upcomingBookings = dashboardData?.upcomingBookings || [];
  const pendingPayments = dashboardData?.pendingPayments || [];
  const recentReviews = dashboardData?.recentReviews || [];

  const maxChartValue = Math.max(...(revenueTrend.values || []), 100000);

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="text-brand-orange" size={24} />
            Dashboard Quản lý & Vận hành
          </h1>
          <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
            <span>Theo dõi hoạt động đặt sân, thanh toán và chất lượng dịch vụ theo thời gian thực.</span>
            {lastUpdatedTime && (
              <span className="bg-surface-subtle border border-border-subtle text-gray-600 px-2 py-0.5 rounded-md font-mono text-[10px]">
                Cập nhật: {lastUpdatedTime}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả câu lạc bộ</option>
            {venues.map((v) => (
              <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={fetchDashboard}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI METRICS SUMMARY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* KPI 1: TODAY REVENUE */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Doanh thu hôm nay</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-xl font-extrabold text-brand-orange">
              {summary.todayRevenue ? `${summary.todayRevenue.toLocaleString('vi-VN')}đ` : '0đ'}
            </p>
            {summary.todayRevenueChangePercent !== 0 && (
              <span className={`inline-flex items-center text-[11px] font-bold ${summary.todayRevenueChangePercent > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.todayRevenueChangePercent > 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                {summary.todayRevenueChangePercent > 0 ? `+${summary.todayRevenueChangePercent}%` : `${summary.todayRevenueChangePercent}%`}
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-muted mt-1 block">So với ngày hôm qua</span>
        </Card>

        {/* KPI 2: TODAY BOOKINGS */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Booking Hôm nay</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.todayBookings}</p>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">
            {summary.confirmedBookingsToday} ca đã xác nhận
          </span>
        </Card>

        {/* KPI 3: PENDING PAYMENTS */}
        <Card padding="md" radius="xl" className="border border-amber-200 bg-amber-50/50">
          <span className="text-amber-900 text-[11px] font-bold block uppercase">Thanh toán chờ xử lý</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{summary.pendingPaymentsCount}</p>
          <Link to="/owner/payments" className="text-[10px] text-amber-800 font-bold hover:underline block mt-1">
            Cần Owner xác nhận ngay →
          </Link>
        </Card>

        {/* KPI 4: AVERAGE RATING */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Rating trung bình</span>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-2xl font-extrabold text-gray-900">{summary.averageRating}</p>
            <span className="text-amber-500 font-bold text-sm">/ 5 ★</span>
          </div>
          <span className="text-[10px] text-text-muted block mt-1">{summary.totalReviews} đánh giá khách hàng</span>
        </Card>

        {/* KPI 5: UNREAD NOTIFICATIONS */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface col-span-2 lg:col-span-1">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Thông báo chưa đọc</span>
          <p className="text-2xl font-extrabold text-brand-orange mt-1">{summary.unreadNotificationsCount}</p>
          <Link to="/owner/notifications" className="text-[10px] text-brand-orange font-bold hover:underline block mt-1">
            Xem hộp thư thông báo →
          </Link>
        </Card>

      </div>

      {/* REVENUE TREND VISUAL CHART */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-orange" />
            Xu hướng doanh thu thực nhận 7 ngày gần đây
          </h2>
          <Link to="/owner/revenue" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
            Chi tiết báo cáo tài chính <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <Skeleton width="100%" height="180px" radius="xl" />
        ) : revenueTrend.values && revenueTrend.values.length > 0 ? (
          <div className="space-y-2">
            <div className="h-40 flex items-end gap-2 pt-6 pb-2 border-b border-border-subtle">
              {revenueTrend.values.map((val, idx) => {
                const heightPercent = maxChartValue > 0 ? Math.max(8, Math.round((val / maxChartValue) * 100)) : 8;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-dark text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-20">
                      {val.toLocaleString('vi-VN')}đ
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-brand-orange/80 group-hover:bg-brand-orange rounded-t-sm transition-all duration-300"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex text-[10px] text-text-muted justify-between">
              {revenueTrend.labels.map((lbl, idx) => (
                <span key={idx} className="flex-1 text-center font-semibold">{lbl}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-text-muted text-xs">
            Chưa phát sinh giao dịch doanh thu trong 7 ngày vừa qua.
          </div>
        )}
      </Card>

      {/* TWO COLUMN OPERATIONAL DASHBOARD PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PANEL 1: PENDING PAYMENTS NEEDING ACTION */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard size={16} className="text-amber-500" />
              Giao dịch Thanh toán cần xử lý ({pendingPayments.length})
            </h2>
            <Link to="/owner/payments" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              Tất cả giao dịch <ChevronRight size={14} />
            </Link>
          </div>

          {pendingPayments.length > 0 ? (
            <div className="space-y-3 text-xs">
              {pendingPayments.map((p) => {
                const b = p.booking || {};
                const custName = b.customer?.full_name || 'Khách đặt sân';
                const courtName = b.court?.court_name || 'Sân con';

                return (
                  <div key={p.payment_id} className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-subtle hover:bg-surface-subtle/80 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 truncate">{custName}</span>
                        <Badge variant="warning" size="xs">{p.payment_method || 'BANK_TRANSFER'}</Badge>
                      </div>
                      <p className="text-text-muted text-[11px]">Sân: {courtName} • Mã GD: #{p.payment_id?.substring(0, 8)}</p>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-extrabold text-brand-orange text-sm">
                        {p.amount ? `${parseFloat(p.amount).toLocaleString('vi-VN')}đ` : '0đ'}
                      </span>
                      <Link to={`/owner/payments/${p.payment_id}`}>
                        <Button variant="primary" size="xs" rightIcon={<ChevronRight size={14} />}>
                          Duyệt
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-text-muted text-xs">
              Không có giao dịch thanh toán nào đang chờ xác nhận.
            </div>
          )}
        </Card>

        {/* PANEL 2: UPCOMING BOOKINGS */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              Ca Đặt sân sắp diễn ra
            </h2>
            <Link to="/owner/bookings" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              Quản lý ca đặt sân <ChevronRight size={14} />
            </Link>
          </div>

          {upcomingBookings.length > 0 ? (
            <div className="space-y-3 text-xs">
              {upcomingBookings.map((b) => {
                const custName = b.customer?.full_name || 'Khách đặt sân';
                const courtName = b.court?.court_name || 'Sân con';

                let bBadge = <Badge variant="info" size="xs">{b.booking_status}</Badge>;
                if (b.booking_status === 'CONFIRMED') bBadge = <Badge variant="success" size="xs">ĐÃ XÁC NHẬN</Badge>;
                if (b.booking_status === 'WAITING_OWNER_CONFIRMATION') bBadge = <Badge variant="warning" size="xs">CHỜ XÁC NHẬN</Badge>;

                return (
                  <div key={b.booking_id} className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-subtle hover:bg-surface-subtle/80 transition-colors">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 truncate">{custName}</span>
                        {bBadge}
                      </div>
                      <p className="text-text-muted text-[11px]">
                        Sân: {courtName} • Giờ: {b.booking_date} ({b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)})
                      </p>
                    </div>

                    <Link to={`/owner/bookings/${b.booking_id}`}>
                      <Button variant="outline" size="xs" rightIcon={<ChevronRight size={14} />}>
                        Chi tiết
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-text-muted text-xs">
              Chưa có lịch đặt sân mới sắp diễn ra.
            </div>
          )}
        </Card>

      </div>

      {/* PANEL 3: RECENT REVIEWS & QUICK SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* RECENT REVIEWS */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-500" />
              Đánh giá & Bình luận mới nhất từ Khách hàng
            </h2>
            <Link to="/owner/reviews" className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1">
              Tất cả đánh giá <ChevronRight size={14} />
            </Link>
          </div>

          {recentReviews.length > 0 ? (
            <div className="space-y-3 text-xs">
              {recentReviews.map((r) => {
                const custName = r.customer?.full_name || 'Khách đặt sân';
                const courtName = r.court?.court_name || 'Sân con';

                return (
                  <div key={r.review_id} className="p-3 rounded-xl bg-surface-subtle border border-border-subtle space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{custName} • {courtName}</span>
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 italic">"{r.comment || 'Không có nhận xét viết tay.'}"</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-text-muted text-xs">
              Chưa có bình luận đánh giá nào gần đây.
            </div>
          )}
        </Card>

        {/* QUICK NAVIGATION SHORTCUTS */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <h2 className="font-bold text-gray-900 text-sm border-b border-border-subtle pb-3">
            Phím tắt truy cập nhanh
          </h2>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <Link to="/owner/bookings" className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-brand-orange/10 hover:text-brand-orange transition-colors font-bold text-gray-900">
              <span className="flex items-center gap-2"><ClipboardList size={16} /> Quản lý Booking</span>
              <ChevronRight size={14} />
            </Link>

            <Link to="/owner/payments" className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-brand-orange/10 hover:text-brand-orange transition-colors font-bold text-gray-900">
              <span className="flex items-center gap-2"><CreditCard size={16} /> Quản lý Thanh toán</span>
              <ChevronRight size={14} />
            </Link>

            <Link to="/owner/schedules" className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-brand-orange/10 hover:text-brand-orange transition-colors font-bold text-gray-900">
              <span className="flex items-center gap-2"><CalendarDays size={16} /> Lịch sân & Giờ hoạt động</span>
              <ChevronRight size={14} />
            </Link>

            <Link to="/owner/venues" className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-brand-orange/10 hover:text-brand-orange transition-colors font-bold text-gray-900">
              <span className="flex items-center gap-2"><Building2 size={16} /> Quản lý Sân & Cơ sở</span>
              <ChevronRight size={14} />
            </Link>

            <Link to="/owner/revenue" className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-brand-orange/10 hover:text-brand-orange transition-colors font-bold text-gray-900">
              <span className="flex items-center gap-2"><DollarSign size={16} /> Báo cáo Doanh thu</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </Card>

      </div>

    </div>
  );
}
