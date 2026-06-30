import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../common/BrandLogo';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-surface-border/70 bg-white/80 backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-7">
          <Link to="/dashboard" className="flex items-center text-primary">
            <BrandLogo className="h-10 w-40 sm:w-56" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold ${
                  isActive
                    ? 'bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted'
                    : 'text-muted hover:bg-surface-low hover:text-primary dark:text-dark-muted dark:hover:bg-dark-surface'
                }`
              }
            >
              Panel Sayfası
            </NavLink>
            <NavLink
              to="/cozulen-testler"
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold ${
                  isActive
                    ? 'bg-primary-soft text-primary dark:bg-primary/15 dark:text-primary-muted'
                    : 'text-muted hover:bg-surface-low hover:text-primary dark:text-dark-muted dark:hover:bg-dark-surface'
                }`
              }
            >
              Çözülen Testler
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-low dark:hover:bg-dark-surface"
              onClick={() => setOpen((value) => !value)}
            >
              {userProfile?.profilePhotoURL ? (
                <img
                  src={userProfile.profilePhotoURL}
                  alt={userProfile.name || 'Profil'}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary dark:bg-primary/15 dark:text-primary-muted">
                  {(userProfile?.name || 'Ö').slice(0, 1).toLocaleUpperCase('tr-TR')}
                </span>
              )}
              <span className="hidden max-w-28 truncate text-sm font-semibold text-ink dark:text-white sm:block">
                {userProfile?.name || 'Öğrenci'}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-outline sm:block" />
            </button>

            {open ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-surface-border bg-white shadow-soft dark:border-dark-border dark:bg-dark-card">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-muted hover:bg-surface-low hover:text-primary dark:text-dark-muted dark:hover:bg-dark-surface"
                  onClick={() => setOpen(false)}
                >
                  <UserRound className="h-4 w-4" />
                  Profilim
                </Link>
                <button
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-danger-soft dark:hover:bg-danger/15"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
