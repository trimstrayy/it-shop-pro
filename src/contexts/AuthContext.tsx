import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const loadProfile = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, created_at, updated_at')
      .or(`auth_user_id.eq.${session.user.id},email.eq.${session.user.email}`)
      .maybeSingle();

    if (error || !data) {
      const fallbackUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.email?.split('@')[0] || 'User',
        role: 'sales',
        createdAt: new Date(session.user.created_at),
      };
      setUser(fallbackUser);
      return fallbackUser;
    }

    const mappedUser: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar_url || undefined,
      createdAt: new Date(data.created_at),
    };

    setUser(mappedUser);
    return mappedUser;
  };

  useEffect(() => {
    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      await loadProfile(data.session);
    };

    initializeSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await loadProfile(session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return null;
    }

    return loadProfile(data.session);
  };

  const logout = () => {
    void supabase.auth.signOut();
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has full access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
