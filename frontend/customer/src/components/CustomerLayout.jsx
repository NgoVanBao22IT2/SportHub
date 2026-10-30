import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

export default function CustomerLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <div className={`flex flex-col bg-white ${isMapPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <main className={`flex-1 w-full overflow-x-hidden min-h-0 ${!isMapPage ? 'pb-16 md:pb-0' : ''}`}>
        <Outlet />
      </main>
      {!isMapPage && <Footer />}
      {!isMapPage && <MobileBottomNav />}
    </div>
  );
}
