import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './domain/NotificationDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated, logout } = useAuth();

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
    <header className="bg-primary text-white w-full h-16 flex items-center justify-center sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between">
        {/* Logo & Main Nav */}
        <div className="flex items-center space-x-4 ">
          <img src="/logo-badminton.png" alt="logo" className=" w-10 h-15 " />
          <span className="font-bold text-2xl tracking-tight">SPORTHUB</span>

          <nav className="hidden md:flex space-x-6 text-dm font-medium items-center">
            <Link to="/" className={getNavItemClass('/', 'ml-10')}>Trang chủ</Link>
            <Link to="/search" className={getNavItemClass('/search')}>Đặt sân</Link>
            <Link to="/map" className={getNavItemClass('/map')}>Bản đồ sân</Link>
            {isAuthenticated && (
              <>
                <Link to="/my-bookings" className={getNavItemClass('/my-bookings')}>Lịch sử đặt sân</Link>
                <Link to="/favorites" className={getNavItemClass('/favorites')}>Yêu thích</Link>
              </>
            )}
          </nav>
        </div>

        {/* Auth & Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              {currentUser?.primary_role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-full transition-colors shadow-xs"
                >
                  Khu vực Quản trị
                </Link>
              )}
              {currentUser?.primary_role === 'OWNER' && (
                <Link
                  to="/owner/dashboard"
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-full transition-colors shadow-xs"
                >
                  Khu vực Chủ sân
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                <User size={16} />
                <span className="max-w-[120px] truncate">{currentUser?.full_name || 'Tài khoản'}</span>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-green-200 border border-white/50 px-4 py-1.5 rounded-full">
                Đăng nhập
              </Link>
              <Link to="/register" className="text-sm font-medium bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-full text-white transition-colors">
                Đăng ký
              </Link>
            </>
          )}

          {/* Notification Dropdown */}
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
