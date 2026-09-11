import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function CustomerLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <div className={`flex flex-col bg-white ${isMapPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <Outlet />
      </main>
      {!isMapPage && <Footer />}
    </div>
  );
}
