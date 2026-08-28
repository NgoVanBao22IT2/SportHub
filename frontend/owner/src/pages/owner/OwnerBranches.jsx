import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { getOwnerVenues, getOwnerBranches, createOwnerBranch, updateOwnerBranch, deleteOwnerBranch } from '../../api/owner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

export default function OwnerBranches() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });

  const [form, setForm] = useState({
    branch_name: '',
    street_address: '',
    ward_district_city: '',
    branch_phone: '',
    geo_coordinates: '',
    branch_status: 'ACTIVE'
  });
  const [errors, setErrors] = useState({});

  // 1. Fetch Owner's Venues
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await getOwnerVenues();
      const venueList = res.data || res || [];
      setVenues(venueList);

      if (venueList.length > 0) {
        const defaultVenueId = venueList[0].venue_id;
        setSelectedVenueId(defaultVenueId);
        await fetchBranches(defaultVenueId);
      }
    } catch (err) {
      console.error('Failed to fetch owner venues:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Branches for selected Venue
  const fetchBranches = async (venueId) => {
    if (!venueId) return;
    try {
      setLoading(true);
      const res = await getOwnerBranches(venueId);
      setBranches(res.data || []);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleVenueChange = (e) => {
    const vId = e.target.value;
    setSelectedVenueId(vId);
    fetchBranches(vId);
  };

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    setForm({
      branch_name: '',
      street_address: '',
      ward_district_city: 'Quận Tân Bình, TP. Hồ Chí Minh',
      branch_phone: '',
      geo_coordinates: '',
      branch_status: 'ACTIVE'
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (b) => {
    setEditingBranch(b);
    setForm({
      branch_name: b.branch_name || '',
      street_address: b.street_address || '',
      ward_district_city: b.ward_district_city || '',
      branch_phone: b.branch_phone || '',
      geo_coordinates: b.geo_coordinates || '',
      branch_status: b.branch_status || 'ACTIVE'
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.branch_name.trim()) errs.branch_name = 'Vui lòng nhập tên chi nhánh';
    if (!form.street_address.trim()) errs.street_address = 'Vui lòng nhập địa chỉ số nhà / tên đường';
    if (!form.ward_district_city.trim()) errs.ward_district_city = 'Vui lòng nhập Phường/Quận/Thành phố';
    if (!form.branch_phone.trim()) errs.branch_phone = 'Vui lòng nhập số điện thoại chi nhánh';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setActionLoading(true);
      if (editingBranch) {
        await updateOwnerBranch(selectedVenueId, editingBranch.branch_id, form);
        setNoticeModal({ open: true, title: 'Cập nhật thành công', message: 'Chi nhánh đã được cập nhật thông tin.', type: 'success' });
      } else {
        await createOwnerBranch(selectedVenueId, form);
        setNoticeModal({ open: true, title: 'Tạo chi nhánh mới', message: 'Đã thêm chi nhánh mới vào cụm sân.', type: 'success' });
      }
      setModalOpen(false);
      fetchBranches(selectedVenueId);
    } catch (err) {
      console.error('Failed to save branch:', err);
      setNoticeModal({
        open: true,
        title: 'Thao tác thất bại',
        message: err.response?.data?.message || 'Không thể lưu thông tin chi nhánh.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteSubmit = async (bId) => {
    try {
      setActionLoading(true);
      await deleteOwnerBranch(selectedVenueId, bId);
      setNoticeModal({ open: true, title: 'Đã xóa chi nhánh', message: 'Chi nhánh đã được xóa khỏi hệ thống.', type: 'info' });
      setDeleteConfirmId(null);
      fetchBranches(selectedVenueId);
    } catch (err) {
      console.error('Failed to delete branch:', err);
      setNoticeModal({ open: true, title: 'Không thể xóa', message: err.response?.data?.message || 'Không thể xóa chi nhánh.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & VENUE SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="text-brand-orange" size={26} />
            Quản lý Chi Nhánh Cụm Sân
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý các cơ sở / chi nhánh trực thuộc cụm sân thể thao của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            disabled={!selectedVenueId}
            onClick={handleOpenCreateModal}
          >
            Thêm chi nhánh mới
          </Button>
        </div>
      </div>

      {/* VENUE SELECTION TOOLBAR */}
      <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <label className="text-xs font-bold text-gray-900 shrink-0">Chọn cụm sân:</label>
            <select
              value={selectedVenueId}
              onChange={handleVenueChange}
              className="w-full sm:w-80 px-4 py-2 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name} 
                  {/* ({v.operating_status}) */}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => fetchBranches(selectedVenueId)}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* BRANCHES LIST TABLE */}
      <Card padding="none" radius="xl" className="border border-border-subtle-medium shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle-medium">
                <th className="py-3.5 px-4">Tên Chi Nhánh</th>
                <th className="py-3.5 px-4">Địa Chỉ </th>
                <th className="py-3.5 px-4">Khu Vực</th>
                <th className="py-3.5 px-4">SĐT</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Đang nạp danh sách chi nhánh...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Chưa có chi nhánh nào thuộc cụm sân này. Vui lòng bấm "Thêm chi nhánh mới".
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.branch_id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-brand-orange shrink-0" />
                        <span>{b.branch_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{b.street_address}</td>
                    <td className="py-3.5 px-4 text-text-muted">{b.ward_district_city}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{b.branch_phone}</td>
                    <td className="py-3.5 px-4">
                      {b.branch_status === 'ACTIVE' ? (
                        <Badge variant="success" size="sm">Hoạt động</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Đóng cửa</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-orange-50 text-brand-orange transition-colors"
                          title="Chỉnh sửa chi nhánh"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(b.branch_id)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Xóa chi nhánh"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE / EDIT BRANCH MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle-medium rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-border-subtle pb-3">
              {editingBranch ? 'Chỉnh sửa thông tin chi nhánh' : 'Thêm chi nhánh mới'}
            </h3>

            <div className="space-y-3">
              <Input
                id="branch_name"
                name="branch_name"
                label="Tên chi nhánh "
                placeholder="VD: Chi Nhánh 1 - Lý Thường Kiệt"
                value={form.branch_name}
                onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                error={errors.branch_name}
                required
              />

              <Input
                id="street_address"
                name="street_address"
                label="Địa chỉ số nhà, tên đường "
                placeholder="VD: 120/45 Lý Thường Kiệt"
                value={form.street_address}
                onChange={(e) => setForm({ ...form, street_address: e.target.value })}
                error={errors.street_address}
                required
              />

              <Input
                id="ward_district_city"
                name="ward_district_city"
                label="Phường / Quận / TP "
                placeholder="VD: Phường 15, Quận Tân Bình, TP. Hồ Chí Minh"
                value={form.ward_district_city}
                onChange={(e) => setForm({ ...form, ward_district_city: e.target.value })}
                error={errors.ward_district_city}
                required
              />

              <Input
                id="branch_phone"
                name="branch_phone"
                label="Số điện thoại liên hệ "
                placeholder="VD: 0901234567"
                value={form.branch_phone}
                onChange={(e) => setForm({ ...form, branch_phone: e.target.value })}
                error={errors.branch_phone}
                required
              />

              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">Trạng thái chi nhánh</label>
                <select
                  value={form.branch_status}
                  onChange={(e) => setForm({ ...form, branch_status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Đóng cửa</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </div>
          </form>
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <h3 className="text-base font-bold text-gray-900">Xác nhận xóa chi nhánh</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa chi nhánh này? Thao tác này không thể hoàn tác.
            </p>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="md" fullWidth onClick={() => setDeleteConfirmId(null)} disabled={actionLoading}>
                Hủy bỏ
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={() => handleDeleteSubmit(deleteConfirmId)} loading={actionLoading}>
                Xóa ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
