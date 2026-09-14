import { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, AlertCircle, RefreshCw, Edit2, Trash2, X, Shield, Coffee, Wifi, Car, Zap, Lock, Utensils } from 'lucide-react';
import {
  getOwnerVenues,
  getOwnerFacilities,
  createOwnerFacility,
  updateOwnerFacility,
  deleteOwnerFacility,
  assignOwnerFacility,
  removeOwnerFacility
} from '../api/owner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

export default function OwnerServices() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [allFacilities, setAllFacilities] = useState([]);
  const [assignedFacilityIds, setAssignedFacilityIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });

  // Facility Form Modal (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [facilityForm, setFacilityForm] = useState({ facility_name: '', facility_icon: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState({ open: false, facility: null, loading: false });

  // 1. Fetch Owner's Venues
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await getOwnerVenues();
      const venueList = res.data || res || [];
      setVenues(venueList);

      if (venueList.length > 0) {
        const currentVenue = venueList.find((v) => v.venue_id === selectedVenueId) || venueList[0];
        setSelectedVenueId(currentVenue.venue_id);
        const assignedIds = new Set((currentVenue.facilities || []).map((f) => f.facility_id));
        setAssignedFacilityIds(assignedIds);
      }
    } catch (err) {
      console.error('Failed to fetch owner venues:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Platform Facilities
  const fetchFacilities = async () => {
    try {
      const res = await getOwnerFacilities();
      setAllFacilities(res.data || res || []);
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
    }
  };

  useEffect(() => {
    fetchVenues();
    fetchFacilities();
  }, []);

  const handleVenueChange = (e) => {
    const vId = e.target.value;
    setSelectedVenueId(vId);
    const targetVenue = venues.find((v) => v.venue_id === vId);
    if (targetVenue) {
      const assignedIds = new Set((targetVenue.facilities || []).map((f) => f.facility_id));
      setAssignedFacilityIds(assignedIds);
    }
  };

  const handleToggleFacility = async (facilityId) => {
    if (!selectedVenueId) return;

    const isAssigned = assignedFacilityIds.has(facilityId);

    try {
      setActionLoadingId(facilityId);
      if (isAssigned) {
        await removeOwnerFacility(selectedVenueId, facilityId);
        setAssignedFacilityIds((prev) => {
          const next = new Set(prev);
          next.delete(facilityId);
          return next;
        });
      } else {
        await assignOwnerFacility(selectedVenueId, { facility_id: facilityId });
        setAssignedFacilityIds((prev) => new Set(prev).add(facilityId));
      }
      // Refresh venues list to update in-memory objects
      const res = await getOwnerVenues();
      setVenues(res.data || res || []);
    } catch (err) {
      console.error('Failed to update facility assignment:', err);
      setNoticeModal({
        open: true,
        title: 'Thao tác thất bại',
        message: err.response?.data?.message || 'Không thể cập nhật tiện ích cho cụm sân.',
        type: 'error'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingFacility(null);
    setFacilityForm({ facility_name: '', facility_icon: '' });
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (fac) => {
    setEditingFacility(fac);
    setFacilityForm({
      facility_name: fac.facility_name || '',
      facility_icon: fac.facility_icon || ''
    });
    setIsFormOpen(true);
  };

  // Save Facility (Create or Edit)
  const handleSaveFacility = async (e) => {
    e.preventDefault();
    if (!facilityForm.facility_name.trim()) {
      setNoticeModal({
        open: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên tiện ích.',
        type: 'error'
      });
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingFacility) {
        await updateOwnerFacility(editingFacility.facility_id, facilityForm);
      } else {
        await createOwnerFacility(facilityForm);
      }
      await fetchFacilities();
      setIsFormOpen(false);
      setNoticeModal({
        open: true,
        title: 'Thành công',
        message: editingFacility ? 'Đã cập nhật thông tin tiện ích.' : 'Đã tạo tiện ích dịch vụ mới thành công.',
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to save facility:', err);
      setNoticeModal({
        open: true,
        title: 'Lỗi lưu tiện ích',
        message: err.response?.data?.message || 'Không thể lưu tiện ích dịch vụ.',
        type: 'error'
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (fac) => {
    setDeleteModal({ open: true, facility: fac, loading: false });
  };

  // Confirm Delete Facility
  const handleConfirmDelete = async () => {
    if (!deleteModal.facility) return;
    const targetFacName = deleteModal.facility.facility_name;
    const targetFacId = deleteModal.facility.facility_id;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await deleteOwnerFacility(targetFacId);
      await fetchFacilities();
      setAssignedFacilityIds((prev) => {
        const next = new Set(prev);
        next.delete(targetFacId);
        return next;
      });
      setDeleteModal({ open: false, facility: null, loading: false });
      setNoticeModal({
        open: true,
        title: 'Đã xóa tiện ích',
        message: `Đã xóa tiện ích "${targetFacName}" khỏi hệ thống thành công.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to delete facility:', err);
      if (err.response?.status === 404) {
        await fetchFacilities();
        setDeleteModal({ open: false, facility: null, loading: false });
        setNoticeModal({
          open: true,
          title: 'Đã xóa tiện ích',
          message: `Tiện ích "${targetFacName}" đã được xóa khỏi hệ thống.`,
          type: 'success'
        });
      } else {
        setDeleteModal((prev) => ({ ...prev, loading: false }));
        setNoticeModal({
          open: true,
          title: 'Xóa thất bại',
          message: err.response?.data?.message || 'Không thể xóa tiện ích dịch vụ.',
          type: 'error'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Tag className="text-brand-orange" size={26} />
            Quản lý Tiện Ích & Dịch Vụ Cụm Sân
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý danh mục tiện ích dịch vụ, tạo/sửa/xóa và Bật/Tắt dịch vụ đi kèm cho cụm sân của bạn.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={handleOpenCreate}
        >
          Thêm tiện ích mới
        </Button>
      </div>

      {/* VENUE SELECTOR */}
      <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <label className="text-xs font-bold text-gray-900 shrink-0">Chọn cụm sân áp dụng:</label>
            <select
              value={selectedVenueId}
              onChange={handleVenueChange}
              className="w-full sm:w-80 px-4 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => {
              fetchVenues();
              fetchFacilities();
            }}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* FACILITIES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-text-muted text-xs">
            Đang nạp danh sách tiện ích từ hệ thống...
          </div>
        ) : allFacilities.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted text-xs space-y-2">
            <p>Chưa có tiện ích dịch vụ nào.</p>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenCreate}>
              Tạo tiện ích đầu tiên
            </Button>
          </div>
        ) : (
          allFacilities.map((fac) => {
            const isAssigned = assignedFacilityIds.has(fac.facility_id);
            const isLoading = actionLoadingId === fac.facility_id;

            return (
              <Card
                key={fac.facility_id}
                padding="md"
                radius="xl"
                className={[
                  'border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs group',
                  isAssigned
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-border-subtle-medium bg-surface'
                ].join(' ')}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    isAssigned ? 'bg-emerald-500 text-white' : 'bg-surface-subtle text-text-muted'
                  }`}>
                    <Tag size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-xs truncate">{fac.facility_name}</h3>
                    <p className="text-[11px] text-text-muted truncate">{fac.facility_icon || 'Dịch vụ tiện ích'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Edit & Delete Action Buttons */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(fac)}
                    title="Chỉnh sửa tiện ích"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDelete(fac)}
                    title="Xóa tiện ích"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Toggle Assign Button */}
                  <Button
                    variant={isAssigned ? 'primary' : 'outline'}
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleToggleFacility(fac.facility_id)}
                  >
                    {isLoading ? '...' : isAssigned ? '✓ Bật' : '+ Thêm'}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT FACILITY MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-border-subtle-medium animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Tag size={18} className="text-brand-orange" />
                {editingFacility ? 'Chỉnh sửa tiện ích dịch vụ' : 'Thêm tiện ích dịch vụ mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-gray-900 hover:bg-surface-subtle"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">
                  Tên tiện ích / dịch vụ *
                </label>
                <Input
                  type="text"
                  placeholder="VD: Ghế massage thư giãn, Wifi tốc độ cao..."
                  value={facilityForm.facility_name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, facility_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">
                  Mã Icon / Mô tả ngắn
                </label>
                <Input
                  type="text"
                  placeholder="VD: wifi, parking, shower, coffee, sports, lightbulb, lock..."
                  value={facilityForm.facility_icon}
                  onChange={(e) => setFacilityForm({ ...facilityForm, facility_icon: e.target.value })}
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Có thể ghi chú từ khóa icon như: wifi, parking, shower, coffee, sports, lightbulb, lock...
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={formSubmitting}
                >
                  {editingFacility ? 'Lưu cập nhật' : 'Tạo tiện ích'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModal.open && deleteModal.facility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center font-bold">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Xác nhận xóa tiện ích</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Bạn có chắc chắn muốn xóa tiện ích <strong className="text-gray-900">"{deleteModal.facility.facility_name}"</strong> khỏi danh mục tiện ích dịch vụ không?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModal({ open: false, facility: null, loading: false })}
                disabled={deleteModal.loading}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteModal.loading}
                onClick={handleConfirmDelete}
              >
                Xóa tiện ích
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold">
              {noticeModal.type === 'success' ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">{noticeModal.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{noticeModal.message}</p>
            </div>

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
