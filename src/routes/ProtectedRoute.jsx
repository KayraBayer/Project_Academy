import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { currentUser, loading, role, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface dark:bg-dark-bg">
        <LoadingSpinner label="Oturum kontrol ediliyor" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!userProfile || userProfile.status !== 'active') {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
