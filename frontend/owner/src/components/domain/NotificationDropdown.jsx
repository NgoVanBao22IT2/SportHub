import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Calendar,
  Star,
  Building2,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  getOwnerNotifications,
  getOwnerUnreadNotificationCount,
  markOwnerNotificationAsRead,
  markAllOwnerNotificationsAsRead
} from '../../api/owner';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (currentUser?.primary_role !== 'OWNER') return;
    try {
      const res = await getOwnerUnreadNotificationCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchLatestNotifications = async () => {
    if (currentUser?.primary_role !== 'OWNER') return;
    try {
      setLoading(true);
      const res = await getOwnerNotifications({ page: 1, limit: 5 });
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching dropdown notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling every 30s (only for OWNER)
  useEffect(() => {
    if (currentUser?.primary_role !== 'OWNER') return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.primary_role]);

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
    if (!isOpen) {
      fetchLatestNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllOwnerNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await markOwnerNotificationAsRead(notif.notification_id);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Error marking read on click:', err);
    } finally {
      setIsOpen(false);
      // Navigate to target entity
      if (notif.entity_type === 'PAYMENT' && notif.entity_id) {
        navigate(`/owner/payments/${notif.entity_id}`);
      } else if (notif.entity_type === 'BOOKING' && notif.entity_id) {
        navigate(`/owner/bookings/${notif.entity_id}`);
      } else if (notif.entity_type === 'REVIEW' && notif.entity_id) {
        navigate(`/owner/reviews/${notif.entity_id}`);
      } else {
        navigate('/owner/notifications');
      }
    }
  };

  const getIcon = (type) => {
    if (type?.includes('PAYMENT')) return <CreditCard size={16} className="text-amber-500" />;
    if (type?.includes('BOOKING')) return <Calendar size={16} className="text-emerald-500" />;
    if (type?.includes('REVIEW')) return <Star size={16} className="text-amber-500 fill-amber-500" />;
    return <Bell size={16} className="text-brand-orange" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>

      {/* TRIGGER BELL BUTTON */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 relative transition-colors"
        title="Thông báo hệ thống"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-brand-orange text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse border border-dark">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN CONTAINER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-2xl border border-border-subtle-medium shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          
          {/* Dropdown Header */}
          <div className="p-3.5 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="bg-brand-orange/10 text-brand-orange font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-brand-orange hover:underline flex items-center gap-1"
              >
                <CheckCheck size={13} /> Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
            {loading ? (
              <div className="p-6 text-center text-text-muted">Đang tải thông báo...</div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => handleNotificationClick(n)}
                  className={[
                    'p-3.5 flex gap-3 hover:bg-surface-subtle transition-colors cursor-pointer',
                    !n.is_read ? 'bg-amber-50/40 font-semibold' : ''
                  ].join(' ')}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-surface border border-border-subtle h-fit">
                    {getIcon(n.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-gray-900 truncate">{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-text-muted text-[11px] line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-text-muted block font-normal">
                      {new Date(n.created_at || Date.now()).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted space-y-1">
                <Bell size={28} className="mx-auto text-gray-300" />
                <p className="font-bold text-gray-900 text-xs">Không có thông báo mới</p>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 bg-surface-subtle border-t border-border-subtle text-center">
            <Link
              to="/owner/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-brand-orange hover:underline inline-flex items-center gap-1"
            >
              Xem tất cả thông báo <ChevronRight size={14} />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
}
