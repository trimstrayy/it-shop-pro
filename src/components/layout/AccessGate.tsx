import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface AccessGateProps {
  allowedRoles: UserRole[];
  fallbackPath: string;
  module?: keyof NonNullable<ReturnType<typeof useAuth>['user']>['enabledModules'];
  children: ReactNode;
}

export const AccessGate = ({ allowedRoles, fallbackPath, module, children }: AccessGateProps) => {
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

  if (module && !user?.enabledModules[module]) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasPermission(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
