import { useState, useEffect } from 'react';
import { Building2, Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Eye, Edit2, Trash2, User, Phone, Mail, MapPin, ShieldCheck, Info } from 'lucide-react';
import { getAdminOwnerRegistrations, approveAdminOwnerRegistration, rejectAdminOwnerRegistration, updateAdminOwnerRegistration, deleteAdminOwnerRegistration } from '../../api/admin';

export default function AdminOwnerRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_type: 'Cơ sở tư nhân',
    representative_name: '',
    phone_number: '',
    email: '',
    street_address: '',
    ward: '',
    district: '',
    city_province: '',
    sport_categories: 'Cầu lông',
    estimated_courts: 1,
    description: '',
    status: 'PENDING',
    admin_note: ''
  });

  // Delete Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regToDelete, setRegToDelete] = useState(null);

  // System Notice Modal State
  const [noticeModal, setNoticeModal] = useState({ open: false, title: '', message: '', type: 'success' });

  const fetchRegistrations = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminOwnerRegistrations(params);
      setRegistrations(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to fetch admin owner registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations(1);
  }, [statusFilter]);

  const handleOpenApproveModal = () => {
    setApproveConfirmOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedReg) return;

    try {
      setActionLoading(true);
      await approveAdminOwnerRegistration(selectedReg.registration_id);
      setApproveConfirmOpen(false);
      setSelectedReg(null);
      setNoticeModal({
        open: true,
        title: 'Phê duyệt thành công',
        message: 'Đã phê duyệt hồ sơ đăng ký thành công! Vai trò tài khoản người dùng đã được nâng cấp chính thức thành Chủ cơ sở.',
        type: 'success'
      });
      fetchRegistrations(meta.page);
    } catch (err) {
      console.error('Failed to approve registration:', err);
      setApproveConfirmOpen(false);
      setNoticeModal({
        open: true,
        title: 'Phê duyệt thất bại',
        message: err.response?.data?.message || 'Không thể phê duyệt hồ sơ. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectNote('');
    setRejectError('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectNote.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }

    try {
      setActionLoading(true);
      await rejectAdminOwnerRegistration(selectedReg.registration_id, rejectNote.trim());
      setRejectModalOpen(false);
      setSelectedReg(null);
      setNoticeModal({
        open: true,
        title: 'Đã từ chối hồ sơ',
        message: 'Đã cập nhật trạng thái từ chối hồ sơ đăng ký kinh doanh và gửi thông báo phản hồi.',
        type: 'info'
      });
      fetchRegistrations(meta.page);
    } catch (err) {
      console.error('Failed to reject registration:', err);
      setNoticeModal({
        open: true,
        title: 'Thao tác thất bại',
        message: err.response?.data?.message || 'Không thể từ chối hồ sơ. Vui lòng thử lại.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEditModal = (reg) => {
    setEditForm({
      business_name: reg.business_name || '',
      business_type: reg.business_type || 'Cơ sở tư nhân',
      representative_name: reg.representative_name || '',
      phone_number: reg.phone_number || '',
      email: reg.email || '',
      street_address: reg.street_address || '',
      ward: reg.ward || '',
      district: reg.district || '',
      city_province: reg.city_province || '',
      sport_categories: reg.sport_categories || 'Cầu lông',
      estimated_courts: reg.estimated_courts || 1,
      description: reg.description || '',
      status: reg.status || 'PENDING',
      admin_note: reg.admin_note || ''
    });
    setSelectedReg(reg);
    setEditModalOpen(true);
  };

  // SUBMIT EDIT
  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;

    try {
      setActionLoading(true);
      await updateAdminOwnerRegistration(selectedReg.registration_id, editForm);
      setEditModalOpen(false);
      setSelectedReg(null);
      setNoticeModal({
        open: true,
        title: 'Cập nhật thành công',
        message: 'Đã lưu các thay đổi cho hồ sơ đăng ký kinh doanh.',
        type: 'success'
      });
      fetchRegistrations(meta.page);
    } catch (err) {
      console.error('Failed to update registration:', err);
      setNoticeModal({
        open: true,
        title: 'Cập nhật thất bại',
        message: err.response?.data?.message || 'Không thể cập nhật hồ sơ.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // OPEN DELETE MODAL
  const handleOpenDeleteModal = (reg) => {
    setRegToDelete(reg);
    setDeleteConfirmOpen(true);
  };

  // SUBMIT DELETE
  const handleConfirmDelete = async () => {
    if (!regToDelete) return;

    try {
      setActionLoading(true);
      await deleteAdminOwnerRegistration(regToDelete.registration_id);
      setDeleteConfirmOpen(false);
      setRegToDelete(null);
      if (selectedReg?.registration_id === regToDelete.registration_id) {
        setSelectedReg(null);
      }
      setNoticeModal({
        open: true,
        title: 'Đã xóa hồ sơ',
        message: 'Hồ sơ đăng ký chủ sân đã được xóa khỏi hệ thống.',
        type: 'info'
      });
      fetchRegistrations(meta.page);
    } catch (err) {
      console.error('Failed to delete registration:', err);
      setNoticeModal({
        open: true,
        title: 'Xóa thất bại',
        message: err.response?.data?.message || 'Không thể xóa hồ sơ.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPageNumbers = () => {
    const totalPages = Math.ceil(meta.total / meta.limit) || 1;
    const current = meta.page;
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 2) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (current >= totalPages - 1) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const filtered = registrations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.business_name && r.business_name.toLowerCase().includes(q)) ||
      (r.representative_name && r.representative_name.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.phone_number && r.phone_number.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Hồ Sơ Đăng Ký Chủ Sân</h1>
          <p className="text-xs text-slate-400 mt-1">Xét duyệt & quản lý chỉnh sửa hồ sơ đăng ký kinh doanh.</p>
        </div>
        <button
          onClick={() => fetchRegistrations(meta.page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên cơ sở, tên người nộp, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="PENDING">🟡 Chờ xét duyệt</option>
            <option value="APPROVED">🟢 Đã phê duyệt</option>
            <option value="REJECTED">🔴 Đã từ chối</option>
            <option value="CANCELLED">⚪ Đã hủy</option>
            <option value="">Tất cả </option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <th className="py-3.5 px-4">Tên Cơ Sở Kinh Doanh</th>
                <th className="py-3.5 px-4">Người Đại Diện</th>
                <th className="py-3.5 px-4">Email / SĐT</th>
                <th className="py-3.5 px-4">Địa Chỉ Cơ Sở</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Ngày Nộp</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Đang nạp danh sách hồ sơ từ DB...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy hồ sơ đăng ký nào.
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => {
                  const dateVal = reg.created_at || reg.createdAt;
                  const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString('vi-VN') : 'Mới cập nhật';

                  return (
                    <tr key={reg.registration_id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-700/30 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{reg.business_name}</p>
                            <span className="text-[10px] text-slate-400">{reg.business_type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{reg.representative_name}</td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-300 font-medium">{reg.email}</p>
                        <p className="text-[11px] text-slate-400">{reg.phone_number}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {reg.street_address}, {reg.ward}, {reg.district}, {reg.city_province}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                            reg.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : reg.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : reg.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">{formattedDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReg(reg)}
                            className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold border border-indigo-500/40 transition-colors flex items-center gap-1"
                            title="Xem chi tiết"
                          >
                            <Eye size={12} /> 
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(reg)}
                            className="p-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition-colors"
                            title="Sửa hồ sơ"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(reg)}
                            className="p-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 transition-colors"
                            title="Xóa hồ sơ"
                          >
                            <Trash2 size={12} />
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

        {/* NUMERIC PAGINATION */}
        <div className="p-4 border-t border-slate-700/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Hiển thị trang <span className="font-bold text-white">{meta.page}</span> / <span className="font-bold text-white">{Math.ceil(meta.total / meta.limit) || 1}</span> (Tổng <span className="font-bold text-indigo-400">{meta.total}</span> hồ sơ)
          </p>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Previous Page Button */}
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchRegistrations(meta.page - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Trang trước
            </button>

            {/* Numeric Page Buttons */}
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-500 font-bold select-none">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => fetchRegistrations(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    meta.page === p
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {/* Next Page Button */}
            <button
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchRegistrations(meta.page + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL REVIEW MODAL CARD */}
      {selectedReg && !editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedReg.business_name}</h3>
                <p className="text-xs text-slate-400">Mã hồ sơ: {selectedReg.registration_id}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {selectedReg.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <p className="font-bold text-indigo-400">👤 THÔNG TIN NGƯỜI ĐẠI DIỆN NỘP HỒ SƠ</p>
                <p><span className="text-slate-500">Họ và tên:</span> <strong className="text-white">{selectedReg.representative_name}</strong></p>
                <p><span className="text-slate-500">Email:</span> <strong className="text-slate-200">{selectedReg.email}</strong></p>
                <p><span className="text-slate-500">Số điện thoại:</span> <strong className="text-slate-200">{selectedReg.phone_number}</strong></p>
                <p><span className="text-slate-500">Tài khoản User ID:</span> <span className="font-mono text-slate-400">{selectedReg.user_id}</span></p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <p className="font-bold text-amber-400">🏬 THÔNG TIN CƠ SỞ KINH DOANH</p>
                <p><span className="text-slate-500">Loại hình cơ sở:</span> <strong className="text-slate-200">{selectedReg.business_type}</strong></p>
                <p><span className="text-slate-500">Địa chỉ kinh doanh:</span> <strong className="text-slate-200">{selectedReg.street_address}, {selectedReg.ward}, {selectedReg.district}, {selectedReg.city_province}</strong></p>
                <p><span className="text-slate-500">Bộ môn thể thao:</span> <strong className="text-slate-200">{selectedReg.sport_categories}</strong></p>
                <p><span className="text-slate-500">Số sân dự kiến:</span> <strong className="text-slate-200">{selectedReg.estimated_courts} sân</strong></p>
                {selectedReg.description && (
                  <p><span className="text-slate-500">Mô tả cơ sở:</span> <span className="text-slate-300 italic">"{selectedReg.description}"</span></p>
                )}
              </div>

              {selectedReg.admin_note && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300">
                  <p className="font-bold">Ghi chú từ chối của Admin:</p>
                  <p className="italic mt-1">"{selectedReg.admin_note}"</p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedReg(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Đóng
                </button>
                <button
                  onClick={() => handleOpenEditModal(selectedReg)}
                  className="px-3.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-1"
                >
                  <Edit2 size={13} /> Sửa hồ sơ
                </button>
                <button
                  onClick={() => handleOpenDeleteModal(selectedReg)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1"
                >
                  <Trash2 size={13} /> Xóa hồ sơ
                </button>
              </div>

              {selectedReg.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={handleOpenRejectModal}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                  >
                    Từ chối
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={handleOpenApproveModal}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    Phê duyệt
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT REGISTRATION MODAL FORM */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <form onSubmit={handleConfirmEdit} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 size={18} className="text-amber-400" />
                Chỉnh Sửa Hồ Sơ Đăng Ký 
              </h3>
              <span className="text-xs text-slate-400 font-mono">ID: {selectedReg?.registration_id}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Tên Cơ Sở Kinh Doanh *</label>
                  <input
                    type="text"
                    required
                    value={editForm.business_name}
                    onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Loại Hình Cơ Sở *</label>
                  <input
                    type="text"
                    required
                    value={editForm.business_type}
                    onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Người Đại Diện *</label>
                  <input
                    type="text"
                    required
                    value={editForm.representative_name}
                    onChange={(e) => setEditForm({ ...editForm, representative_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">SĐT *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Số Nhà, Tên Đường *</label>
                <input
                  type="text"
                  required
                  value={editForm.street_address}
                  onChange={(e) => setEditForm({ ...editForm, street_address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Phường / Xã *</label>
                  <input
                    type="text"
                    required
                    value={editForm.ward}
                    onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Quận / Huyện *</label>
                  <input
                    type="text"
                    required
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Tỉnh / Thành Phố *</label>
                  <input
                    type="text"
                    required
                    value={editForm.city_province}
                    onChange={(e) => setEditForm({ ...editForm, city_province: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Bộ Môn Thể Thao</label>
                  <input
                    type="text"
                    value={editForm.sport_categories}
                    onChange={(e) => setEditForm({ ...editForm, sport_categories: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Số Sân Dự Kiến</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.estimated_courts}
                    onChange={(e) => setEditForm({ ...editForm, estimated_courts: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Trạng Thái Hồ Sơ</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PENDING">🟡 PENDING (Chờ xét duyệt)</option>
                    <option value="APPROVED">🟢 APPROVED (Đã duyệt nâng vai trò Chủ cơ sở)</option>
                    <option value="REJECTED">🔴 REJECTED (Đã từ chối)</option>
                    <option value="CANCELLED">⚪ CANCELLED (Đã hủy)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Mô Tả Cơ Sở Kinh Doanh</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Ghi Chú Phản Hồi Từ Admin</label>
                <input
                  type="text"
                  value={editForm.admin_note}
                  onChange={(e) => setEditForm({ ...editForm, admin_note: e.target.value })}
                  placeholder="Ghi chú lý do nếu từ chối hoặc thông tin bổ sung..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL CARD */}
      {deleteConfirmOpen && regToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-bold">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác nhận xóa hồ sơ đăng ký</h3>
                <p className="text-[11px] text-rose-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <p><span className="text-slate-500">Tên cơ sở:</span> <strong className="text-white">{regToDelete.business_name}</strong></p>
              <p><span className="text-slate-500">Người nộp:</span> <strong className="text-white">{regToDelete.representative_name}</strong> ({regToDelete.email})</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ đăng ký kinh doanh này khỏi hệ thống?
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                disabled={actionLoading}
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                {actionLoading ? 'Đang xóa...' : '🗑️ Xác nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL CONFIRMATION MODAL CARD */}
      {approveConfirmOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác nhận phê duyệt hồ sơ</h3>
                <p className="text-[11px] text-emerald-400">Thao tác nâng cấp vai trò người dùng</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <p><span className="text-slate-500">Tên cơ sở:</span> <strong className="text-white">{selectedReg.business_name}</strong></p>
              <p><span className="text-slate-500">Người đại diện:</span> <strong className="text-white">{selectedReg.representative_name}</strong> ({selectedReg.email})</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tài khoản người dùng sẽ được chuyển đổi vai trò chính thức từ <strong className="text-amber-400">Khách hàng</strong> thành <strong className="text-emerald-400">Chủ cơ sở</strong> và được cấp quyền truy cập hệ thống Owner Portal. Bạn có chắc chắn muốn duyệt?
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                disabled={actionLoading}
                onClick={() => setApproveConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
              >
                {actionLoading ? 'Đang duyệt...' : 'Xác nhận Phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL CARD */}
      {rejectModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-bold">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Từ chối hồ sơ đăng ký</h3>
                <p className="text-[11px] text-rose-400">Nhập lý do phản hồi cho người nộp</p>
              </div>
            </div>

            {rejectError && (
              <p className="text-xs text-rose-400 font-bold bg-rose-950/50 p-2.5 rounded-lg border border-rose-800">
                ⚠️ {rejectError}
              </p>
            )}

            <textarea
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="VD: Địa chỉ cơ sở chưa chính xác, thiếu thông tin chứng nhận..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                disabled={actionLoading}
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Hủy
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {actionLoading ? 'Đang gửi...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM NOTICE CARD MODAL */}
      {noticeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold shadow-md">
              {noticeModal.type === 'success' ? (
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
              ) : noticeModal.type === 'error' ? (
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                  <XCircle size={28} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                  <Info size={28} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{noticeModal.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{noticeModal.message}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Đóng thông báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
