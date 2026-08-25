import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Trophy,
  ClipboardList,
  CreditCard,
  Star,
  BarChart3,
  Bell,
  Compass,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './domain/NotificationDropdown';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
    { label: 'Dashboard Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Xét duyệt Đăng ký Chủ sân', path: '/admin/owner-registrations', icon: UserCheck },
    { label: 'Bài đăng Khám phá', path: '/admin/community', icon: Compass },
    { label: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
    { label: 'Quản lý Chủ sân', path: '/admin/owners', icon: UserCheck },
    { label: 'Quản lý Cụm sân', path: '/admin/venues', icon: Building2 },
    { label: 'Đánh giá Khách hàng', path: '/admin/reviews', icon: Star },
    { label: 'Báo cáo & Thống kê', path: '/admin/reports', icon: BarChart3 },
  ];

  const isNavActive = (itemPath) => {
    if (location.pathname === itemPath) return true;
    if (itemPath !== '/admin/dashboard' && location.pathname.startsWith(itemPath)) {
      return true;
    }
    return false;
  };

  const userFullName = currentUser?.full_name || 'Administrator';
  const userInitial = userFullName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* TOPBAR HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950 text-white h-16 border-b border-slate-800 shadow-lg flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle Navigation Drawer"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg text-white tracking-tight">
            <span className="bg-indigo-600 px-2.5 py-1 rounded-lg text-white font-extrabold text-sm shadow-xs">
              SportHub
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-400 border-l border-slate-800 pl-2">
              <ShieldCheck size={14} /> Admin Portal
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <NotificationDropdown />

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {userInitial}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-100 leading-none">{userFullName}</p>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase mt-0.5">SYSTEM ADMIN</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-slate-200">{userFullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-extrabold bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded">
                    QUẢN TRỊ HỆ THỐNG
                  </span>
                </div>

                <Link
                  to="/"
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
                >
                  🌐 Quay lại trang khách hàng
                </Link>
                

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-slate-800 shrink-0">
          <div className="p-4 border-b border-slate-900">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">BẢNG ĐIỀU KHIỂN HỆ THỐNG</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-900 text-center">
            <p className="text-[11px] text-slate-500 font-mono">SportHubAI Admin v1.0</p>
          </div>
        </aside>

        {/* MOBILE DRAWER SIDEBAR */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setMobileDrawerOpen(false)} />
            <div className="relative flex-1 max-w-xs w-full bg-slate-950 border-r border-slate-800 p-4 flex flex-col z-10">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 px-2 py-1 rounded text-white font-bold text-xs">SportHub</span>
                  <span className="text-xs font-bold text-indigo-400">ADMIN</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                        active ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-900">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/30 hover:bg-rose-950/60 flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
