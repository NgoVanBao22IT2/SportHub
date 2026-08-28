import { useState, useEffect } from 'react';
import { Trophy, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldAlert } from 'lucide-react';
import { getOwnerVenues, getOwnerBranches, getOwnerCourts, createOwnerCourt, updateOwnerCourt, deleteOwnerCourt } from '../../api/owner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

export default function OwnerCourts() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });

  const [form, setForm] = useState({
    court_name: '',
    sport_category: 'Cầu lông',
    surface_features: 'Thảm Taraflex cao cấp, đạt chuẩn thi đấu',
    court_status: 'ACTIVE'
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
      const branchList = res.data || [];
      setBranches(branchList);

      if (branchList.length > 0) {
        const defaultBranchId = branchList[0].branch_id;
        setSelectedBranchId(defaultBranchId);
        await fetchCourts(venueId, defaultBranchId);
      } else {
        setSelectedBranchId('');
        setCourts([]);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Courts for selected Branch
  const fetchCourts = async (venueId, branchId) => {
    if (!venueId || !branchId) return;
    try {
      setLoading(true);
      const res = await getOwnerCourts(venueId, branchId);
      const list = res.data || [];
      list.sort((a, b) => (a.court_name || '').localeCompare(b.court_name || '', undefined, { numeric: true, sensitivity: 'base' }));
      setCourts(list);
    } catch (err) {
      console.error('Failed to fetch courts:', err);
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

  const handleBranchChange = (e) => {
    const bId = e.target.value;
    setSelectedBranchId(bId);
    fetchCourts(selectedVenueId, bId);
  };

  const handleOpenCreateModal = () => {
    setEditingCourt(null);
    setForm({
      court_name: `Sân ${courts.length + 1}`,
      sport_category: 'Cầu lông',
      surface_features: 'Thảm Taraflex chống trơn trượt',
      court_status: 'ACTIVE'
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (court) => {
    setEditingCourt(court);
    setForm({
      court_name: court.court_name || '',
      sport_category: court.sport_category || 'Cầu lông',
      surface_features: court.surface_features || '',
      court_status: court.court_status || 'ACTIVE'
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.court_name.trim()) errs.court_name = 'Vui lòng nhập tên sân con';
    if (!form.sport_category.trim()) errs.sport_category = 'Vui lòng chọn bộ môn thể thao';
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
      if (editingCourt) {
        await updateOwnerCourt(selectedVenueId, selectedBranchId, editingCourt.court_id, form);
        setNoticeModal({ open: true, title: 'Cập nhật thành công', message: 'Đã lưu thay đổi cho sân con.', type: 'success' });
      } else {
        await createOwnerCourt(selectedVenueId, selectedBranchId, form);
        setNoticeModal({ open: true, title: 'Tạo sân con mới', message: 'Sân con mới đã được thêm vào chi nhánh.', type: 'success' });
      }
      setModalOpen(false);
      fetchCourts(selectedVenueId, selectedBranchId);
    } catch (err) {
      console.error('Failed to save court:', err);
      setNoticeModal({
        open: true,
        title: 'Thao tác thất bại',
        message: err.response?.data?.message || 'Không thể lưu thông tin sân con.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteSubmit = async (courtId) => {
    try {
      setActionLoading(true);
      await deleteOwnerCourt(selectedVenueId, selectedBranchId, courtId);
      setNoticeModal({ open: true, title: 'Đã xóa sân con', message: 'Sân con đã được xóa khỏi danh mục chi nhánh.', type: 'info' });
      setDeleteConfirmId(null);
      fetchCourts(selectedVenueId, selectedBranchId);
    } catch (err) {
      console.error('Failed to delete court:', err);
      setNoticeModal({
        open: true,
        title: 'Không thể xóa sân',
        message: err.response?.data?.message || 'Sân đang có lịch đặt hoặc không thể xóa.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="text-brand-orange" size={26} />
            Quản lý Danh Mục Sân Con
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý chi tiết từng sân con thuộc chi nhánh, thiết lập trạng thái Hoạt động / Bảo trì.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            disabled={!selectedVenueId || !selectedBranchId}
            onClick={handleOpenCreateModal}
          >
            Thêm sân con mới
          </Button>
        </div>
      </div>

      {/* VENUE & BRANCH SELECTOR TOOLBAR */}
      <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-900 block">1. Chọn Cụm Sân Thể Thao *</label>
            <select
              value={selectedVenueId}
              onChange={handleVenueChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name} 
                  {/* ({v.operating_status}) */}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-900 block">2. Chọn Chi Nhánh Trực Thuộc *</label>
            <select
              value={selectedBranchId}
              onChange={handleBranchChange}
              disabled={branches.length === 0}
              className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange disabled:opacity-50"
            >
              {branches.length === 0 ? (
                <option value="">(Cụm sân chưa có chi nhánh - Vui lòng tạo chi nhánh trước)</option>
              ) : (
                branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name} - {b.street_address}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </Card>

      {/* COURTS DATA TABLE */}
      <Card padding="none" radius="xl" className="border border-border-subtle-medium shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle-medium">
                <th className="py-3.5 px-4">Tên Sân Con</th>
                <th className="py-3.5 px-4">Môn Thể Thao</th>
                <th className="py-3.5 px-4">Đặc Điểm</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    Đang nạp danh sách sân con...
                  </td>
                </tr>
              ) : courts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    {branches.length === 0
                      ? 'Vui lòng sang trang "Quản lý Chi Nhánh" để khởi tạo chi nhánh trước khi thêm sân con.'
                      : 'Chưa có sân con nào thuộc chi nhánh này. Vui lòng bấm "Thêm sân con mới".'}
                  </td>
                </tr>
              ) : (
                courts.map((court) => (
                  <tr key={court.court_id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-brand-orange shrink-0" />
                        <span>{court.court_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">{court.sport_category}</td>
                    <td className="py-3.5 px-4 text-text-muted">{court.surface_features || 'Thảm tiêu chuẩn'}</td>
                    <td className="py-3.5 px-4">
                      {court.court_status === 'ACTIVE' ? (
                        <Badge variant="success" size="sm">Hoạt động</Badge>
                      ) : court.court_status === 'MAINTENANCE' ? (
                        <Badge variant="warning" size="sm">Bảo trì</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Đóng cửa</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(court)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-orange-50 text-brand-orange transition-colors"
                          title="Chỉnh sửa sân"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(court.court_id)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Xóa sân"
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

      {/* CREATE / EDIT COURT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle-medium rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-border-subtle pb-3">
              {editingCourt ? 'Chỉnh sửa thông tin sân con' : 'Thêm sân con mới'}
            </h3>

            <div className="space-y-3">
              <Input
                id="court_name"
                name="court_name"
                label="Tên sân con "
                placeholder="VD: Sân 01, Sân Vip 1..."
                value={form.court_name}
                onChange={(e) => setForm({ ...form, court_name: e.target.value })}
                error={errors.court_name}
                required
              />

              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">Bộ môn thể thao *</label>
                <select
                  value={form.sport_category}
                  onChange={(e) => setForm({ ...form, sport_category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                >
                  <option value="Cầu lông">Cầu lông</option>
                  <option value="Pickleball">Pickleball</option>
                  <option value="Bóng đá">Bóng đá</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Bóng rổ">Bóng rổ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">Đặc điểm mặt sân & Tiện ích sân</label>
                <input
                  type="text"
                  placeholder="VD: Thảm Taraflex cao cấp 4.5mm, đèn LED chống chói"
                  value={form.surface_features}
                  onChange={(e) => setForm({ ...form, surface_features: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">Trạng thái vận hành sân</label>
                <select
                  value={form.court_status}
                  onChange={(e) => setForm({ ...form, court_status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="MAINTENANCE">Bảo trì </option>
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
                {actionLoading ? 'Đang lưu...' : 'Lưu sân con'}
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
            <h3 className="text-base font-bold text-gray-900">Xác nhận xóa sân con</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa sân con này? Thao tác này sẽ xóa sân khỏi hệ thống.
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
