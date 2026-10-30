import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MapPin, Compass, CalendarDays, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isNavActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/search') {
      return location.pathname.startsWith('/search') || location.pathname.startsWith('/venues') || location.pathname.startsWith('/venue');
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Trang chủ', path: '/', icon: Home },
    { label: 'Tìm sân', path: '/search', icon: Search },
    { label: 'Bản đồ', path: '/map', icon: MapPin },
    { label: 'Khám phá', path: '/explore', icon: Compass },
    { 
      label: 'Đơn đặt', 
      path: isAuthenticated ? '/my-bookings' : '/login', 
      icon: CalendarDays 
    }
  ];

  return (
    <nav 
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around safe-area-bottom"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 rounded-xl ${
              active
                ? 'text-primary font-bold scale-105'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-full transition-colors ${active ? 'bg-primary/10' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
