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
  AlertCircle,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Zap,
  Users
} from 'lucide-react';
import { 
  getOwnerBookings, 
  approveBooking, 
  rejectBooking,
  getOwnerVenues,
  getOwnerPosts,
  createOwnerPost,
  updateOwnerPost,
  deleteOwnerPost
} from '../api/owner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import PaymentProofViewer from '../components/domain/PaymentProofViewer';
import RejectionModal from '../components/domain/RejectionModal';
import EventCourtModal from '../components/domain/EventCourtModal';

export default function OwnerBookings() {
  // Main Tab: 'BOOKINGS' (Đơn đặt sân) or 'EVENT_COURTS' (Sân sự kiện)
  const [mainTab, setMainTab] = useState('BOOKINGS');

  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search state for Bookings
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Event Courts State
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('ALL');
  const [eventCourts, setEventCourts] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Event Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);

  // Modals state
  const [selectedProofBooking, setSelectedProofBooking] = useState(null);
  const [selectedRejectBooking, setSelectedRejectBooking] = useState(null);
  const [confirmApproveBooking, setConfirmApproveBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Owner Venues & Event Courts
  const fetchEventCourts = useCallback(async () => {
    setLoadingEvents(true);
    try {
      let vList = venues;
      if (vList.length === 0) {
        const vRes = await getOwnerVenues();
        vList = vRes?.data || vRes || [];
        setVenues(vList);
      }

      let allEvents = [];
      if (selectedVenueId === 'ALL') {
        for (const v of vList) {
          const vId = v.venue_id || v.id;
          try {
            const pRes = await getOwnerPosts(vId, { content_type: 'EVENT' });
            const pList = pRes?.data || pRes || [];
            allEvents = [...allEvents, ...pList];
          } catch (_) {}
        }
      } else {
        const pRes = await getOwnerPosts(selectedVenueId, { content_type: 'EVENT' });
        allEvents = pRes?.data || pRes || [];
      }

      setEventCourts(allEvents);
    } catch (err) {
      console.error('Error fetching event courts:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedVenueId, venues]);

  useEffect(() => {
    if (mainTab === 'EVENT_COURTS') {
      fetchEventCourts();
    }
  }, [mainTab, fetchEventCourts]);

  const handleSaveEventCourt = async (payload, editingId) => {
    if (editingId) {
      await updateOwnerPost(editingId, payload);
      showToast('Cập nhật sân sự kiện thành công!');
    } else {
      await createOwnerPost(payload.venue_id, payload);
      showToast('Tạo sân sự kiện mới thành công!');
    }
    fetchEventCourts();
  };

  const handleDeleteEventCourt = async (postId) => {
    try {
      setActionLoading(true);
      await deleteOwnerPost(postId);
      showToast('Đã xóa sân sự kiện!');
      setDeleteConfirmEvent(null);
      fetchEventCourts();
    } catch (err) {
      showToast('⚠️ ' + (err.message || 'Lỗi khi xóa sân sự kiện'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleEventStatus = async (ev) => {
    try {
      const newStatus = ev.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
      await updateOwnerPost(ev.id || ev.post_id, { status: newStatus });
      showToast(newStatus === 'PUBLISHED' ? 'Đã mở bán vé sự kiện!' : 'Đã đóng vé sự kiện!');
      fetchEventCourts();
    } catch (err) {
      showToast('⚠️ Lỗi thay đổi trạng thái bán vé');
    }
  };

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
            Quản lý đặt sân & Sân sự kiện
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Theo dõi đơn đặt sân cá nhân và quản lý các suất xé vé giao lưu ghép sân (Vé Social) cho chi nhánh.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => {
            if (mainTab === 'BOOKINGS') fetchBookings();
            else fetchEventCourts();
          }}
        >
          Làm mới
        </Button>
      </div>

      {/* MAIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <button
          type="button"
          onClick={() => setMainTab('BOOKINGS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mainTab === 'BOOKINGS'
              ? 'bg-brand-orange text-white shadow-xs'
              : 'bg-surface text-gray-700 hover:bg-surface-subtle border border-border-subtle-medium'
          }`}
        >
          <ClipboardList size={18} />
          <span>Đơn đặt sân cá nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('EVENT_COURTS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mainTab === 'EVENT_COURTS'
              ? 'bg-brand-orange text-white shadow-xs'
              : 'bg-surface text-gray-700 hover:bg-surface-subtle border border-border-subtle-medium'
          }`}
        >
          <Sparkles size={18} />
          <span>Sân sự kiện / Vé Social</span>
        </button>
      </div>

      {/* TAB 1: ĐƠN ĐẶT SÂN CÁ NHÂN */}
      {mainTab === 'BOOKINGS' && (
        <>
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
                              {custPhone && <p className="text-[11px] text-text-muted">{custPhone}</p>}
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-gray-900">{courtName}</p>
                              <p className="text-[11px] text-text-muted truncate max-w-[150px]">{venueName}</p>
                            </td>

                            <td className="py-3.5 px-4 text-gray-700 font-medium">
                              <p>{b.booking_date}</p>
                              <p className="text-[11px] text-text-muted">{b.start_time} - {b.end_time}</p>
                            </td>

                            <td className="py-3.5 px-4 text-right font-extrabold text-brand-orange">
                              {priceFormatted}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {b.payment_proof_url ? (
                                <button
                                  onClick={() => setSelectedProofBooking(b)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-primary hover:underline bg-accent-primary/10 px-2.5 py-1 rounded-full transition-colors"
                                >
                                  <FileImage size={12} />
                                  Minh chứng
                                </button>
                              ) : (
                                <span className="text-[11px] text-text-muted">Chưa có MC</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {statusBadge}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {status === 'WAITING_OWNER_CONFIRMATION' && (
                                  <>
                                    <button
                                      onClick={() => setConfirmApproveBooking(b)}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Duyệt đơn"
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => setSelectedRejectBooking(b)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Từ chối đơn"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                                <Link to={`/owner/bookings/${b.booking_id}`}>
                                  <button className="p-1.5 text-text-muted hover:text-gray-900 hover:bg-surface-subtle rounded-lg transition-colors" title="Xem chi tiết">
                                    <Eye size={16} />
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

                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-border-subtle">
                  {bookings.map((b) => (
                    <div key={b.booking_id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-gray-900">#{b.booking_id?.substring(0, 8)}</span>
                          <h4 className="font-bold text-sm text-gray-900 mt-0.5">{b.customer?.full_name || 'Khách đặt sân'}</h4>
                        </div>
                        <Badge variant="info" size="xs">{b.booking_status}</Badge>
                      </div>

                      <div className="text-xs text-text-muted space-y-1 bg-surface-subtle p-2.5 rounded-xl">
                        <p><strong>Sân:</strong> {b.court?.court_name}</p>
                        <p><strong>Thời gian:</strong> {b.booking_date} ({b.start_time} - {b.end_time})</p>
                        <p><strong>Tổng tiền:</strong> <span className="text-brand-orange font-bold">{b.total_amount ? `${parseFloat(b.total_amount).toLocaleString('vi-VN')}đ` : '0đ'}</span></p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {b.payment_proof_url && (
                          <button
                            onClick={() => setSelectedProofBooking(b)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-accent-primary"
                          >
                            <FileImage size={14} /> Minh chứng
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
        </>
      )}

      {/* TAB 2: SÂN SỰ KIỆN / VÉ SOCIAL */}
      {mainTab === 'EVENT_COURTS' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border-subtle-medium shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="p-2.5 rounded-xl border border-border-subtle-medium bg-surface text-xs font-semibold text-gray-900 focus:outline-none"
              >
                <option value="ALL">Tất cả chi nhánh sân</option>
                {venues.map((v) => (
                  <option key={v.venue_id || v.id} value={v.venue_id || v.id}>
                    {v.venue_name || v.name}
                  </option>
                ))}
              </select>

              <div className="flex-1 sm:w-64">
                <Input
                  placeholder="Tìm tên sự kiện, trình độ..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  leftIcon={<Search size={15} />}
                  size="sm"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="bg-accent-primary hover:bg-emerald-600 font-bold w-full sm:w-auto text-xs"
            >
              Tạo sân sự kiện mới
            </Button>
          </div>

          {/* Event Cards Grid */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="200px" radius="xl" />
              ))}
            </div>
          ) : eventCourts.filter(e => !eventSearchQuery || (e.title || e.content || '').toLowerCase().includes(eventSearchQuery.toLowerCase())).length === 0 ? (
            <Card padding="xl" radius="2xl" className="text-center my-8 bg-surface">
              <div className="w-16 h-16 rounded-2xl bg-surface-subtle text-text-muted flex items-center justify-center mx-auto mb-3">
                <Sparkles size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-800">Chưa có sân sự kiện / vé Social nào</h3>
              <p className="text-xs text-text-muted mt-1 mb-4">
                Nhấn vào nút bên dưới để tạo các suất xé vé giao lưu ghép sân hiển thị cho người chơi trên ứng dụng.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="bg-accent-primary hover:bg-emerald-600 font-bold text-xs"
              >
                Tạo sân sự kiện đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventCourts
                .filter(e => !eventSearchQuery || (e.title || e.content || '').toLowerCase().includes(eventSearchQuery.toLowerCase()))
                .map((rawEv) => {
                  let meta = {};
                  if (rawEv.excerpt) {
                    try {
                      meta = typeof rawEv.excerpt === 'string' && rawEv.excerpt.startsWith('{') ? JSON.parse(rawEv.excerpt) : {};
                    } catch (_) {}
                  }

                  const ev = {
                    ...rawEv,
                    ...meta,
                    play_date: rawEv.play_date || meta.play_date || (rawEv.start_at ? rawEv.start_at.split('T')[0] : ''),
                    start_time: rawEv.start_time || meta.start_time || (rawEv.start_at ? rawEv.start_at.split('T')[1]?.substring(0, 5) : ''),
                    end_time: rawEv.end_time || meta.end_time || (rawEv.end_at ? rawEv.end_at.split('T')[1]?.substring(0, 5) : ''),
                    court_name: rawEv.court_name || meta.court_name || rawEv.location || 'Sân sự kiện',
                    skill_level: rawEv.skill_level || meta.skill_level || rawEv.discount_info || '',
                    ticket_price: (rawEv.ticket_price !== undefined && rawEv.ticket_price !== null) ? rawEv.ticket_price : ((meta.ticket_price !== undefined && meta.ticket_price !== null) ? meta.ticket_price : (rawEv.fee_amount || 0)),
                    max_participants: rawEv.max_participants || meta.max_participants || 8,
                    joined_count: (rawEv.joined_count !== undefined && rawEv.joined_count !== null) ? Number(rawEv.joined_count) : (meta.joined_count !== undefined ? Number(meta.joined_count) : 0)
                  };

                  const isLive = ev.status === 'PUBLISHED';
                  const remainingSlots = Math.max(0, (ev.max_participants || 8) - (ev.joined_count || 0));

                  return (
                    <Card
                      key={ev.id || ev.post_id}
                      radius="xl"
                      padding="lg"
                      className="border border-border-subtle-medium hover:border-accent-primary/50 transition-all space-y-3 bg-surface relative"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isLive ? (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                              LIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600">
                              ĐÃ ĐÓNG VÉ
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">
                            🎫 Xé vé
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-text-muted">
                          #{ev.code || (ev.id || ev.post_id)?.slice(0, 6) || 'EVENT'}
                        </span>
                      </div>

                      {/* Event Title & Info */}
                      <div>
                        <h4 className="font-bold text-gray-900 text-base leading-snug">
                          {ev.title || ev.content || 'Giao lưu ghép sân'}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
                          {ev.skill_level && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                              Trình: {ev.skill_level}
                            </span>
                          )}
                          {ev.court_name && (
                            <span className="font-semibold text-gray-700">
                              🗺️ {ev.court_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date & Time & Price */}
                      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs">
                        <div className="space-y-0.5 text-text-muted">
                          {(ev.start_time || ev.end_time) && (
                            <div className="flex items-center gap-1 text-gray-800 font-medium">
                              <Clock size={13} className="text-brand-orange" />
                              <span>{ev.start_time}{ev.end_time ? ` - ${ev.end_time}` : ''}</span>
                            </div>
                          )}
                          {ev.play_date && (
                            <div className="flex items-center gap-1">
                              <Calendar size={13} />
                              <span>{ev.play_date}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold text-brand-orange">
                            {Number(ev.ticket_price).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="block text-[10px] text-text-muted">/ vé</span>
                        </div>
                      </div>

                      {/* Slots Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-text-muted">
                          <span>{ev.joined_count}/{ev.max_participants} người tham gia</span>
                          <span className="font-semibold text-emerald-600">Còn {remainingSlots} chỗ</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-accent-primary h-full rounded-full"
                            style={{
                              width: `${Math.min(100, ((ev.joined_count / (ev.max_participants || 1)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 text-xs">
                        <button
                          onClick={() => handleToggleEventStatus(ev)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                            isLive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isLive ? 'Đóng vé' : 'Mở bán vé'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingEvent(ev);
                              setIsEventModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-accent-primary rounded-lg hover:bg-surface-subtle transition-colors"
                            title="Sửa sự kiện"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmEvent(ev)}
                            className="p-1.5 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Xóa sự kiện"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* EVENT COURT MODAL (CREATE / EDIT) */}
      <EventCourtModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEventCourt}
        eventData={editingEvent}
        venues={venues}
      />

      {/* CONFIRM DELETE EVENT DIALOG */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-subtle-medium shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 size={24} />
              <h3 className="font-bold text-gray-900 text-base">Xác nhận xóa sân sự kiện</h3>
            </div>
            <p className="text-gray-700">
              Bạn có chắc chắn muốn xóa sân sự kiện <strong>"{deleteConfirmEvent.title || deleteConfirmEvent.content}"</strong> không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmEvent(null)} disabled={actionLoading}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                loading={actionLoading}
                onClick={() => handleDeleteEventCourt(deleteConfirmEvent.id || deleteConfirmEvent.post_id)}
              >
                Xóa sự kiện
              </Button>
            </div>
          </div>
        </div>
      )}

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
