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
const LOCAL_SUPERADMIN_STORAGE_KEY = 'it-shop-local-superadmin';

const readLocalSuperadminSession = (): User | null => {
  try {
    const raw = localStorage.getItem(LOCAL_SUPERADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<User> & { createdAt?: string };
    if (!parsed.email) return null;

    return {
      id: parsed.id || 'local-superadmin',
      email: parsed.email,
      name: parsed.name || parsed.email.split('@')[0],
      role: parsed.role || 'admin',
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
    };
  } catch {
    return null;
  }
};

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
      const localFallbackUser = readLocalSuperadminSession();
      if (localFallbackUser) {
        setUser(localFallbackUser);
        return;
      }

      const { data } = await supabase.auth.getSession();
      await loadProfile(data.session);
    };

    void initializeSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await loadProfile(session);
      if (!_event || _event === 'SIGNED_OUT') {
        localStorage.removeItem(LOCAL_SUPERADMIN_STORAGE_KEY);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const localAllowed = import.meta.env.VITE_ALLOW_LOCAL_SUPERADMIN !== 'false';
    const localEmail = (import.meta.env.VITE_LOCAL_SUPERADMIN_EMAIL || 'superadmin@it.com').trim().toLowerCase();
    const localPassword = import.meta.env.VITE_LOCAL_SUPERADMIN_PASSWORD || 'SuperAdmin!2026#Secure';

    if (localAllowed && email.trim().toLowerCase() === localEmail && password === localPassword) {
      const localUser: User = {
        id: 'local-superadmin',
        email: localEmail,
        name: 'Super Admin',
        role: 'admin',
        createdAt: new Date(),
      };

      localStorage.setItem(LOCAL_SUPERADMIN_STORAGE_KEY, JSON.stringify(localUser));
      setUser(localUser);
      return localUser;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return null;
    }

    localStorage.removeItem(LOCAL_SUPERADMIN_STORAGE_KEY);
    return loadProfile(data.session);
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_SUPERADMIN_STORAGE_KEY);
    setUser(null);
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
