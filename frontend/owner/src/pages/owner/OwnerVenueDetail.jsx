import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import {
  getOwnerVenueById,
  createOwnerCourt,
  updateOwnerCourt,
  deleteOwnerCourt
} from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import CourtFormModal from '../../components/domain/CourtFormModal';

export default function OwnerVenueDetail() {
  const { venueId } = useParams();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Action states
  const [courtModalOpen, setCourtModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [activeBranchId, setActiveBranchId] = useState(null);
  const [deleteConfirmCourt, setDeleteConfirmCourt] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchVenueDetail = useCallback(async () => {
    if (!venueId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerVenueById(venueId);
      if (res && res.data) {
        setVenue(res.data);
      } else {
        setVenue(res);
      }
    } catch (err) {
      console.error('Error fetching venue details:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải thông tin câu lạc bộ.');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueDetail();
  }, [fetchVenueDetail]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Court Form for Create
  const handleOpenCreateCourt = (branchId) => {
    setEditingCourt(null);
    setActiveBranchId(branchId);
    setCourtModalOpen(true);
  };

  // Open Court Form for Edit
  const handleOpenEditCourt = (branchId, court) => {
    setEditingCourt(court);
    setActiveBranchId(branchId);
    setCourtModalOpen(true);
  };

  // Submit Court Form (Create or Update)
  const handleCourtFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (editingCourt) {
        // Edit existing court
        await updateOwnerCourt(venueId, activeBranchId, editingCourt.court_id, formData);
        showToast('Đã cập nhật thông tin sân con thành công!');
      } else {
        // Create new court
        await createOwnerCourt(venueId, activeBranchId, formData);
        showToast('Đã thêm sân con mới thành công!');
      }
      setCourtModalOpen(false);
      fetchVenueDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi lưu thông tin sân con'));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Court
  const handleDeleteCourtSubmit = async (branchId, courtId) => {
    try {
      setActionLoading(true);
      await deleteOwnerCourt(venueId, branchId, courtId);
      showToast('Đã xóa/ngừng hoạt động sân con thành công!');
      setDeleteConfirmCourt(null);
      fetchVenueDetail();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi xóa sân con'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton width="40px" height="40px" radius="xl" />
          <div className="space-y-2">
            <Skeleton width="220px" height="24px" />
            <Skeleton width="140px" height="14px" />
          </div>
        </div>

        <Card padding="lg" radius="2xl" className="space-y-4">
          <Skeleton width="100%" height="160px" radius="xl" />
        </Card>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Không tìm thấy câu lạc bộ"
          description={error || 'Câu lạc bộ này không tồn tại hoặc không thuộc quyền sở hữu của bạn.'}
          onRetry={fetchVenueDetail}
        />
        <div className="mt-4 text-center">
          <Link to="/owner/venues">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Quay lại danh sách câu lạc bộ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const branches = venue.branches || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-subtle-medium shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/owner/venues">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {venue.venue_name}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Loại hình: <strong className="text-brand-orange">{venue.sport_type || 'Thể thao tổng hợp'}</strong> • Mã: #{venue.venue_id?.substring(0, 8)}
            </p>
          </div>
        </div>

        <Badge variant={venue.operating_status === 'APPROVED' ? 'success' : 'warning'} size="md">
          {venue.operating_status === 'APPROVED' ? 'ĐANG HOẠT ĐỘNG' : 'CHỜ DUYỆT'}
        </Badge>
      </div>

      {/* VENUE INFORMATION CARD */}
      <Card padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Building2 size={18} className="text-brand-orange" />
            Thông tin chung Câu lạc bộ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-text-muted block">Tên câu lạc bộ:</span>
            <span className="font-bold text-gray-900 text-sm">{venue.venue_name}</span>
          </div>

          <div>
            <span className="text-text-muted block">Số điện thoại liên hệ:</span>
            <span className="font-bold text-brand-orange text-sm font-mono">{venue.contact_phone}</span>
          </div>

          <div className="md:col-span-2">
            <span className="text-text-muted block">Mô tả câu lạc bộ:</span>
            <p className="text-gray-700 leading-relaxed mt-0.5">
              {venue.venue_description || 'Chưa có thông tin mô tả.'}
            </p>
          </div>
        </div>
      </Card>

      {/* BRANCHES & COURTS MANAGEMENT SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <MapPin size={20} className="text-brand-orange" />
            Danh sách Chi nhánh & Sân con
          </h2>
        </div>

        {branches.length > 0 ? (
          branches.map((b) => (
            <Card key={b.branch_id} padding="lg" radius="2xl" className="border border-border-subtle-medium space-y-4 bg-surface">
              
              {/* Branch Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    {b.branch_name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                    <MapPin size={13} className="text-brand-orange" />
                    <span>{b.street_address}, {b.ward_district_city}</span>
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => handleOpenCreateCourt(b.branch_id)}
                >
                  Thêm sân con
                </Button>
              </div>

              {/* Courts Table inside Branch */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                  Danh sách Sân con ({b.courts ? b.courts.length : 0} sân)
                </span>

                {b.courts && b.courts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle text-text-muted font-bold">
                          <th className="pb-2">Tên sân</th>
                          <th className="pb-2">Môn thể thao</th>
                          <th className="pb-2">Đặc điểm mặt sân</th>
                          <th className="pb-2 text-center">Trạng thái</th>
                          <th className="pb-2 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {b.courts.map((court) => {
                          const isCourtActive = court.court_status === 'ACTIVE';
                          const isMaintenance = court.court_status === 'MAINTENANCE';

                          return (
                            <tr key={court.court_id} className="hover:bg-surface-subtle transition-colors">
                              <td className="py-3 font-bold text-gray-900">
                                {court.court_name}
                              </td>

                              <td className="py-3 font-medium text-brand-orange">
                                {court.sport_category}
                              </td>

                              <td className="py-3 text-text-muted">
                                {court.surface_features || 'Mặt sân tiêu chuẩn'}
                              </td>

                              <td className="py-3 text-center">
                                {isCourtActive ? (
                                  <Badge variant="success" size="xs">Hoạt động</Badge>
                                ) : isMaintenance ? (
                                  <Badge variant="warning" size="xs">Bảo trì</Badge>
                                ) : (
                                  <Badge variant="danger" size="xs">Tạm ngưng</Badge>
                                )}
                              </td>

                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCourt(b.branch_id, court)}
                                    className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                    title="Chỉnh sửa sân"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmCourt({ branchId: b.branch_id, court })}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                    title="Xóa / Tháo gỡ sân"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-text-muted text-xs bg-surface-subtle rounded-xl border border-dashed border-border-subtle-medium">
                    Chi nhánh này chưa có sân con nào. Vui lòng bấm <strong>"Thêm sân con"</strong> để tạo mới.
                  </div>
                )}
              </div>

            </Card>
          ))
        ) : (
          <Card padding="lg" radius="2xl" className="text-center py-8 text-text-muted text-xs space-y-2">
            <p>Chưa có chi nhánh nào thuộc câu lạc bộ này.</p>
          </Card>
        )}
      </div>

      {/* COURT FORM MODAL (CREATE / EDIT) */}
      <CourtFormModal
        isOpen={courtModalOpen}
        onClose={() => setCourtModalOpen(false)}
        court={editingCourt}
        onSubmit={handleCourtFormSubmit}
        loading={actionLoading}
      />

      {/* CONFIRM DELETE COURT DIALOG */}
      {deleteConfirmCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận xóa sân con</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn tháo gỡ/xóa <strong>Sân {deleteConfirmCourt.court?.court_name}</strong> khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmCourt(null)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={actionLoading}
                onClick={() => handleDeleteCourtSubmit(deleteConfirmCourt.branchId, deleteConfirmCourt.court?.court_id)}
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
