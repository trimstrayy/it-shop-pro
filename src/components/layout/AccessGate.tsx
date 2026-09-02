import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface AccessGateProps {
  allowedRoles: UserRole[];
  fallbackPath: string;
  children: ReactNode;
}

export const AccessGate = ({ allowedRoles, fallbackPath, children }: AccessGateProps) => {
  const { isAuthenticated, isInitializing, hasPermission } = useAuth();

  if (isInitializing) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Restoring your session…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
