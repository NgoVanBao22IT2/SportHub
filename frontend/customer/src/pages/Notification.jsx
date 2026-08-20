import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Search,
  Calendar,
  CreditCard,
  Star,
  Sparkles,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../api/notifications';
import { useAuth } from '../context/AuthContext';

export default function Notification() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounce(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchNotificationsList = useCallback(async (page = 1) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);

      let isReadFilter = undefined;
      let typeFilter = undefined;

      if (activeTab === 'UNREAD') {
        isReadFilter = 'false';
      } else if (activeTab !== 'ALL') {
        typeFilter = activeTab;
      }

      const res = await getNotifications({
        page,
        limit: 10,
        type: typeFilter,
        isRead: isReadFilter,
        search: searchDebounce || undefined
      });

      if (res && res.data) {
        setNotifications(res.data);
        if (res.unreadCount !== undefined) setUnreadCount(res.unreadCount);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Không thể tải danh sách thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, searchDebounce]);

  useEffect(() => {
    fetchNotificationsList(1);
  }, [fetchNotificationsList]);

  const handleMarkRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      setActionLoadingId(notifId);
      await markNotificationAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notifId ? { ...n, is_read: true, read_at: new Date() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      setActionLoadingId(notifId);
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notifId));
      fetchNotificationsList(meta.page);
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.is_read) {
      handleMarkRead(notif.notification_id);
    }
    // Navigate according to target entity
    if (notif.entity_type === 'BOOKING' && notif.entity_id) {
      navigate(`/my-bookings/${notif.entity_id}`);
    } else if (notif.entity_type === 'VENUE' && notif.entity_id) {
      navigate(`/venues/${notif.entity_id}`);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('PAYMENT')) return <CreditCard size={18} className="text-amber-500" />;
    if (type?.includes('BOOKING')) return <Calendar size={18} className="text-emerald-500" />;
    if (type?.includes('REVIEW')) return <Star size={18} className="text-amber-500 fill-amber-500" />;
    return <Sparkles size={18} className="text-brand-orange" />;
  };

  if (!isAuthenticated) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-2xl">
        <EmptyState
          title="Yêu cầu đăng nhập"
          description="Vui lòng đăng nhập tài khoản để xem toàn bộ lịch sử thông báo cá nhân."
          action={
            <Button variant="primary" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-subtle pb-16">
      {/* HEADER SECTION */}
      <section className="bg-surface border-b border-border-subtle-medium py-8 px-4">
        <div className="container mx-auto max-w-5xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shadow-xs">
                <Bell size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  Thông báo của bạn
                  {unreadCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-red-500 text-white">
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </h1>
                <p className="text-xs text-text-muted mt-0.5">
                  Cập nhật các hoạt động đặt sân, thanh toán và đánh giá từ SportHubAI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<CheckCheck size={16} />}
                  onClick={handleMarkAllRead}
                >
                  Đọc tất cả
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={15} />}
                onClick={() => fetchNotificationsList(1)}
              >
                Làm mới
              </Button>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'UNREAD', label: `Chưa đọc ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
                { id: 'BOOKING', label: 'Đặt sân' },
                { id: 'REVIEW', label: 'Đánh giá' },
                { id: 'PAYMENT', label: 'Thanh toán' },
                { id: 'SYSTEM', label: 'Sự kiện & Hệ thống' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'bg-surface border border-border-subtle text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thông báo..."
                className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN NOTIFICATION LIST */}
      <div className="container mx-auto px-4 max-w-5xl pt-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} radius="xl" padding="md" className="border border-border-subtle space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width="36px" height="36px" />
                  <div className="space-y-1 flex-1">
                    <Skeleton variant="text" width="40%" height="1rem" />
                    <Skeleton variant="text" width="80%" height="0.75rem" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Lỗi tải thông báo"
            description={error}
            action={
              <Button variant="primary" leftIcon={<RefreshCw size={15} />} onClick={() => fetchNotificationsList(1)}>
                Thử lại
              </Button>
            }
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={40} className="text-gray-400" />}
            title="Không có thông báo nào"
            description={
              searchDebounce
                ? `Không tìm thấy thông báo nào phù hợp với từ khóa "${searchDebounce}".`
                : 'Bạn đã xem hết các thông báo mới nhất.'
            }
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const isUnread = !notif.is_read;
              
              // Format detailed date: HH:mm - DD/MM/YYYY and relative time
              let timeStr = '';
              let relativeStr = '';
              if (notif.created_at) {
                const d = new Date(notif.created_at);
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
                  key={notif.notification_id}
                  radius="2xl"
                  padding="md"
                  className={`border transition cursor-pointer shadow-2xs hover:border-gray-300 ${
                    isUnread
                      ? 'bg-amber-500/5 border-l-4 border-l-brand-orange border-brand-orange/30 ring-1 ring-brand-orange/15'
                      : 'bg-surface border-border-subtle-medium hover:bg-surface-subtle/50'
                  }`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                        isUnread ? 'bg-brand-orange/10 border border-brand-orange/20' : 'bg-surface-subtle border border-border-subtle'
                      }`}>
                        {getIcon(notif.notification_type)}
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {notif.title}
                          </h3>

                          {/* Unread / Read Status Badge */}
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-orange text-white shadow-xs">
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
                          {notif.message}
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-[11px] text-text-muted flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-gray-700">
                            <Clock size={12} className="text-text-muted" />
                            {timeStr}
                          </span>
                          {relativeStr && (
                            <span className="text-[10px] text-brand-orange font-semibold">
                              ({relativeStr})
                            </span>
                          )}
                          {notif.entity_type && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-gray-600 uppercase tracking-wider text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-md">
                                {notif.entity_type}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkRead(notif.notification_id, e)}
                          disabled={actionLoadingId === notif.notification_id}
                          className="p-1.5 rounded-xl text-text-muted hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCheck size={16} />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleDelete(notif.notification_id, e)}
                        disabled={actionLoadingId === notif.notification_id}
                        className="p-1.5 rounded-xl text-text-muted hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="pt-6 flex items-center justify-between text-xs text-text-muted border-t border-border-subtle">
                <span>
                  Trang {meta.page} / {meta.totalPages} ({meta.total} thông báo)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page <= 1 || loading}
                    onClick={() => fetchNotificationsList(meta.page - 1)}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.page >= meta.totalPages || loading}
                    onClick={() => fetchNotificationsList(meta.page + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
