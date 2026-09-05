import { Navigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isPlatformAdmin) return <Navigate to="/platform-admin" replace />;

  return <Navigate to={user?.role === 'admin' || user?.role === 'technician' ? '/lab' : '/dashboard'} replace />;
};

export default Index;
