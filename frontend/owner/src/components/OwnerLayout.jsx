import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Building2,
  CreditCard,
  BarChart3,
  Star,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldAlert,
  MapPin,
  Trophy,
  Image,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './domain/NotificationDropdown';

export default function OwnerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard Overview', path: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'Quản lý Đặt sân', path: '/owner/bookings', icon: ClipboardList },
    { label: 'Ma trận Lịch sân', path: '/owner/schedules', icon: CalendarDays },
    { label: 'Quản lý Cụm sân', path: '/owner/venues', icon: Building2 },
    { label: 'Thư viện hình ảnh', path: '/owner/media', icon: Image },
    { label: 'Bài viết & Sự kiện', path: '/owner/posts', icon: FileText },
    { label: 'Quản lý Chi nhánh', path: '/owner/branches', icon: MapPin },
    { label: 'Danh mục Sân con', path: '/owner/courts', icon: Trophy },
    { label: 'Bảng giá & Giờ hoạt động', path: '/owner/pricing', icon: DollarSign },
    { label: 'Tiện ích & Dịch vụ', path: '/owner/services', icon: Tag },
    { label: 'Tài khoản Nhận tiền', path: '/owner/payment-accounts', icon: CreditCard },
    { label: 'Giao dịch Thanh toán', path: '/owner/payments', icon: CreditCard },
    { label: 'Doanh thu & Báo cáo', path: '/owner/revenue', icon: BarChart3 },
    { label: 'Đánh giá Khách hàng', path: '/owner/reviews', icon: Star },
    { label: 'Thông báo', path: '/owner/notifications', icon: Bell },
    { label: 'Hồ sơ Chủ sân', path: '/owner/profile', icon: User }
  ];

  // Robust Active Route Logic (handles nested paths like /owner/bookings/123)
  const isNavActive = (itemPath) => {
    if (location.pathname === itemPath) return true;
    if (itemPath !== '/owner/dashboard' && location.pathname.startsWith(itemPath)) {
      return true;
    }
    return false;
  };

  const userFullName = currentUser?.full_name || 'Chủ sân';
  const userRoleText = currentUser?.primary_role === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : 'CHỦ SÂN';
  const userInitial = userFullName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col font-sans text-gray-900">

      {/* TOPBAR / HEADER */}
      <header className="sticky top-0 z-40 bg-dark text-white h-16 border-b border-gray-800 shadow-md flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label="Toggle Navigation Drawer"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo & Portal Badge */}
          <Link to="/owner/dashboard" className="flex items-center gap-2 font-bold text-lg text-white tracking-tight">
          
            <img src="/logo-badminton.png" alt="logo" className=" w-9 h-10 " />
            <span className=" px-2 py-1 rounded-lg text-white font-extrabold text-2xl shadow-xs">
              SportHub
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-brand-orange border-l border-gray-700 pl-2">
              Owner Portal
            </span>
          </Link>
        </div>

        {/* Top Right User Info & Actions */}
        <div className="flex items-center gap-4">
          <NotificationDropdown />

          {/* User Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-extrabold text-sm flex items-center justify-center border border-white/20">
                {userInitial}
              </div>
              <div className="hidden md:block text-xs leading-tight">
                <span className="font-bold text-white block truncate max-w-[120px]">{userFullName}</span>
                <span className="text-[10px] text-gray-400 font-medium">{userRoleText}</span>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-brand-orange">
                  <p className="text-xs font-bold text-slate-200">{userFullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-extrabold bg-brand-orange/80 text-white px-2 py-0.5 rounded">
                    Chủ sân 
                  </span>
                </div>
                {/* <div className="px-4 py-2 border-b border-brand-orange mb-1">
                  
                  <p className="font-bold text-gray-900 truncate">{userFullName}</p>
                  <p className="text-[11px] text-text-muted">{currentUser?.email}</p>
                </div> */}
                <Link
                  to="/"
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                >
                  🌐 Quay lại trang khách hàng
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 font-bold border-t border-brand-orange mt-1 pt-2 text-left"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY LAYOUT (SIDEBAR + MAIN CONTENT) */}
      <div className="flex-1 flex relative">

        {/* MOBILE DRAWER BACKDROP */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-dark/60 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside
          className={[
            'w-64 bg-dark text-gray-300 border-r border-gray-800 flex flex-col justify-between transition-all duration-200 z-40',
            'fixed lg:sticky top-16 h-[calc(100vh-4rem)]',
            mobileDrawerOpen ? 'left-0 shadow-2xl' : '-left-64 lg:left-0'
          ].join(' ')}
        >
          <div className="p-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-1 block">
              Menu Quản trị
            </span>
            {navItems.map((item) => {
              const IconComp = item.icon;
              const active = isNavActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={[
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                    active
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  ].join(' ')}
                >
                  <IconComp size={18} className={active ? 'text-white' : 'text-gray-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Footer Sidebar Branding & Logout */}
          <div className="p-3 border-t border-gray-800 text-xs">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT OUTLET AREA */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 bg-surface-subtle overflow-x-hidden">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
