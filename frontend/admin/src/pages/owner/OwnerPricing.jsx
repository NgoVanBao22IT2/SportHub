import { useState, useEffect } from 'react';
import { DollarSign, Clock, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Calendar, Tag } from 'lucide-react';
import { getOwnerVenues, getOwnerBranches, getOwnerCourts, getOwnerSchedules, createOwnerSchedule, deleteOwnerSchedule } from '../../api/owner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';

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
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });

  const [form, setForm] = useState({
    day_scope: 'Monday-Sunday',
    opening_time: '06:00',
    closing_time: '23:00',
    base_hourly_price: 100000,
    peak_price_rules: 'Khung giờ vàng 17:00 - 22:00: 140.000 đ/giờ'
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
    setForm({
      day_scope: 'Monday-Sunday',
      opening_time: '06:00',
      closing_time: '23:00',
      base_hourly_price: 100000,
      peak_price_rules: 'Giờ vàng 17:00 - 22:00: +40.000 đ'
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.base_hourly_price || form.base_hourly_price <= 0) {
      errs.base_hourly_price = 'Vui lòng nhập đơn giá thuê hợp lệ';
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

    try {
      setActionLoading(true);
      const payload = {
        ...form,
        venueId: selectedVenueId,
        branchId: selectedBranchId
      };
      await createOwnerSchedule(scopeTargetType, targetId, payload);
      setNoticeModal({ open: true, title: 'Thiết lập bảng giá', message: 'Bảng giá và giờ hoạt động đã được lưu thành công.', type: 'success' });
      setModalOpen(false);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setNoticeModal({
        open: true,
        title: 'Lỗi thiết lập',
        message: err.response?.data?.message || 'Không thể lưu bảng giá.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteSubmit = async (scheduleId) => {
    try {
      setActionLoading(true);
      await deleteOwnerSchedule(scheduleId);
      setNoticeModal({ open: true, title: 'Đã xóa bảng giá', message: 'Quy tắc giờ hoạt động & bảng giá đã bị xóa.', type: 'info' });
      setDeleteConfirmId(null);
      fetchSchedules();
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setNoticeModal({ open: true, title: 'Không thể xóa', message: err.response?.data?.message || 'Không thể xóa bảng giá.', type: 'error' });
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
            <DollarSign className="text-brand-orange" size={26} />
            Quản lý Bảng Giá & Giờ Hoạt Động
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Cấu hình khung giờ mở/đóng cửa và giá thuê sân theo mốc giờ cho từng cụm sân, chi nhánh hoặc sân con.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={handleOpenCreateModal}
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

      {/* SCHEDULE & PRICING TABLE */}
      <Card padding="none" radius="xl" className="border border-border-subtle-medium shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle-medium">
                <th className="py-3.5 px-4">Ngày Áp Dụng</th>
                <th className="py-3.5 px-4">Giờ Mở Cửa</th>
                <th className="py-3.5 px-4">Giờ Đóng Cửa</th>
                <th className="py-3.5 px-4">Giá Cơ Sở / Giờ</th>
                <th className="py-3.5 px-4">Ghi Chú Khung Giờ Vàng</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Đang nạp bảng giá từ MySQL...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Chưa có bảng giá được thiết lập cho phạm vi này. Bấm "Thêm khung giá mới".
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.schedule_id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-brand-orange shrink-0" />
                        <span>{s.day_scope}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">{s.opening_time}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-700">{s.closing_time}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {parseInt(s.base_hourly_price || 0).toLocaleString('vi-VN')} đ/h
                    </td>
                    <td className="py-3.5 px-4 text-text-muted italic">{s.peak_price_rules || 'Không áp dụng'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteConfirmId(s.schedule_id)}
                        className="p-1.5 rounded-lg bg-surface-subtle hover:bg-rose-50 text-rose-600 transition-colors"
                        title="Xóa quy tắc bảng giá"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE PRICING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs">
          <form onSubmit={handleSubmit} className="bg-surface border border-border-subtle-medium rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-border-subtle pb-3">
              Thiết lập khung giá & giờ hoạt động mới
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">Ngày áp dụng *</label>
                <select
                  value={form.day_scope}
                  onChange={(e) => setForm({ ...form, day_scope: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                >
                  <option value="Monday-Sunday">Tất cả các ngày (Thứ 2 - Chủ Nhật)</option>
                  <option value="Weekday">Ngày thường (Thứ 2 - Thứ 6)</option>
                  <option value="Weekend">Cuối tuần (Thứ 7 - Chủ Nhật)</option>
                  <option value="Monday">Thứ Hai</option>
                  <option value="Tuesday">Thứ Ba</option>
                  <option value="Wednesday">Thứ Tư</option>
                  <option value="Thursday">Thứ Năm</option>
                  <option value="Friday">Thứ Sáu</option>
                  <option value="Saturday">Thứ Bảy</option>
                  <option value="Sunday">Chủ Nhật</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">Giờ mở cửa *</label>
                  <input
                    type="time"
                    value={form.opening_time}
                    onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">Giờ đóng cửa *</label>
                  <input
                    type="time"
                    value={form.closing_time}
                    onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <Input
                id="base_hourly_price"
                name="base_hourly_price"
                type="number"
                label="Giá thuê cơ sở / giờ (VNĐ) *"
                placeholder="VD: 100000"
                value={form.base_hourly_price}
                onChange={(e) => setForm({ ...form, base_hourly_price: e.target.value })}
                error={errors.base_hourly_price}
                required
              />

              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">Quy tắc phụ thu khung giờ vàng</label>
                <input
                  type="text"
                  placeholder="VD: Giờ vàng 17:00-22:00: 140.000 đ"
                  value={form.peak_price_rules}
                  onChange={(e) => setForm({ ...form, peak_price_rules: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-sm font-medium focus:outline-none focus:border-brand-orange"
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
                {actionLoading ? 'Đang lưu...' : 'Lưu bảng giá'}
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
            <h3 className="text-base font-bold text-gray-900">Xác nhận xóa bảng giá</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa quy tắc bảng giá này? Thao tác này không thể hoàn tác.
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
