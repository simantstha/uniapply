import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function Layout() {
  const location = useLocation();
  const isSOP = location.pathname.startsWith('/sop/');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto ${isSOP ? 'overflow-hidden flex flex-col' : 'pb-20 md:pb-0'}`}>
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  );
}
