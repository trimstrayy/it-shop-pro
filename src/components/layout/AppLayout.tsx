import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={cn("flex min-h-screen w-full bg-background", className)}>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
