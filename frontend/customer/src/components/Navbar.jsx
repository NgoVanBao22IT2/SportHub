import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Home, Search, MapPin, Compass, CalendarDays, Heart, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './domain/NotificationDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const isNavActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/search') {
      return location.pathname.startsWith('/search') || location.pathname.startsWith('/venues') || location.pathname.startsWith('/venue');
    }
    return location.pathname.startsWith(path);
  };

  const getNavItemClass = (path, extraClass = '') => {
    const active = isNavActive(path);
    return `pb-1 transition-all border-b-2 ${extraClass} ${
      active
        ? 'border-white text-white font-bold'
        : 'border-transparent text-white/90 hover:text-white hover:border-white/40 font-medium'
    }`;
  };

  return (
    <>
      <header className="bg-primary text-white w-full h-16 flex items-center justify-center sticky top-0 z-[1000] shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              aria-label="Mở menu di động"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo-badminton.png" alt="logo" className="w-8 h-12 object-contain" />
              <span className="font-bold text-2xl tracking-tight">SPORTHUB</span>
            </Link>

            <nav className="hidden md:flex space-x-6 text-dm font-medium items-center ml-4">
              <Link to="/" className={getNavItemClass('/', 'ml-6')}>Trang chủ</Link>
              <Link to="/search" className={getNavItemClass('/search')}>Tìm sân</Link>
              <Link to="/map" className={getNavItemClass('/map')}>Bản đồ sân</Link>
              <Link to="/explore" className={getNavItemClass('/explore')}>Khám phá</Link>
              {isAuthenticated && (
                <>
                  <Link to="/my-bookings" className={getNavItemClass('/my-bookings')}>Lịch sử</Link>
                  <Link to="/favorites" className={getNavItemClass('/favorites')}>Yêu thích</Link>
                </>
              )}
            </nav>
          </div>

          {/* Auth & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {currentUser?.primary_role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:inline-flex text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-full transition-colors shadow-xs"
                  >
                    Quản trị
                  </Link>
                )}
                {currentUser?.primary_role === 'OWNER' && (
                  <Link
                    to="/owner/dashboard"
                    className="hidden sm:inline-flex text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-full transition-colors shadow-xs"
                  >
                    Chủ sân
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors"
                >
                  <User size={16} />
                  <span className="max-w-[90px] sm:max-w-[120px] truncate">{currentUser?.full_name || 'Tài khoản'}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-xs sm:text-sm font-medium hover:text-green-200 border border-white/50 px-3 sm:px-4 py-1.5 rounded-full">
                  Đăng nhập
                </Link>
                <Link to="/register" className="hidden sm:inline-block text-xs sm:text-sm font-medium bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-full text-white transition-colors">
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Notification Dropdown */}
            <NotificationDropdown />
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER BACKDROP & SLIDE-OUT PANEL */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[1050] flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-dark/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Menu */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-fade-in">
            {/* Drawer Header */}
            <div>
              <div className="bg-primary text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src="/logo-badminton.png" alt="logo" className="w-7 h-10 object-contain" />
                  <span className="font-bold text-xl tracking-tight">SPORTHUB</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile Mini Card in Drawer */}
              {isAuthenticated && (
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{currentUser?.full_name || 'Khách hàng'}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                  </div>
                </div>
              )}

              {/* Navigation Links List */}
              <nav className="p-3 space-y-1">
                <Link
                  to="/"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isNavActive('/') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home size={18} />
                  <span>Trang chủ</span>
                </Link>

                <Link
                  to="/search"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isNavActive('/search') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Search size={18} />
                  <span>Tìm sân thể thao</span>
                </Link>

                <Link
                  to="/map"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isNavActive('/map') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MapPin size={18} />
                  <span>Bản đồ sân xung quanh</span>
                </Link>

                <Link
                  to="/explore"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isNavActive('/explore') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Compass size={18} />
                  <span>Khám phá & Sự kiện</span>
                </Link>

                {isAuthenticated && (
                  <>
                    <Link
                      to="/my-bookings"
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isNavActive('/my-bookings') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <CalendarDays size={18} />
                      <span>Lịch sử đặt sân</span>
                    </Link>

                    <Link
                      to="/favorites"
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        isNavActive('/favorites') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Heart size={18} />
                      <span>Sân yêu thích</span>
                    </Link>
                  </>
                )}

                {/* Role Specific Switcher */}
                {currentUser?.primary_role === 'OWNER' && (
                  <Link
                    to="/owner/dashboard"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors mt-2"
                  >
                    <Building2 size={18} />
                    <span>Cổng Quản lý Chủ sân</span>
                  </Link>
                )}

                {currentUser?.primary_role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors mt-2"
                  >
                    <ShieldCheck size={18} />
                    <span>Cổng Quản trị Hệ thống</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất tài khoản</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 text-center"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-orange-500 text-xs font-bold text-white hover:bg-orange-600 text-center"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
