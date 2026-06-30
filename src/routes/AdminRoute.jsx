import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute() {
  const { currentUser, loading, role, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface dark:bg-dark-bg">
        <LoadingSpinner label="Yetki kontrol ediliyor" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (userProfile?.status !== 'active') return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
