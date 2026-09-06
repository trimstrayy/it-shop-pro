import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, UpdateProfileResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// Authentication must always go through Supabase Auth. No local, hardcoded, or env-based shortcuts are allowed.
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
  updateProfile: (updates: { name?: string; email?: string }) => Promise<UpdateProfileResult>;
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
  const [isInitializing, setIsInitializing] = useState(true);

  const loadProfile = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, avatar_url, is_active, created_at, tenant_id, is_platform_admin')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();

    if (error || !data || !data.is_active) {
      setUser(null);
      // A missing or inactive profile must not retain an otherwise-valid Auth session.
      await supabase.auth.signOut({ scope: 'local' });
      return null;
    }

    const { data: tenant } = data.tenant_id
      ? await supabase.from('tenants').select('business_type').eq('id', data.tenant_id).maybeSingle()
      : { data: null };

    const mappedUser: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      tenantId: data.tenant_id ?? null,
      accountType: tenant?.business_type ?? null,
      isPlatformAdmin: Boolean(data.is_platform_admin),
      avatar: data.avatar_url || undefined,
      createdAt: new Date(data.created_at),
    };

    console.log('[AuthContext] loaded profile', {
      authUserId: session.user.id,
      email: data.email,
      role: data.role,
      tenantId: data.tenant_id,
      isPlatformAdmin: data.is_platform_admin,
      isActive: data.is_active,
      name: data.name,
    });

    setUser(mappedUser);
    return mappedUser;
  };

  useEffect(() => {
    const refreshSessionProfile = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setUser(null);
        return;
      }

      await loadProfile(data.session);
    };

    const initializeSession = async () => {
      try {
        await refreshSessionProfile();
      } finally {
        setIsInitializing(false);
      }
    };

    void initializeSession();

    // Keep the current profile aligned with auth events: sign-in, token refresh, and sign-out are handled here,
    // and a periodic recheck ensures a deactivated account is forcibly logged out even if another tab is already open.
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          return;
        }

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await loadProfile(session);
          return;
        }

        await loadProfile(session);
      })();
    });

    const recheckInterval = window.setInterval(() => {
      void refreshSessionProfile();
    }, 30000);

    const handleWindowFocus = () => {
      void refreshSessionProfile();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearInterval(recheckInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error || !data.session) {
      return null;
    }

    return loadProfile(data.session);
  };

  const logout = () => {
    setUser(null);
    void supabase.auth.signOut();
  };

  /**
   * Update the signed-in user's profile.
   *
   * Name changes are written to both the Auth metadata and the public.profiles
   * row (allowed by the profiles_user_self_update RLS policy). Email changes go
   * through Supabase Auth only — a dedicated DB trigger keeps public.profiles in
   * sync, because the RLS policy intentionally prevents clients from editing the
   * email column of their own profile row.
   */
  const updateProfile = async (updates: { name?: string; email?: string }): Promise<UpdateProfileResult> => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user || !user) {
      return { error: 'You must be signed in to update your profile.', emailConfirmationPending: false };
    }

    const trimmedName = updates.name === undefined ? '' : updates.name.trim();
    const normalizedEmail = updates.email === undefined ? '' : updates.email.trim().toLowerCase();

    const hasNameChange = updates.name !== undefined && trimmedName !== user.name;
    const hasEmailChange = updates.email !== undefined && normalizedEmail !== user.email;

    const authUpdates: { email?: string; data?: { name?: string } } = {};
    if (hasEmailChange) authUpdates.email = normalizedEmail;
    if (hasNameChange) authUpdates.data = { name: trimmedName };

    let emailConfirmationPending = false;
    if (Object.keys(authUpdates).length > 0) {
      const { data: authData, error } = await supabase.auth.updateUser(authUpdates);
      if (error) return { error: error.message, emailConfirmationPending: false };
      // When the project requires email confirmation, the new address is stored
      // on new_email and the current email only changes after confirmation.
      emailConfirmationPending = Boolean(authData.user?.new_email);
    }

    if (hasNameChange) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: trimmedName })
        .eq('auth_user_id', session.user.id);

      if (profileError) return { error: profileError.message, emailConfirmationPending: false };
    }

    await loadProfile(session);

    return { error: null, emailConfirmationPending };
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has full access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isInitializing, login, logout, hasPermission, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
