import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileImage,
  User,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getOwnerBookings, approveBooking, rejectBooking } from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PaymentProofViewer from '../../components/domain/PaymentProofViewer';
import RejectionModal from '../../components/domain/RejectionModal';

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Modals state
  const [selectedProofBooking, setSelectedProofBooking] = useState(null);
  const [selectedRejectBooking, setSelectedRejectBooking] = useState(null);
  const [confirmApproveBooking, setConfirmApproveBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerBookings({
        page: meta.page,
        limit: meta.limit,
        status: statusFilter,
        search: activeSearch
      });

      if (res && res.data) {
        setBookings(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error fetching owner bookings:', err);
      setError(err.message || 'Không thể tải danh sách đơn đặt sân.');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, statusFilter, activeSearch]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Approve Booking
  const handleApproveSubmit = async (bookingId) => {
    try {
      setActionLoading(true);
      await approveBooking(bookingId);
      showToast('Đã phê duyệt đơn đặt sân thành công!');
      setConfirmApproveBooking(null);
      setSelectedProofBooking(null);
      fetchBookings();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi duyệt đơn'));
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject Booking
  const handleRejectSubmit = async (bookingId, reason) => {
    try {
      setActionLoading(true);
      await rejectBooking(bookingId, reason);
      showToast('Đã từ chối đơn đặt sân!');
      setSelectedRejectBooking(null);
      setSelectedProofBooking(null);
      fetchBookings();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi từ chối đơn'));
    } finally {
      setActionLoading(false);
    }
  };

  const filterTabs = [
    { key: 'ALL', label: 'Tất cả đơn' },
    { key: 'PENDING', label: 'Chờ xử lý' },
    { key: 'CONFIRMED', label: 'Đã xác nhận' },
    { key: 'REJECTED', label: 'Đã từ chối' },
    { key: 'CANCELLED', label: 'Đã hủy' }
  ];

  return (
    <div className="space-y-6">

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-brand-orange" size={24} />
            Quản lý đơn đặt sân
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi, kiểm tra minh chứng giao dịch và xử lý các đơn đặt sân từ khách hàng.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={fetchBookings}
        >
          Làm mới
        </Button>
      </div>

      {/* SEARCH & FILTER TABS */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={[
                'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                statusFilter === tab.key
                  ? 'bg-brand-orange text-white shadow-xs'
                  : 'bg-surface border border-border-subtle-medium text-gray-700 hover:border-brand-orange/50'
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo Mã đơn (#BK-XXXX), Tên khách hàng, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
              size="sm"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Tìm kiếm
          </Button>
        </form>
      </div>

      {/* BOOKINGS TABLE / CARD LIST */}
      <Card padding="none" radius="2xl" className="border border-border-subtle-medium overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton width="120px" height="20px" />
                <Skeleton width="180px" height="20px" />
                <Skeleton width="100px" height="20px" />
                <Skeleton width="80px" height="24px" radius="xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState title="Lỗi tải dữ liệu đơn đặt sân" description={error} onRetry={fetchBookings} />
          </div>
        ) : bookings.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border-subtle text-text-muted font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Mã Booking</th>
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4">Sân con / Cơ sở</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4 text-right">Tổng tiền</th>
                    <th className="py-3.5 px-4 text-center">Thanh toán</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-surface">
                  {bookings.map((b) => {
                    const custName = b.customer?.full_name || 'Khách đặt sân';
                    const custPhone = b.customer?.phone_number || '';
                    const courtName = b.court?.court_name || 'Sân con';
                    const venueName = b.court?.branch?.venue?.venue_name || 'Câu lạc bộ';
                    const rawPrice = b.total_amount || b.total_price;
                    const priceFormatted = rawPrice ? `${parseFloat(rawPrice).toLocaleString('vi-VN')}đ` : '0đ';
                    const status = b.booking_status;

                    let statusBadge = <Badge variant="info" size="xs">ĐANG GIỮ CHỖ</Badge>;
                    if (status === 'WAITING_OWNER_CONFIRMATION') {
                      statusBadge = <Badge variant="warning" size="xs">CHỜ CHỦ SÂN DUYỆT</Badge>;
                    } else if (status === 'CANCEL_REQUESTED') {
                      statusBadge = <Badge variant="warning" size="xs">YÊU CẦU HỦY & HOÀN TIỀN</Badge>;
                    } else if (status === 'CONFIRMED' || status === 'COMPLETED') {
                      statusBadge = <Badge variant="success" size="xs">ĐÃ DUYỆT</Badge>;
                    } else if (status === 'REJECTED') {
                      statusBadge = <Badge variant="danger" size="xs">TỪ CHỐI</Badge>;
                    } else if (status === 'CANCELLED') {
                      statusBadge = <Badge variant="danger" size="xs">ĐÃ HỦY</Badge>;
                    }

                    return (
                      <tr key={b.booking_id} className="hover:bg-surface-subtle transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          #{b.booking_id?.substring(0, 8)}
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          <p className="font-bold text-gray-900 truncate max-w-[140px]">{custName}</p>
                          <p className="text-[11px] text-text-muted">{custPhone}</p>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          <p className="font-bold text-gray-900">{courtName}</p>
                          <p className="text-[11px] text-text-muted truncate max-w-[150px]">{venueName}</p>
                        </td>

                        <td className="py-3.5 px-4 text-text-muted">
                          <p className="font-semibold text-gray-900">{b.booking_date}</p>
                          <p className="text-[11px]">{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</p>
                        </td>

                        <td className="py-3.5 px-4 text-right font-extrabold text-brand-orange text-sm">
                          {priceFormatted}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {b.payment_proof_url ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProofBooking(b)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:underline bg-brand-orange/10 px-2 py-1 rounded-lg"
                            >
                              <FileImage size={12} /> Xem minh chứng
                            </button>
                          ) : (
                            <span className="text-[11px] text-text-muted">Chưa upload</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {statusBadge}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {b.payment_proof_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedProofBooking(b)}
                                className="p-1.5 rounded-lg bg-orange-50 text-brand-orange hover:bg-orange-100 transition-colors"
                                title="Xem minh chứng giao dịch"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            {(status === 'WAITING_OWNER_CONFIRMATION' || status === 'HOLDING' || status === 'PAYMENT_PENDING' || b.payment_proof_url) && status !== 'CONFIRMED' && status !== 'REJECTED' && status !== 'CANCELLED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setConfirmApproveBooking(b)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Duyệt đơn đặt sân"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRejectBooking(b)}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="Từ chối đơn"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            <Link to={`/owner/bookings/${b.booking_id}`}>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                title="Xem chi tiết"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border-subtle">
              {bookings.map((b) => (
                <div key={b.booking_id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900 text-xs">#{b.booking_id?.substring(0, 8)}</span>
                    <Badge variant={b.booking_status === 'CONFIRMED' ? 'success' : 'warning'} size="xs">
                      {b.booking_status}
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-gray-900">{b.customer?.full_name} ({b.customer?.phone_number})</p>
                    <p className="text-text-muted">{b.court?.court_name} • {b.booking_date} ({b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)})</p>
                    <p className="font-extrabold text-brand-orange text-sm mt-1">
                      {(b.total_amount || b.total_price) ? `${parseFloat(b.total_amount || b.total_price).toLocaleString('vi-VN')}đ` : '0đ'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                    {b.payment_proof_url && (
                      <button
                        type="button"
                        onClick={() => setSelectedProofBooking(b)}
                        className="text-brand-orange font-bold text-[11px] flex items-center gap-1"
                      >
                        <FileImage size={13} /> Xem ảnh minh chứng
                      </button>
                    )}
                    <Link to={`/owner/bookings/${b.booking_id}`} className="ml-auto">
                      <Button variant="outline" size="sm">Chi tiết</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-text-muted text-xs space-y-2">
            <ClipboardList size={36} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-900 text-sm">Chưa có đơn đặt sân nào</p>
            <p>Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại.</p>
          </div>
        )}
      </Card>

      {/* PAYMENT PROOF VIEWER MODAL */}
      <PaymentProofViewer
        isOpen={Boolean(selectedProofBooking)}
        onClose={() => setSelectedProofBooking(null)}
        proofUrl={selectedProofBooking?.payment_proof_url}
        booking={selectedProofBooking}
        onApprove={(b) => {
          setConfirmApproveBooking(b);
        }}
        onReject={(b) => {
          setSelectedRejectBooking(b);
        }}
        loadingAction={actionLoading}
      />

      {/* REJECTION MODAL */}
      <RejectionModal
        isOpen={Boolean(selectedRejectBooking)}
        onClose={() => setSelectedRejectBooking(null)}
        booking={selectedRejectBooking}
        onConfirmReject={handleRejectSubmit}
        loading={actionLoading}
      />

      {/* CONFIRM APPROVE DIALOG */}
      {confirmApproveBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận duyệt đơn đặt sân</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn xác nhận duyệt đơn hàng <strong>#{confirmApproveBooking.booking_id?.substring(0, 8)}</strong> của <strong>{confirmApproveBooking.customer?.full_name}</strong> không?
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setConfirmApproveBooking(null)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleApproveSubmit(confirmApproveBooking.booking_id)}
              >
                Xác nhận duyệt
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
