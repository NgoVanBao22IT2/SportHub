import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  FileImage,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  getOwnerPayments,
  approveOwnerPayment,
  rejectOwnerPayment
} from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PaymentProofViewer from '../../components/domain/PaymentProofViewer';
import RejectionModal from '../../components/domain/RejectionModal';

export default function OwnerPayments() {
  const [payments, setPayments] = useState([]);
  const [kpis, setKpis] = useState({ totalCount: 0, pendingCount: 0, paidCount: 0, totalAmount: 0, rejectedCount: 0 });
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Modals state
  const [selectedProofBooking, setSelectedProofBooking] = useState(null);
  const [selectedRejectPayment, setSelectedRejectPayment] = useState(null);
  const [confirmApprovePayment, setConfirmApprovePayment] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerPayments({
        page: meta.page,
        limit: meta.limit,
        status: statusFilter,
        paymentMethod: methodFilter,
        search: activeSearch
      });

      if (res && res.data) {
        setPayments(res.data);
        if (res.kpis) setKpis(res.kpis);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error fetching owner payments:', err);
      setError(err.message || 'Không thể tải danh sách giao dịch thanh toán.');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, statusFilter, methodFilter, activeSearch]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action: Approve Payment
  const handleApproveSubmit = async (paymentId) => {
    try {
      setActionLoading(true);
      await approveOwnerPayment(paymentId);
      showToast('Đã phê duyệt giao dịch thanh toán thành công!');
      setConfirmApprovePayment(null);
      setSelectedProofBooking(null);
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Lỗi khi duyệt giao dịch';
      showToast('⚠️ ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject Payment
  const handleRejectSubmit = async (paymentId, reason) => {
    try {
      setActionLoading(true);
      await rejectOwnerPayment(paymentId, reason);
      showToast('Đã từ chối giao dịch thanh toán!');
      setSelectedRejectPayment(null);
      setSelectedProofBooking(null);
      fetchPayments();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi từ chối giao dịch'));
    } finally {
      setActionLoading(false);
    }
  };

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
            <CreditCard className="text-brand-orange" size={24} />
            Quản lý giao dịch thanh toán & Minh chứng
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi, kiểm tra ảnh chụp giao dịch từ khách hàng và phê duyệt thanh toán chuyển khoản/MoMo.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={fetchPayments}
        >
          Làm mới
        </Button>
      </div>

      {/* KPI METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card padding="md" radius="xl" className="border border-border-subtle-medium bg-surface">
          <span className="text-text-muted text-[11px] font-bold block uppercase">Tổng giao dịch</span>
          <p className="text-xl font-extrabold text-gray-900 mt-1">{kpis.totalCount}</p>
        </Card>

        <Card padding="md" radius="xl" className="border border-amber-200 bg-amber-50/50">
          <span className="text-amber-800 text-[11px] font-bold block uppercase">Chờ xác nhận</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{kpis.pendingCount}</p>
        </Card>

        <Card padding="md" radius="xl" className="border border-emerald-200 bg-emerald-50/50">
          <span className="text-emerald-800 text-[11px] font-bold block uppercase">Đã thanh toán</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{kpis.paidCount}</p>
        </Card>

        <Card padding="md" radius="xl" className="border border-orange-200 bg-orange-50/50">
          <span className="text-orange-900 text-[11px] font-bold block uppercase">Tổng tiền đã nhận</span>
          <p className="text-lg font-extrabold text-brand-orange mt-1">
            {kpis.totalAmount ? `${kpis.totalAmount.toLocaleString('vi-VN')}đ` : '0đ'}
          </p>
        </Card>

        <Card padding="md" radius="xl" className="border border-red-200 bg-red-50/50 col-span-2 lg:col-span-1">
          <span className="text-red-800 text-[11px] font-bold block uppercase">Đã từ chối</span>
          <p className="text-xl font-extrabold text-red-700 mt-1">{kpis.rejectedCount}</p>
        </Card>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo Mã giao dịch (PAY-XXXX), Mã Booking, Tên khách..."
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

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="SUCCESS">Đã thanh toán (SUCCESS)</option>
            <option value="FAILED">Từ chối (FAILED)</option>
            <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả phương thức</option>
            <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
            <option value="MOMO">Ví MoMo</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <Card padding="none" radius="2xl" className="border border-border-subtle-medium overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
            <ErrorState title="Lỗi tải danh sách giao dịch" description={error} onRetry={fetchPayments} />
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border-subtle text-text-muted font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã Payment</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Sân con / Cơ sở</th>
                  <th className="py-3.5 px-4">Phương thức</th>
                  <th className="py-3.5 px-4 text-right">Số tiền</th>
                  <th className="py-3.5 px-4 text-center">Minh chứng</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface">
                {payments.map((p) => {
                  const b = p.booking || {};
                  const custName = b.customer?.full_name || 'Khách đặt sân';
                  const custPhone = b.customer?.phone_number || '';
                  const courtName = b.court?.court_name || 'Sân con';
                  const venueName = b.court?.branch?.venue?.venue_name || 'Câu lạc bộ';
                  const amountFormatted = p.amount ? `${parseFloat(p.amount).toLocaleString('vi-VN')}đ` : '0đ';
                  const pStatus = p.payment_status;

                  let statusBadge = <Badge variant="warning" size="xs">CHỜ XÁC NHẬN</Badge>;
                  if (pStatus === 'SUCCESS') {
                    statusBadge = <Badge variant="success" size="xs">ĐÃ THANH TOÁN</Badge>;
                  } else if (pStatus === 'FAILED') {
                    statusBadge = <Badge variant="danger" size="xs">ĐÃ TỪ CHỐI</Badge>;
                  } else if (pStatus === 'REFUNDED') {
                    statusBadge = <Badge variant="neutral" size="xs">ĐÃ HOÀN TIỀN</Badge>;
                  }

                  return (
                    <tr key={p.payment_id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        #{p.payment_id?.substring(0, 8)}
                        <p className="text-[10px] text-text-muted font-normal">Booking: #{b.booking_id?.substring(0, 8)}</p>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <p className="font-bold text-gray-900 truncate max-w-[140px]">{custName}</p>
                        <p className="text-[11px] text-text-muted">{custPhone}</p>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <p className="font-bold text-gray-900">{courtName}</p>
                        <p className="text-[11px] text-text-muted truncate max-w-[150px]">{venueName}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="info" size="xs">{p.payment_method || 'BANK_TRANSFER'}</Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-brand-orange text-sm">
                        {amountFormatted}
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
                          {(pStatus === 'INITIATED' || pStatus === 'PROCESSING') && (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirmApprovePayment(p)}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="Phê duyệt giao dịch thanh toán"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedRejectPayment(p)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Từ chối giao dịch thanh toán"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <Link to={`/owner/payments/${p.payment_id}`}>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              title="Xem chi tiết giao dịch"
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
        ) : (
          <div className="p-12 text-center text-text-muted text-xs space-y-2">
            <CreditCard size={36} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-900 text-sm">Chưa có giao dịch thanh toán nào</p>
            <p>Danh sách giao dịch thanh toán từ khách hàng sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </Card>

      {/* PAYMENT PROOF VIEWER MODAL */}
      <PaymentProofViewer
        isOpen={Boolean(selectedProofBooking)}
        onClose={() => setSelectedProofBooking(null)}
        proofUrl={selectedProofBooking?.payment_proof_url}
        booking={selectedProofBooking}
        onApprove={() => {
          const matchP = payments.find(p => p.booking_id === selectedProofBooking.booking_id);
          if (matchP) setConfirmApprovePayment(matchP);
        }}
        onReject={() => {
          const matchP = payments.find(p => p.booking_id === selectedProofBooking.booking_id);
          if (matchP) setSelectedRejectPayment(matchP);
        }}
        loadingAction={actionLoading}
      />

      {/* REJECTION MODAL */}
      <RejectionModal
        isOpen={Boolean(selectedRejectPayment)}
        onClose={() => setSelectedRejectPayment(null)}
        booking={selectedRejectPayment?.booking}
        onConfirmReject={(bId, reason) => handleRejectSubmit(selectedRejectPayment.payment_id, reason)}
        loading={actionLoading}
      />

      {/* CONFIRM APPROVE DIALOG */}
      {confirmApprovePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận duyệt thanh toán</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn duyệt giao dịch thanh toán <strong>#{confirmApprovePayment.payment_id?.substring(0, 8)}</strong> số tiền <strong>{confirmApprovePayment.amount ? parseFloat(confirmApprovePayment.amount).toLocaleString('vi-VN') : 0}đ</strong> không?
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setConfirmApprovePayment(null)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading}
                onClick={() => handleApproveSubmit(confirmApprovePayment.payment_id)}
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
