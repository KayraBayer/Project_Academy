import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export default function RoleRedirect() {
  const { currentUser, loading, role, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface dark:bg-dark-bg">
        <LoadingSpinner label="Oturum hazırlanıyor" />
      </div>
    );
  }

  if (!currentUser || !userProfile || userProfile.status !== 'active') {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
}
