import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  Filter,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { getOwnerRevenue, getOwnerVenues } from '../../api/owner';
import * as XLSX from 'xlsx';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function OwnerRevenue() {
  const [revenueData, setRevenueData] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [periodPreset, setPeriodPreset] = useState('30_DAYS');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedVenueId, setSelectedVenueId] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch Owner Venues list
  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await getOwnerVenues();
        const vList = res?.data || res || [];
        setVenues(vList);
      } catch (err) {
        console.error('Error loading venues for revenue filter:', err);
      }
    }
    loadVenues();
  }, []);

  // Preset Date range handler
  const handlePresetChange = (preset) => {
    setPeriodPreset(preset);
    const now = new Date();
    const toStr = now.toISOString().split('T')[0];
    setToDate(toStr);

    if (preset === 'TODAY') {
      setFromDate(toStr);
    } else if (preset === '7_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
    } else if (preset === '30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().split('T')[0]);
    } else if (preset === 'THIS_MONTH') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(d.toISOString().split('T')[0]);
    }
  };

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerRevenue({
        from: fromDate,
        to: toDate,
        venueId: selectedVenueId === 'ALL' ? undefined : selectedVenueId,
        paymentMethod: paymentMethodFilter === 'ALL' ? undefined : paymentMethodFilter,
        page,
        limit: 10,
        search: activeSearch
      });

      if (res && res.data) {
        setRevenueData(res.data);
      } else {
        setRevenueData(res);
      }
    } catch (err) {
      console.error('Error fetching owner revenue:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải báo cáo doanh thu.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedVenueId, paymentMethodFilter, page, activeSearch]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchQuery);
  };

  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'info' });

  // Excel (.xlsx) Export Handler
  const handleExportExcel = () => {
    if (!revenueData || !revenueData.transactions || revenueData.transactions.length === 0) {
      setNoticeModal({ open: true, title: 'Thông báo xuất báo cáo', message: 'Không có dữ liệu giao dịch để xuất báo cáo.', type: 'info' });
      return;
    }

    const summaryData = revenueData?.summary || { grossRevenue: 0, netRevenue: 0, totalTransactions: 0, averageTransactionValue: 0 };

    // Sheet 1: Danh sách giao dịch chi tiết
    const transactionRows = revenueData.transactions.map((t, index) => ({
      'STT': index + 1,
      'Mã Giao Dịch': t.payment_id,
      'Mã Đơn Đặt Sân': t.booking_id,
      'Khách Hàng': t.booking?.customer?.full_name || 'Khách đặt sân',
      'Số Điện Thoại': t.booking?.customer?.phone_number || 'N/A',
      'Cụm Sân Thể Thao': t.booking?.court?.branch?.venue?.venue_name || 'Câu lạc bộ',
      'Sân Con': t.booking?.court?.court_name || 'Sân tiêu chuẩn',
      'Phương Thức': t.payment_method === 'SEPAY_QR' ? 'Chuyển khoản SePay' : t.payment_method === 'CASH' ? 'Tiền mặt' : (t.payment_method || 'Chuyển khoản'),
      'Số Tiền (VNĐ)': Number(t.amount) || 0,
      'Thời Gian Thanh Toán': t.paid_at ? new Date(t.paid_at).toLocaleString('vi-VN') : ''
    }));

    // Sheet 2: Tổng hợp Chỉ tiêu Doanh thu
    const summaryRows = [
      { 'Chỉ Tiêu Tài Chính': 'Kỳ báo cáo', 'Giá Trị': `Từ ${fromDate} đến ${toDate}` },
      { 'Chỉ Tiêu Tài Chính': 'Tổng doanh thu thực nhận', 'Giá Trị': `${(Number(summaryData.grossRevenue) || 0).toLocaleString('vi-VN')} VNĐ` },
      { 'Chỉ Tiêu Tài Chính': 'Doanh thu Net (sau khấu trừ hoàn tiền)', 'Giá Trị': `${(Number(summaryData.netRevenue) || 0).toLocaleString('vi-VN')} VNĐ` },
      { 'Chỉ Tiêu Tài Chính': 'Tổng số giao dịch thành công', 'Giá Trị': `${summaryData.totalTransactions} giao dịch` },
      { 'Chỉ Tiêu Tài Chính': 'Giá trị trung bình / đơn', 'Giá Trị': `${(Number(summaryData.averageTransactionValue) || 0).toLocaleString('vi-VN')} VNĐ` }
    ];

    const wb = XLSX.utils.book_new();

    const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    // Set readable column widths
    wsTransactions['!cols'] = [
      { wch: 6 },
      { wch: 38 },
      { wch: 38 },
      { wch: 22 },
      { wch: 15 },
      { wch: 26 },
      { wch: 20 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 }
    ];

    wsSummary['!cols'] = [
      { wch: 38 },
      { wch: 35 }
    ];

    XLSX.utils.book_append_sheet(wb, wsTransactions, 'Chi Tiết Giao Dịch');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan Doanh Thu');

    XLSX.writeFile(wb, `sporthub-bao-cao-doanh-thu-${fromDate}-den-${toDate}.xlsx`);
  };

  const summary = revenueData?.summary || { grossRevenue: 0, netRevenue: 0, totalTransactions: 0, averageTransactionValue: 0 };
  const comparison = revenueData?.comparison || { previousPeriodRevenue: 0, revenueChangePercent: 0 };
  const chart = revenueData?.chart || { labels: [], values: [] };
  const byVenue = revenueData?.byVenue || [];
  const byCourt = revenueData?.byCourt || [];
  const byMethod = revenueData?.byPaymentMethod || [];
  const transactions = revenueData?.transactions || [];
  const meta = revenueData?.meta || { page: 1, limit: 10, totalPages: 1 };

  const maxChartValue = Math.max(...chart.values, 100000);

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-brand-orange" size={24} />
            Doanh thu & Báo cáo tài chính
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi dòng tiền thực nhận từ các giao dịch thanh toán thành công theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={fetchRevenue}
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileSpreadsheet size={16} />}
            onClick={handleExportExcel}
          >
            Xuất báo cáo Excel
          </Button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-surface p-4 rounded-2xl border border-border-subtle-medium space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: 'TODAY', label: 'Hôm nay' },
              { key: '7_DAYS', label: '7 ngày qua' },
              { key: '30_DAYS', label: '30 ngày qua' },
              { key: 'THIS_MONTH', label: 'Tháng này' },
              { key: 'CUSTOM', label: 'Tùy chỉnh' }
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetChange(p.key)}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                  periodPreset === p.key
                    ? 'bg-brand-orange text-white shadow-xs'
                    : 'bg-surface-subtle border border-border-subtle text-gray-700 hover:border-brand-orange'
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPeriodPreset('CUSTOM');
                setFromDate(e.target.value);
              }}
              className="p-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-bold focus:border-brand-orange focus:outline-none"
            />
            <span className="text-text-muted">đến</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setPeriodPreset('CUSTOM');
                setToDate(e.target.value);
              }}
              className="p-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 font-bold focus:border-brand-orange focus:outline-none"
            />
          </div>

        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border-subtle">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="w-full p-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
            >
              <option value="ALL">Tất cả câu lạc bộ</option>
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
            >
              <option value="ALL">Tất cả phương thức thanh toán</option>
              <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
              <option value="MOMO">Ví MoMo</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Tổng doanh thu thực nhận</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-extrabold text-brand-orange">
              {summary.grossRevenue ? `${summary.grossRevenue.toLocaleString('vi-VN')}đ` : '0đ'}
            </p>
            {comparison.revenueChangePercent !== 0 && (
              <span className={`inline-flex items-center text-xs font-bold ${comparison.revenueChangePercent > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {comparison.revenueChangePercent > 0 ? <TrendingUp size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
                {comparison.revenueChangePercent > 0 ? `+${comparison.revenueChangePercent}%` : `${comparison.revenueChangePercent}%`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-1">Kỳ trước: {comparison.previousPeriodRevenue ? `${comparison.previousPeriodRevenue.toLocaleString('vi-VN')}đ` : '0đ'}</p>
        </Card>

        {/* KPI 2 */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Doanh thu Net</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {summary.netRevenue ? `${summary.netRevenue.toLocaleString('vi-VN')}đ` : '0đ'}
          </p>
          <p className="text-[11px] text-text-muted mt-1">Đã khấu trừ hoàn tiền nếu có</p>
        </Card>

        {/* KPI 3 */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Số giao dịch thành công</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.totalTransactions}</p>
          <p className="text-[11px] text-text-muted mt-1">Giao dịch đã xác nhận thành công</p>
        </Card>

        {/* KPI 4 */}
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Giá trị trung bình / Đơn</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {summary.averageTransactionValue ? `${summary.averageTransactionValue.toLocaleString('vi-VN')}đ` : '0đ'}
          </p>
          <p className="text-[11px] text-text-muted mt-1">Doanh thu / Tổng số giao dịch</p>
        </Card>

      </div>

      {/* REVENUE VISUAL CHART */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-orange" />
            Biểu đồ xu hướng doanh thu ({fromDate} đến {toDate})
          </h2>
        </div>

        {loading ? (
          <Skeleton width="100%" height="200px" radius="xl" />
        ) : chart.values && chart.values.length > 0 ? (
          <div className="space-y-2">
            <div className="h-48 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-border-subtle">
              {chart.values.map((val, idx) => {
                const heightPercent = maxChartValue > 0 ? Math.max(5, Math.round((val / maxChartValue) * 100)) : 5;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-dark text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-20 pointer-events-none">
                      {val.toLocaleString('vi-VN')}đ
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-brand-orange/80 group-hover:bg-brand-orange rounded-t-sm transition-all duration-300"
                    />
                  </div>
                );
              })}
            </div>
            {/* Chart X Labels */}
            <div className="flex gap-1 sm:gap-2 text-[10px] text-text-muted justify-between overflow-x-auto no-scrollbar">
              {chart.labels.map((lbl, idx) => (
                <span key={idx} className="flex-1 text-center truncate">{lbl}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-text-muted text-xs">
            Chưa có phát sinh doanh thu trong khoảng thời gian này.
          </div>
        )}
      </Card>

      {/* BREAKDOWN ANALYTICS (BY VENUE & BY COURT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* VENUE BREAKDOWN */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-border-subtle pb-3">
            <Building2 size={16} className="text-brand-orange" />
            Doanh thu theo Câu lạc bộ
          </h2>

          {byVenue.length > 0 ? (
            <div className="space-y-3 text-xs">
              {byVenue.map((v) => (
                <div key={v.venue_id} className="space-y-1">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{v.venue_name}</span>
                    <span className="text-brand-orange">{parseFloat(v.revenue).toLocaleString('vi-VN')}đ ({v.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-surface-subtle rounded-full overflow-hidden border">
                    <div style={{ width: `${v.percentage}%` }} className="h-full bg-brand-orange rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted py-4 text-center">Chưa có dữ liệu phân bổ theo câu lạc bộ.</p>
          )}
        </Card>

        {/* COURT BREAKDOWN */}
        <Card padding="lg" radius="2xl" className="border border-border-subtle-medium bg-surface space-y-4">
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-border-subtle pb-3">
            <DollarSign size={16} className="text-brand-orange" />
            Top Sân con có doanh thu cao nhất
          </h2>

          {byCourt.length > 0 ? (
            <div className="space-y-2 text-xs">
              {byCourt.slice(0, 5).map((c) => (
                <div key={c.court_id} className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{c.court_name}</p>
                    <p className="text-[11px] text-text-muted">{c.venue_name} • {c.transaction_count} lượt đặt</p>
                  </div>
                  <span className="font-extrabold text-brand-orange">{parseFloat(c.revenue).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted py-4 text-center">Chưa có dữ liệu phân bổ theo sân con.</p>
          )}
        </Card>

      </div>

      {/* TRANSACTIONS TABLE SECTION */}
      <Card padding="none" radius="2xl" className="border border-border-subtle-medium overflow-hidden shadow-xs space-y-4">
        
        {/* Table Search Header */}
        <div className="p-4 bg-surface-subtle border-b border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-gray-900 text-sm">Danh sách Giao dịch tạo doanh thu ({meta.total || 0})</h3>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="Tìm Mã GD, Mã Booking, Tên khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              size="sm"
            />
            <Button type="submit" variant="primary" size="sm">Tìm</Button>
          </form>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height="20px" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border-subtle text-text-muted font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mã Payment</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Sân con</th>
                    <th className="py-3 px-4">Phương thức</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4 text-right">Thời gian thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-surface">
                  {transactions.map((t) => (
                    <tr key={t.payment_id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        #{t.payment_id?.substring(0, 8)}
                        <p className="text-[10px] text-text-muted font-normal">Booking: #{t.booking_id?.substring(0, 8)}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {t.booking?.customer?.full_name || 'Khách đặt sân'} ({t.booking?.customer?.phone_number || ''})
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {t.booking?.court?.court_name || 'Sân con'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="info" size="xs">{t.payment_method}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-brand-orange">
                        {t.amount ? `${parseFloat(t.amount).toLocaleString('vi-VN')}đ` : '0đ'}
                      </td>
                      <td className="py-3 px-4 text-right text-text-muted">
                        {t.paid_at ? new Date(t.paid_at).toLocaleString('vi-VN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border-subtle bg-surface-subtle text-xs">
                <span className="text-text-muted">Trang {meta.page} / {meta.totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted text-xs">
            Chưa có giao dịch phát sinh doanh thu trong danh sách này.
          </div>
        )}
      </Card>

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
