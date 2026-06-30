import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../common/BrandLogo';
import Button from '../common/Button';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell h-screen overflow-hidden">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-border/70 bg-white/80 backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/80">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button className="icon-button md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menüyü aç">
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/admin" className="flex items-center text-primary">
              <BrandLogo className="h-10 w-40 sm:w-56" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" icon={LogOut} onClick={handleLogout} className="px-3">
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-72 md:block">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            className="absolute inset-0 bg-ink/35 backdrop-blur-sm"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[85vw] bg-surface-low shadow-soft dark:bg-dark-surface">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="flex items-center text-primary">
                <BrandLogo className="h-9 w-52" />
              </span>
              <button className="icon-button" onClick={() => setMobileOpen(false)} aria-label="Menüyü kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}

      <main key={location.pathname} className="page-transition fixed bottom-0 left-0 right-0 top-16 overflow-y-auto overscroll-contain px-4 py-8 md:left-72 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
