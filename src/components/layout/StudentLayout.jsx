import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FileCheck2, Home, UserRound } from 'lucide-react';
import Navbar from './Navbar';

const mobileLinks = [
  { to: '/dashboard', label: 'Panel', icon: Home },
  { to: '/cozulen-testler', label: 'Çözülenler', icon: FileCheck2 },
  { to: '/profile', label: 'Profil', icon: UserRound },
];

export default function StudentLayout() {
  const location = useLocation();
  const isSolvePage = /^\/resource\/.+\/solve$/.test(location.pathname);

  return (
    <div className="app-shell h-screen overflow-hidden">
      <Navbar />
      <main className={`fixed left-0 right-0 top-16 overflow-y-auto overscroll-contain ${isSolvePage ? 'bottom-0 pb-0' : 'bottom-0 pb-20 md:pb-0'}`}>
        <div
          key={location.pathname}
          className={
            isSolvePage
              ? 'page-transition h-full min-h-0 bg-surface p-2 dark:bg-dark-bg sm:p-3'
              : 'page-transition mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'
          }
        >
          <Outlet />
        </div>
      </main>
      {isSolvePage ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-surface-border bg-white/85 backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/85 md:hidden">
          {mobileLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-semibold ${
                  isActive ? 'text-primary dark:text-primary-muted' : 'text-muted dark:text-dark-muted'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
