import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Calendar,
  Star,
  Sparkles
} from 'lucide-react';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchLatestNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getNotifications({ page: 1, limit: 6 });
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching dropdown notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling every 30s
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isOpen) {
      fetchLatestNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await markNotificationAsRead(notif.notification_id);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Error marking read on click:', err);
    } finally {
      setIsOpen(false);
      // Determine destination according to role and entity
      const isOwner = currentUser?.primary_role === 'OWNER';
      if (isOwner) {
        if (notif.entity_type === 'PAYMENT' && notif.entity_id) {
          navigate(`/owner/payments/${notif.entity_id}`);
        } else if (notif.entity_type === 'BOOKING' && notif.entity_id) {
          navigate(`/owner/bookings/${notif.entity_id}`);
        } else if (notif.entity_type === 'REVIEW' && notif.entity_id) {
          navigate(`/owner/reviews`);
        } else {
          navigate('/owner/notifications');
        }
      } else {
        if (notif.entity_type === 'BOOKING' && notif.entity_id) {
          navigate(`/my-bookings/${notif.entity_id}`);
        } else if (notif.entity_type === 'VENUE' && notif.entity_id) {
          navigate(`/venues/${notif.entity_id}`);
        } else {
          navigate('/notifications');
        }
      }
    }
  };

  const getIcon = (type) => {
    if (type?.includes('PAYMENT')) return <CreditCard size={15} className="text-amber-500" />;
    if (type?.includes('BOOKING')) return <Calendar size={15} className="text-emerald-500" />;
    if (type?.includes('REVIEW')) return <Star size={15} className="text-amber-500 fill-amber-500" />;
    return <Sparkles size={15} className="text-brand-orange" />;
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return past.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        className="p-2 rounded-full hover:bg-white/10 text-white transition relative focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-2xl shadow-2xl border border-border-subtle-medium overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-gray-900">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-orange/10 text-brand-orange">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-text-muted hover:text-brand-orange flex items-center gap-1 font-medium transition"
              >
                <CheckCheck size={14} />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-subtle">
            {loading ? (
              <div className="p-8 text-center text-xs text-text-muted space-y-2">
                <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-surface-subtle border border-border-subtle flex items-center justify-center mx-auto text-text-muted">
                  <Bell size={22} className="opacity-40" />
                </div>
                <p className="text-xs font-semibold text-gray-700">Chưa có thông báo nào</p>
                <p className="text-[11px] text-text-muted">Các thông báo về lịch đặt sân và hệ thống sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer transition hover:bg-surface-subtle ${
                    !notif.is_read ? 'bg-brand-orange/5' : 'bg-surface'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-surface border border-border-subtle flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getIcon(notif.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-orange shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-text-muted block pt-0.5">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-surface-subtle border-t border-border-subtle text-center">
            <Link
              to={currentUser?.primary_role === 'OWNER' ? '/owner/notifications' : '/notifications'}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
            >
              Xem tất cả thông báo
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
