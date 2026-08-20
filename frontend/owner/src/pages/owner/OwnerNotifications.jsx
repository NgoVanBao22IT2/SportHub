import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  RefreshCw,
  CreditCard,
  Calendar,
  Star,
  Building2,
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  getOwnerNotifications,
  markOwnerNotificationAsRead,
  markAllOwnerNotificationsAsRead,
  deleteOwnerNotification
} from '../../api/owner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';

export default function OwnerNotifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [readFilter, setReadFilter] = useState('ALL'); // 'ALL', 'false', 'true'
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [toastMessage, setToastMessage] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerNotifications({
        page: meta.page,
        limit: meta.limit,
        isRead: readFilter === 'ALL' ? undefined : readFilter,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        search: activeSearch
      });

      if (res && res.data) {
        setNotifications(res.data);
        if (res.unreadCount !== undefined) setUnreadCount(res.unreadCount);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error fetching owner notifications:', err);
      setError(err.response?.data?.error?.message || err.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, readFilter, typeFilter, activeSearch]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setMeta((m) => ({ ...m, page: 1 }));
    setActiveSearch(searchQuery);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkRead = async (notifId) => {
    try {
      await markOwnerNotificationAsRead(notifId);
      showToast('Đã đánh dấu thông báo là đã đọc.');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllOwnerNotificationsAsRead();
      showToast('Đã đánh dấu tất cả thông báo là đã đọc!');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteSubmit = async (notifId) => {
    try {
      await deleteOwnerNotification(notifId);
      showToast('Đã xóa thông báo thành công.');
      setDeleteConfirmId(null);
      fetchNotifications();
    } catch (err) {
      showToast('⚠️ ' + (err.response?.data?.error?.message || err.message || 'Lỗi khi xóa thông báo'));
    }
  };

  const handleNavigateEntity = (notif) => {
    if (!notif.is_read) {
      markOwnerNotificationAsRead(notif.notification_id).catch(() => {});
    }

    if (notif.entity_type === 'PAYMENT' && notif.entity_id) {
      navigate(`/owner/payments/${notif.entity_id}`);
    } else if (notif.entity_type === 'BOOKING' && notif.entity_id) {
      navigate(`/owner/bookings/${notif.entity_id}`);
    } else if (notif.entity_type === 'REVIEW' && notif.entity_id) {
      navigate(`/owner/reviews/${notif.entity_id}`);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('PAYMENT')) return <CreditCard size={18} className="text-amber-500" />;
    if (type?.includes('BOOKING')) return <Calendar size={18} className="text-emerald-500" />;
    if (type?.includes('REVIEW')) return <Star size={18} className="text-amber-500 fill-amber-500" />;
    return <Bell size={18} className="text-brand-orange" />;
  };

  return (
    <div className="space-y-6">

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
            <Bell className="text-brand-orange" size={24} />
            Thông báo & Cảnh báo hệ thống
            {unreadCount > 0 && (
              <Badge variant="warning" size="sm">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Cập nhật tức thời đơn đặt sân mới, xác nhận chuyển khoản và phản hồi từ người chơi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck size={16} />}
              onClick={handleMarkAllRead}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={fetchNotifications}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 items-center">
          <div className="flex-1">
            <Input
              placeholder="Tìm theo tiêu đề hoặc nội dung thông báo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
              size="sm"
              inputClassName="h-[38px] rounded-xl text-xs border-border-subtle-medium"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="h-[38px] px-4 whitespace-nowrap text-xs font-bold rounded-xl shrink-0 flex items-center justify-center"
          >
            Tìm kiếm
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 shrink-0">
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="h-[38px] px-3 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="false">Chưa đọc</option>
            <option value="true">Đã đọc</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-[38px] px-3 rounded-xl border border-border-subtle-medium bg-surface text-gray-900 text-xs font-bold focus:border-brand-orange focus:outline-none"
          >
            <option value="ALL">Tất cả loại thông báo</option>
            <option value="BOOKING">Đơn đặt sân & Hủy đơn</option>
            <option value="PAYMENT">Thanh toán & Chuyển khoản</option>
            <option value="REVIEW">Đánh giá khách hàng</option>
            <option value="SYSTEM">Hệ thống & Cảnh báo</option>
          </select>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} padding="md" radius="xl" className="space-y-2">
                <Skeleton width="200px" height="18px" />
                <Skeleton width="100%" height="14px" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card padding="lg" radius="2xl">
            <ErrorState title="Lỗi tải thông báo" description={error} onRetry={fetchNotifications} />
          </Card>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => {
              const isUnread = !n.is_read;
              let timeStr = '';
              let relativeStr = '';
              if (n.created_at) {
                const d = new Date(n.created_at);
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                timeStr = `${hours}:${minutes} - ${day}/${month}/${year}`;

                const now = new Date();
                const diffMs = now - d;
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffMins < 1) relativeStr = 'Vừa xong';
                else if (diffMins < 60) relativeStr = `${diffMins} phút trước`;
                else if (diffHours < 24) relativeStr = `${diffHours} giờ trước`;
                else if (diffDays === 1) relativeStr = 'Hôm qua';
                else if (diffDays < 7) relativeStr = `${diffDays} ngày trước`;
              }

              return (
                <Card
                  key={n.notification_id}
                  padding="md"
                  radius="2xl"
                  className={[
                    'border transition-all space-y-2',
                    isUnread
                      ? 'border-brand-orange/30 border-l-4 border-l-brand-orange bg-amber-500/5 shadow-xs'
                      : 'border-border-subtle-medium bg-surface'
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                        isUnread ? 'bg-brand-orange/10 border border-brand-orange/20' : 'bg-surface-subtle border border-border-subtle'
                      }`}>
                        {getIcon(n.notification_type)}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {n.title}
                          </h3>
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-orange text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Mới
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Đã đọc
                            </span>
                          )}
                        </div>

                        <p className={`text-xs leading-relaxed ${isUnread ? 'text-gray-800 font-medium' : 'text-text-muted'}`}>
                          {n.message}
                        </p>

                        <div className="pt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                          <span className="font-mono text-gray-700">{timeStr}</span>
                          {relativeStr && (
                            <span className="text-[10px] text-brand-orange font-semibold">
                              ({relativeStr})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {n.entity_id && (
                        <Button
                          variant="primary"
                          size="xs"
                          rightIcon={<ChevronRight size={14} />}
                          onClick={() => handleNavigateEntity(n)}
                        >
                          Xem chi tiết
                        </Button>
                      )}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.notification_id)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCheck size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(n.notification_id)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border-subtle-medium text-xs">
                <span className="text-text-muted">Trang {meta.page} / {meta.totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setMeta((m) => ({ ...m, page: Math.max(1, m.page - 1) }))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setMeta((m) => ({ ...m, page: Math.min(meta.totalPages, m.page + 1) }))}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card padding="lg" radius="2xl" className="text-center py-12 text-text-muted space-y-2">
            <Bell size={36} className="mx-auto text-gray-300" />
            <p className="font-bold text-gray-900 text-sm">Chưa có thông báo nào</p>
            <p className="text-xs">Thông báo và cảnh báo từ hệ thống sẽ hiển thị tại đây.</p>
          </Card>
        )}
      </div>

    </div>
  );
}
