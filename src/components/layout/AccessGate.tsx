import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface AccessGateProps {
  allowedRoles: UserRole[];
  fallbackPath: string;
  children: ReactNode;
}

export const AccessGate = ({ allowedRoles, fallbackPath, children }: AccessGateProps) => {
  const { isAuthenticated, isInitializing, hasPermission, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Restoring your session…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isPlatformAdmin && location.pathname !== '/platform-admin') {
    return <Navigate to="/platform-admin" replace />;
  }

  if (user?.accountType?.toLowerCase().includes('furniture') && location.pathname === '/lab') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasPermission(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
