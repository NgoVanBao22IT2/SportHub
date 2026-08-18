import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Tag,
  Copy,
  Edit2,
  Eye,
  X,
  ToggleLeft,
  ToggleRight,
  GraduationCap,
  Users
} from 'lucide-react';
import {
  getOwnerVenues,
  getOwnerBranches,
  getOwnerCourts,
  getOwnerSchedules,
  createOwnerSchedule,
  updateOwnerSchedule,
  toggleOwnerScheduleStatus,
  duplicateOwnerSchedule,
  deleteOwnerSchedule
} from '../../api/owner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

const DAY_OPTIONS = [
  { id: 'MONDAY', label: 'T2', name: 'Thứ Hai' },
  { id: 'TUESDAY', label: 'T3', name: 'Thứ Ba' },
  { id: 'WEDNESDAY', label: 'T4', name: 'Thứ Tư' },
  { id: 'THURSDAY', label: 'T5', name: 'Thứ Năm' },
  { id: 'FRIDAY', label: 'T6', name: 'Thứ Sáu' },
  { id: 'SATURDAY', label: 'T7', name: 'Thứ Bảy' },
  { id: 'SUNDAY', label: 'CN', name: 'Chủ Nhật' }
];

export default function OwnerPricing() {
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState('');

  const [scopeTargetType, setScopeTargetType] = useState('VENUE');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    pricingGroup: 'GENERAL',
    selectedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    opening_time: '05:00',
    closing_time: '08:00',
    fixed_price: 40000,
    walk_in_price: 50000,
    base_hourly_price: 40000,
    is_active: true
  });
  const [errors, setErrors] = useState({});

  // 1. Fetch Venues
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

  // 2. Fetch Branches
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

  // 3. Fetch Courts
  const fetchCourts = async (venueId, branchId) => {
    if (!venueId || !branchId) return;
    try {
      const res = await getOwnerCourts(venueId, branchId);
      const courtList = res.data || [];
      setCourts(courtList);
      if (courtList.length > 0) {
        setSelectedCourtId(courtList[0].court_id);
      } else {
        setSelectedCourtId('');
      }
    } catch (err) {
      console.error('Failed to fetch courts:', err);
    }
  };

  // 4. Fetch Schedules according to Scope
  const fetchSchedules = async () => {
    let targetId = selectedVenueId;
    if (scopeTargetType === 'BRANCH') targetId = selectedBranchId;
    if (scopeTargetType === 'COURT') targetId = selectedCourtId;

    if (!targetId) {
      setSchedules([]);
      return;
    }

    try {
      setLoading(true);
      const res = await getOwnerSchedules(scopeTargetType, targetId);
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch operating schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [scopeTargetType, selectedVenueId, selectedBranchId, selectedCourtId]);

  // Separate schedules into GENERAL and STUDENT lists
  const generalSchedules = useMemo(() => {
    return schedules.filter(s => (s.pricing_group || 'GENERAL') === 'GENERAL');
  }, [schedules]);

  const studentSchedules = useMemo(() => {
    return schedules.filter(s => s.pricing_group === 'STUDENT');
  }, [schedules]);

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

  // Open Create Modal prefilled for specific Pricing Group
  const handleOpenCreateModal = (group = 'GENERAL') => {
    setEditingSchedule(null);
    setForm({
      pricingGroup: group,
      selectedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      opening_time: '05:00',
      closing_time: '08:00',
      fixed_price: group === 'STUDENT' ? 30000 : 40000,
      walk_in_price: group === 'STUDENT' ? 40000 : 50000,
      base_hourly_price: group === 'STUDENT' ? 30000 : 40000,
      is_active: true
    });
    setErrors({});
    setModalOpen(true);
  };

  // Open Edit Modal prefilled with schedule values
  const handleOpenEditModal = (sched) => {
    setEditingSchedule(sched);

    let parsedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    if (sched.days_of_week) {
      try {
        const arr = JSON.parse(sched.days_of_week);
        if (Array.isArray(arr) && arr.length > 0) parsedDays = arr;
      } catch (e) {}
    }

    setForm({
      pricingGroup: sched.pricing_group || 'GENERAL',
      selectedDays: parsedDays,
      opening_time: (sched.opening_time || '05:00').substring(0, 5),
      closing_time: (sched.closing_time || '08:00').substring(0, 5),
      fixed_price: parseInt(sched.fixed_price || sched.base_hourly_price || 40000),
      walk_in_price: parseInt(sched.walk_in_price || sched.base_hourly_price || 50000),
      base_hourly_price: parseInt(sched.base_hourly_price || 40000),
      is_active: sched.is_active ?? true
    });
    setErrors({});
    setModalOpen(true);
  };

  // Shortcut helpers for Day selection
  const selectDaysShortcut = (type) => {
    if (type === 'WEEKDAY') {
      setForm(prev => ({ ...prev, selectedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] }));
    } else if (type === 'WEEKEND') {
      setForm(prev => ({ ...prev, selectedDays: ['SATURDAY', 'SUNDAY'] }));
    } else if (type === 'ALL') {
      setForm(prev => ({ ...prev, selectedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] }));
    } else if (type === 'NONE') {
      setForm(prev => ({ ...prev, selectedDays: [] }));
    }
  };

  const toggleDayCheck = (dayId) => {
    setForm(prev => {
      const exists = prev.selectedDays.includes(dayId);
      if (exists) {
        return { ...prev, selectedDays: prev.selectedDays.filter(d => d !== dayId) };
      } else {
        return { ...prev, selectedDays: [...prev.selectedDays, dayId] };
      }
    });
  };

  // Format Days for Table Display (e.g. "T2 - T6", "T7 - CN", "T2, T4, T6")
  const formatDaysDisplay = (sched) => {
    let daysArr = [];
    if (sched.days_of_week) {
      try {
        const parsed = JSON.parse(sched.days_of_week);
        if (Array.isArray(parsed) && parsed.length > 0) daysArr = parsed;
      } catch (e) {}
    }

    if (daysArr.length === 0) return sched.day_scope || 'Tất cả các ngày';

    if (daysArr.length === 7) return 'Tất cả các ngày (T2 - CN)';
    if (daysArr.length === 5 && !daysArr.includes('SATURDAY') && !daysArr.includes('SUNDAY')) return 'T2 - T6 (Ngày thường)';
    if (daysArr.length === 2 && daysArr.includes('SATURDAY') && daysArr.includes('SUNDAY')) return 'T7 - CN (Cuối tuần)';

    const labels = daysArr.map(d => {
      const match = DAY_OPTIONS.find(o => o.id === d);
      return match ? match.label : d;
    });
    return labels.join(', ');
  };

  const validate = () => {
    const errs = {};
    if (form.selectedDays.length === 0) {
      errs.days = 'Vui lòng chọn ít nhất một ngày áp dụng';
    }
    if (!form.fixed_price || form.fixed_price <= 0) {
      errs.fixed_price = 'Giá cố định phải lớn hơn 0';
    }
    if (!form.walk_in_price || form.walk_in_price <= 0) {
      errs.walk_in_price = 'Giá vãng lai phải lớn hơn 0';
    }
    if (form.opening_time >= form.closing_time) {
      errs.closing_time = 'Giờ đóng cửa phải sau giờ mở cửa';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    let targetId = selectedVenueId;
    if (scopeTargetType === 'BRANCH') targetId = selectedBranchId;
    if (scopeTargetType === 'COURT') targetId = selectedCourtId;

    if (!targetId) {
      setNoticeModal({
        open: true,
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn đối tượng áp dụng bảng giá (Cụm sân, Chi nhánh hoặc Sân con).',
        type: 'error'
      });
      return;
    }

    // Build day scope summary text
    let dayScopeStr = 'T2-T6';
    if (form.selectedDays.length === 7) dayScopeStr = 'Tất cả (T2-CN)';
    else if (form.selectedDays.length === 2 && form.selectedDays.includes('SATURDAY') && form.selectedDays.includes('SUNDAY')) dayScopeStr = 'T7-CN';
    else {
      dayScopeStr = form.selectedDays.map(d => DAY_OPTIONS.find(o => o.id === d)?.label).filter(Boolean).join(',');
    }

    const payload = {
      pricingGroup: form.pricingGroup,
      pricing_group: form.pricingGroup,
      day_scope: dayScopeStr,
      days: form.selectedDays,
      days_of_week: form.selectedDays,
      opening_time: form.opening_time.length === 5 ? `${form.opening_time}:00` : form.opening_time,
      closing_time: form.closing_time.length === 5 ? `${form.closing_time}:00` : form.closing_time,
      base_hourly_price: form.fixed_price,
      fixed_price: form.fixed_price,
      walk_in_price: form.walk_in_price,
      is_active: form.is_active,
      peak_price_rules: `Giá cố định: ${form.fixed_price.toLocaleString()}đ | Vãng lai: ${form.walk_in_price.toLocaleString()}đ`
    };

    try {
      setActionLoading(true);
      if (editingSchedule) {
        await updateOwnerSchedule(editingSchedule.schedule_id, payload);
        setNoticeModal({ open: true, title: 'Cập nhật bảng giá', message: 'Cập nhật khung giá thành công.', type: 'success' });
      } else {
        await createOwnerSchedule(scopeTargetType, targetId, payload);
        setNoticeModal({ open: true, title: 'Thiết lập bảng giá', message: 'Tạo mới khung giá thành công.', type: 'success' });
      }
      setModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      const isOverlap = err.response?.status === 409 || err.response?.data?.code === 'PRICE_RULE_OVERLAP';
      setNoticeModal({
        open: true,
        title: isOverlap ? 'Trùng lặp khung giờ' : 'Lỗi thiết lập',
        message: err.response?.data?.error?.message || err.response?.data?.message || 'Có một khung giá khác đang áp dụng trùng giờ cho đối tượng này.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (scheduleId) => {
    try {
      setActionLoading(true);
      await toggleOwnerScheduleStatus(scheduleId);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to toggle schedule status:', err);
      setNoticeModal({ open: true, title: 'Không thể thay đổi', message: err.response?.data?.message || 'Lỗi bật/tắt khung giá.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateSubmit = async (scheduleId) => {
    try {
      setActionLoading(true);
      await duplicateOwnerSchedule(scheduleId);
      setNoticeModal({ open: true, title: 'Nhân bản thành công', message: 'Đã sao chép khung giá mới thành công.', type: 'success' });
      fetchSchedules();
    } catch (err) {
      console.error('Failed to duplicate schedule:', err);
      setNoticeModal({ open: true, title: 'Lỗi nhân bản', message: err.response?.data?.message || 'Không thể nhân bản khung giá.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async (scheduleId) => {
    try {
      setActionLoading(true);
      await deleteOwnerSchedule(scheduleId);
      setNoticeModal({ open: true, title: 'Đã xóa bảng giá', message: 'Quy tắc bảng giá đã bị xóa.', type: 'info' });
      setDeleteConfirmId(null);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setNoticeModal({ open: true, title: 'Không thể xóa', message: err.response?.data?.message || 'Không thể xóa bảng giá.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper renderer for Pricing Table
  const renderPricingTable = (title, groupKey, items, icon, badgeColor) => (
    <Card padding="none" radius="2xl" className="border border-border-subtle-medium shadow-xs overflow-hidden space-y-0">
      {/* Table Header Section */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${badgeColor}-100 text-${badgeColor}-600`}>
            {icon}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              {title}
              <Badge variant={groupKey === 'STUDENT' ? 'info' : 'warning'} size="xs">
                {items.length} quy tắc
              </Badge>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {groupKey === 'STUDENT' ? 'Bảng giá ưu đãi dành riêng cho Học sinh - Sinh viên' : 'Bảng giá chuẩn áp dụng cho tất cả đối tượng khách hàng'}
            </p>
          </div>
        </div>

        <Button
          variant={groupKey === 'STUDENT' ? 'outline' : 'primary'}
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => handleOpenCreateModal(groupKey)}
        >
          Thêm khung giá {groupKey === 'STUDENT' ? 'HSSV' : 'Chung'}
        </Button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-subtle text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">
              <th className="py-3.5 px-5">Ngày áp dụng</th>
              <th className="py-3.5 px-5">Khung giờ</th>
              <th className="py-3.5 px-5 text-right">Giá Cố định / giờ</th>
              <th className="py-3.5 px-5 text-right">Giá Vãng lai / giờ</th>
              <th className="py-3.5 px-5 text-center">Trạng thái</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface text-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  Đang tải bảng giá từ hệ thống...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted space-y-1">
                  <p className="font-bold text-gray-800">Chưa có khung giá nào trong nhóm này</p>
                  <p className="text-xs text-text-muted">Bấm "+ Thêm khung giá" để thiết lập giá thuê cho {title.toLowerCase()}.</p>
                </td>
              </tr>
            ) : (
              items.map((s) => {
                const isActive = s.is_active ?? true;
                const fixedP = parseInt(s.fixed_price || s.base_hourly_price || 0);
                const walkP = parseInt(s.walk_in_price || s.base_hourly_price || 0);

                return (
                  <tr key={s.schedule_id} className={`hover:bg-surface-subtle/60 transition-colors ${!isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                    <td className="py-3.5 px-5 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-brand-orange shrink-0" />
                        <span>{formatDaysDisplay(s)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-mono font-bold text-gray-900">
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <Clock size={13} className="text-gray-500" />
                        {(s.opening_time || '05:00').substring(0, 5)} - {(s.closing_time || '08:00').substring(0, 5)}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right font-extrabold text-emerald-700 text-sm">
                      {fixedP > 0 ? `${fixedP.toLocaleString('vi-VN')}đ` : '---'}
                    </td>

                    <td className="py-3.5 px-5 text-right font-extrabold text-brand-orange text-sm">
                      {walkP > 0 ? `${walkP.toLocaleString('vi-VN')}đ` : '---'}
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s.schedule_id)}
                        className="inline-flex items-center gap-1 font-bold transition-all focus:outline-none"
                        title={isActive ? 'Bấm để Tắt khung giá' : 'Bấm để Bật khung giá'}
                      >
                        {isActive ? (
                          <Badge variant="success" size="xs" leftIcon={<ToggleRight size={14} />}>
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="xs" leftIcon={<ToggleLeft size={14} />}>
                            Vô hiệu
                          </Badge>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-gray-200 text-gray-700 transition-colors"
                          title="Sửa khung giá"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateSubmit(s.schedule_id)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Nhân bản khung giá"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(s.schedule_id)}
                          className="p-1.5 rounded-lg bg-surface-subtle hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Xóa khung giá"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <DollarSign className="text-brand-orange" size={26} />
            Quản lý Bảng Giá & Giờ Hoạt Động
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Cấu hình các bảng giá động linh hoạt cho Khách Thường và Học sinh - Sinh viên theo từng khung giờ và ngày trong tuần.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Eye size={16} />}
            onClick={() => setPreviewOpen(true)}
          >
            Xem trước tổng hợp
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={() => handleOpenCreateModal('GENERAL')}
          >
            Thêm khung giá mới
          </Button>
        </div>
      </div>

      {/* TARGET SCOPE & ENTITY SELECTION TOOLBAR */}
      <Card padding="md" radius="xl" className="border border-border-subtle-medium shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-900 block">1. Phạm vi áp dụng (Scope)</label>
            <select
              value={scopeTargetType}
              onChange={(e) => setScopeTargetType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange"
            >
              <option value="VENUE">🏬 Toàn bộ Cụm sân (VENUE)</option>
              <option value="BRANCH">📍 Theo Chi nhánh (BRANCH)</option>
              <option value="COURT">🏆 Theo Sân con (COURT)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-900 block">2. Cụm Sân Thể Thao *</label>
            <select
              value={selectedVenueId}
              onChange={handleVenueChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange"
            >
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name}
                </option>
              ))}
            </select>
          </div>

          {scopeTargetType !== 'VENUE' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-900 block">3. Chi Nhánh Trực Thuộc *</label>
              <select
                value={selectedBranchId}
                onChange={handleBranchChange}
                disabled={branches.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange disabled:opacity-50"
              >
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scopeTargetType === 'COURT' && (
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-900 block">4. Chọn Sân Con Cụ Thể *</label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                disabled={courts.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:outline-none focus:border-brand-orange disabled:opacity-50"
              >
                {courts.map((c) => (
                  <option key={c.court_id} value={c.court_id}>
                    🏆 {c.court_name} ({c.sport_category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 1: BẢNG GIÁ CHUNG (GENERAL) */}
      {renderPricingTable(
        'BẢNG GIÁ CHUNG',
        'GENERAL',
        generalSchedules,
        <Users size={20} />,
        'amber'
      )}

      {/* SECTION 2: BẢNG GIÁ HỌC SINH - SINH VIÊN (STUDENT) */}
      {renderPricingTable(
        'BẢNG GIÁ HỌC SINH - SINH VIÊN',
        'STUDENT',
        studentSchedules,
        <GraduationCap size={20} />,
        'blue'
      )}

      {/* CREATE / EDIT PRICING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle-medium rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingSchedule ? 'Cập nhật quy tắc bảng giá' : 'Thêm khung giá mới'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-text-muted hover:text-gray-900">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. PRICING GROUP SELECTOR */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-900 block">ĐỐI TƯỢNG *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricingGroup: 'GENERAL' })}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition-all text-xs ${
                      form.pricingGroup === 'GENERAL'
                        ? 'border-brand-orange bg-brand-orange/10 text-brand-orange shadow-xs'
                        : 'border-border-subtle-medium bg-surface text-gray-700 hover:bg-surface-subtle'
                    }`}
                  >
                    <Users size={16} />
                    <span>Giá Chung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricingGroup: 'STUDENT' })}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-bold transition-all text-xs ${
                      form.pricingGroup === 'STUDENT'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-border-subtle-medium bg-surface text-gray-700 hover:bg-surface-subtle'
                    }`}
                  >
                    <GraduationCap size={16} />
                    <span>Học sinh - Sinh viên</span>
                  </button>
                </div>
              </div>

              {/* 2. DAYS SELECTION CHECKBOXES & SHORTCUTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-900 block">NGÀY ÁP DỤNG *</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectDaysShortcut('WEEKDAY')}
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 font-semibold text-[10px] text-gray-700"
                    >
                      T2-T6
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDaysShortcut('WEEKEND')}
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 font-semibold text-[10px] text-gray-700"
                    >
                      T7-CN
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDaysShortcut('ALL')}
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 font-semibold text-[10px] text-gray-700"
                    >
                      Tất cả
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_OPTIONS.map((day) => {
                    const isChecked = form.selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDayCheck(day.id)}
                        className={`py-2 rounded-xl font-bold text-center border text-xs transition-all ${
                          isChecked
                            ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                            : 'bg-surface border-border-subtle-medium text-gray-700 hover:border-brand-orange/50'
                        }`}
                        title={day.name}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {errors.days && <p className="text-[11px] text-rose-600 mt-1">{errors.days}</p>}
              </div>

              {/* 3. TIME RANGE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Từ giờ *</label>
                  <input
                    type="time"
                    value={form.opening_time}
                    onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-semibold focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-900 block mb-1">Đến giờ *</label>
                  <input
                    type="time"
                    value={form.closing_time}
                    onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-semibold focus:outline-none focus:border-brand-orange"
                  />
                  {errors.closing_time && <p className="text-[11px] text-rose-600 mt-1">{errors.closing_time}</p>}
                </div>
              </div>

              {/* 4. FIXED PRICE & WALK-IN PRICE */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="fixed_price"
                  name="fixed_price"
                  type="number"
                  label="GIÁ CỐ ĐỊNH / GIỜ (VNĐ) *"
                  placeholder="VD: 40000"
                  value={form.fixed_price}
                  onChange={(e) => setForm({ ...form, fixed_price: parseFloat(e.target.value) || 0 })}
                  error={errors.fixed_price}
                  required
                />
                <Input
                  id="walk_in_price"
                  name="walk_in_price"
                  type="number"
                  label="GIÁ VÃNG LAI / GIỜ (VNĐ) *"
                  placeholder="VD: 50000"
                  value={form.walk_in_price}
                  onChange={(e) => setForm({ ...form, walk_in_price: parseFloat(e.target.value) || 0 })}
                  error={errors.walk_in_price}
                  required
                />
              </div>

              {/* 5. ACTIVE STATUS SWITCH */}
              <div className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl border border-border-subtle">
                <span className="font-bold text-gray-900">Kích hoạt quy tắc bảng giá này:</span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 accent-brand-orange cursor-pointer"
                />
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
                {actionLoading ? 'Đang lưu...' : (editingSchedule ? 'Cập nhật khung giá' : 'Lưu khung giá')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* PREVIEW PRICING MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle-medium rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Eye size={20} className="text-brand-orange" />
                Xem trước Bảng giá tổng hợp theo phân nhóm
              </h3>
              <button onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg text-text-muted hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2 text-brand-orange">
                  <Users size={16} /> 1. BẢNG GIÁ CHUNG ({generalSchedules.length} khung giá)
                </h4>
                {generalSchedules.length === 0 ? (
                  <p className="text-text-muted italic">Chưa có khung giá chung nào.</p>
                ) : (
                  <div className="space-y-2">
                    {generalSchedules.map((s) => (
                      <div key={s.schedule_id} className="p-3 rounded-xl border border-border-subtle bg-surface flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-900">{formatDaysDisplay(s)}</span>
                          <span className="ml-3 font-mono text-gray-600">{(s.opening_time || '05:00').substring(0, 5)} - {(s.closing_time || '08:00').substring(0, 5)}</span>
                        </div>
                        <div className="font-bold text-right space-x-3">
                          <span className="text-emerald-700">Cố định: {parseInt(s.fixed_price || s.base_hourly_price || 0).toLocaleString()}đ</span>
                          <span className="text-brand-orange">Vãng lai: {parseInt(s.walk_in_price || s.base_hourly_price || 0).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border-subtle">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2 text-blue-600">
                  <GraduationCap size={16} /> 2. BẢNG GIÁ HỌC SINH - SINH VIÊN ({studentSchedules.length} khung giá)
                </h4>
                {studentSchedules.length === 0 ? (
                  <p className="text-text-muted italic">Chưa có khung giá HSSV nào.</p>
                ) : (
                  <div className="space-y-2">
                    {studentSchedules.map((s) => (
                      <div key={s.schedule_id} className="p-3 rounded-xl border border-border-subtle bg-surface flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-900">{formatDaysDisplay(s)}</span>
                          <span className="ml-3 font-mono text-gray-600">{(s.opening_time || '05:00').substring(0, 5)} - {(s.closing_time || '08:00').substring(0, 5)}</span>
                        </div>
                        <div className="font-bold text-right space-x-3">
                          <span className="text-emerald-700">Cố định: {parseInt(s.fixed_price || s.base_hourly_price || 0).toLocaleString()}đ</span>
                          <span className="text-brand-orange">Vãng lai: {parseInt(s.walk_in_price || s.base_hourly_price || 0).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle text-right">
              <Button variant="primary" size="sm" onClick={() => setPreviewOpen(false)}>
                Đóng
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-border-subtle-medium">
            <h3 className="text-base font-bold text-gray-900">Xác nhận xóa khung giá</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa quy tắc bảng giá này không? Thao tác không thể hoàn tác.
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
