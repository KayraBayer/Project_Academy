import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { setAnalyticsIdentity, trackAnalyticsEvent } from '../../services/analyticsService';

function pageTitleFromPath(pathname) {
  if (pathname.startsWith('/admin')) return 'Admin Paneli';
  if (pathname.startsWith('/resource/') && pathname.endsWith('/solve')) return 'Test Çözme';
  if (pathname.startsWith('/resource/')) return 'Kaynak Detayı';
  if (pathname.startsWith('/category/')) return 'Kategori';
  if (pathname === '/dashboard') return 'Öğrenci Paneli';
  if (pathname === '/assignments') return 'Atanan Ödevler';
  if (pathname === '/cozulen-testler') return 'Çözülen Testler';
  if (pathname === '/profile') return 'Profil';
  if (pathname === '/login') return 'Giriş';
  return 'Erdinç Bayer Akademi';
}

export default function AnalyticsTracker() {
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    setAnalyticsIdentity(currentUser, userProfile).catch(() => {});
  }, [currentUser, userProfile]);

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search || ''}`;
    trackAnalyticsEvent('page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: pageTitleFromPath(location.pathname),
      user_role: userProfile?.role || 'anonymous',
    }).catch(() => {});
  }, [location.pathname, location.search, userProfile?.role]);

  return null;
}
