import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  UserCheck,
  Building2,
  Star,
  Compass,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead
} from '../../api/admin';
import { useAuth } from '../../context/AuthContext';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await getAdminUnreadNotificationCount();
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching admin unread count:', err);
    }
  };

  const fetchLatestNotifications = async () => {
    try {
      setLoading(true);
      const res = await getAdminNotifications({ page: 1, limit: 6 });
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin dropdown notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

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
      await markAllAdminNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read for admin:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await markAdminNotificationAsRead(notif.notification_id);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Error marking read on click:', err);
    } finally {
      setIsOpen(false);
      // Navigate to corresponding Admin module
      if (notif.entity_type === 'OWNER_REGISTRATION' || notif.notification_type?.includes('OWNER_REGISTRATION')) {
        navigate('/admin/owner-registrations');
      } else if (notif.entity_type === 'VENUE' || notif.notification_type?.includes('VENUE')) {
        navigate('/admin/venues');
      } else if (notif.entity_type === 'REVIEW' || notif.notification_type?.includes('REVIEW')) {
        navigate('/admin/reviews');
      } else if (notif.entity_type === 'COMMUNITY' || notif.notification_type?.includes('COMMUNITY')) {
        navigate('/admin/community');
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  const getIcon = (type) => {
    if (type?.includes('OWNER_REGISTRATION')) return <UserCheck size={16} className="text-orange-400" />;
    if (type?.includes('VENUE')) return <Building2 size={16} className="text-indigo-400" />;
    if (type?.includes('REVIEW')) return <Star size={16} className="text-amber-400 fill-amber-400" />;
    if (type?.includes('COMMUNITY')) return <Compass size={16} className="text-emerald-400" />;
    return <Bell size={16} className="text-indigo-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BELL BUTTON */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors"
        title="Thông báo quản trị hệ thống"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse border border-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN CONTAINER */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs text-slate-100">
          
          {/* Dropdown Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Thông Báo Quản Trị</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500/20 text-rose-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={13} /> Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {loading ? (
              <div className="p-6 text-center text-slate-400">Đang nạp thông báo...</div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.notification_id}
                  onClick={() => handleNotificationClick(n)}
                  className={[
                    'p-3.5 flex gap-3 hover:bg-slate-800/60 transition-colors cursor-pointer',
                    !n.is_read ? 'bg-slate-800/40 font-semibold' : ''
                  ].join(' ')}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-800 border border-slate-700 h-fit">
                    {getIcon(n.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-bold text-white truncate">{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-slate-300 text-[11px] line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block font-normal mt-1">
                      {new Date(n.created_at || Date.now()).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <Bell size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-slate-300 text-xs">Không có thông báo mới</p>
                <p className="text-[11px] text-slate-500">Hệ thống sẽ thông báo khi có hồ sơ đăng ký hoặc cụm sân mới chờ duyệt.</p>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500">
              Thông báo sự kiện nền tảng SportHubAI
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
