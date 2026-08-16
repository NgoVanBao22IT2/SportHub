import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Building2,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import {
  getOwnerPaymentAccounts,
  getOwnerVenues,
  createOwnerPaymentAccount,
  updateOwnerPaymentAccount,
  deleteOwnerPaymentAccount
} from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import PaymentAccountFormModal from '../../components/domain/PaymentAccountFormModal';

export default function OwnerPaymentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [accRes, venueRes] = await Promise.all([
        getOwnerPaymentAccounts(),
        getOwnerVenues()
      ]);

      if (accRes && accRes.data) setAccounts(accRes.data);
      else if (Array.isArray(accRes)) setAccounts(accRes);

      if (venueRes && venueRes.data) setVenues(venueRes.data);
      else if (Array.isArray(venueRes)) setVenues(venueRes);
    } catch (err) {
      console.error('Error fetching owner payment accounts:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải tài khoản thanh toán.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreateModal = () => {
    if (venues.length === 0) {
      showToast('⚠️ Bạn chưa tạo Câu lạc bộ nào. Vui lòng tạo Câu lạc bộ trước khi cấu hình tài khoản thanh toán.');
      return;
    }
    setEditingAccount(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditingAccount(acc);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (editingAccount) {
        await updateOwnerPaymentAccount(editingAccount.account_id, formData);
        showToast('Đã cập nhật thông tin tài khoản thành công!');
      } else {
        await createOwnerPaymentAccount(formData);
        showToast('Đã thêm tài khoản thanh toán mới!');
      }
      setFormModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi lưu tài khoản thanh toán'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async (accountId) => {
    try {
      setActionLoading(true);
      await deleteOwnerPaymentAccount(accountId);
      showToast('Đã xóa tài khoản thanh toán!');
      setDeleteConfirmAccount(null);
      fetchData();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi xóa tài khoản'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (acc) => {
    try {
      setActionLoading(true);
      await updateOwnerPaymentAccount(acc.account_id, { is_active: !acc.is_active });
      showToast(`Đã ${!acc.is_active ? 'kích hoạt' : 'tạm ngưng'} tài khoản thanh toán!`);
      fetchData();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi thay đổi trạng thái'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* TOAST NOTIFICATION */}
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
            Quản lý tài khoản thanh toán
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Cấu hình số tài khoản ngân hàng & ví MoMo hiển thị cho khách hàng thực hiện chuyển khoản khi đặt sân.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={fetchData}
          >
            Làm mới
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={handleOpenCreateModal}
          >
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {/* ACCOUNTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} padding="lg" radius="2xl" className="space-y-4">
              <Skeleton width="140px" height="20px" />
              <Skeleton width="100%" height="80px" radius="xl" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState title="Lỗi tải tài khoản thanh toán" description={error} onRetry={fetchData} />
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((acc) => {
            const isMoMo = acc.payment_method === 'MOMO';

            return (
              <Card
                key={acc.account_id}
                padding="lg"
                radius="2xl"
                className="border border-border-subtle-medium bg-surface space-y-4 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={isMoMo ? 'warning' : 'info'} size="sm">
                      {isMoMo ? 'VÍ MOMO' : 'CHUYỂN KHOẢN NGÂN HÀNG'}
                    </Badge>
                    <span className="text-xs font-bold text-gray-900">
                      {acc.venue?.venue_name || 'Tất cả câu lạc bộ'}
                    </span>
                  </div>

                  <Badge variant={acc.is_active ? 'success' : 'danger'} size="xs">
                    {acc.is_active ? 'ĐANG DÙNG' : 'TẠM NGƯNG'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  
                  {/* Account Details */}
                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <div>
                      <span className="text-text-muted block">Ngân hàng / Đơn vị:</span>
                      <span className="font-bold text-gray-900 text-sm">{acc.bank_name || 'Ví MoMo'}</span>
                    </div>

                    <div>
                      <span className="text-text-muted block">{isMoMo ? 'Số điện thoại MoMo:' : 'Số tài khoản (STK):'}</span>
                      <span className="font-extrabold text-brand-orange text-base font-mono">{acc.account_number}</span>
                    </div>

                    <div>
                      <span className="text-text-muted block">Chủ tài khoản:</span>
                      <span className="font-bold text-gray-900 uppercase">{acc.account_name}</span>
                    </div>
                  </div>

                  {/* QR Preview Box */}
                  <div className="bg-surface-subtle p-2.5 rounded-xl border border-border-subtle text-center flex flex-col items-center">
                    {acc.qr_code_url ? (
                      <a
                        href={acc.qr_code_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block w-24 h-24 overflow-hidden rounded-lg border bg-white"
                        title="Bấm xem QR phóng to"
                      >
                        <img
                          src={acc.qr_code_url}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      </a>
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center text-text-muted text-[11px]">
                        Chưa có QR
                      </div>
                    )}
                    <span className="text-[10px] text-text-muted mt-1">Mã VietQR / MoMo</span>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(acc)}
                    className={`font-bold transition-colors ${acc.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    {acc.is_active ? 'Tạm ngưng nhận tiền' : 'Kích hoạt lại'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(acc)}
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Chỉnh sửa tài khoản"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmAccount(acc)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Xóa tài khoản"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-text-muted text-xs space-y-2 bg-surface rounded-2xl border border-border-subtle-medium">
          <CreditCard size={36} className="mx-auto text-gray-300" />
          <p className="font-bold text-gray-900 text-sm">Bạn chưa cấu hình tài khoản thanh toán nào</p>
          <p>Khách hàng sẽ không thể chuyển khoản nếu chưa có tài khoản nhận tiền nào được kích hoạt.</p>
          <div className="pt-2">
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={handleOpenCreateModal}>
              Thêm tài khoản nhận tiền ngay
            </Button>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      <PaymentAccountFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        account={editingAccount}
        venues={venues}
        onSubmit={handleFormSubmit}
        loading={actionLoading}
      />

      {/* DELETE CONFIRM DIALOG */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận xóa tài khoản</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteConfirmAccount.bank_name} ({deleteConfirmAccount.account_number})</strong> không?
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmAccount(null)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={actionLoading}
                onClick={() => handleDeleteSubmit(deleteConfirmAccount.account_id)}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
