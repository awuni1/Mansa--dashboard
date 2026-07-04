'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        const { data, error } = await api.getMe();
        if (data && !error) {
          setUser(data);
        } else {
          // Token is invalid, clear it
          api.setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await api.login(email, password);

    if (error) {
      setLoading(false);
      return { error };
    }

    if (data) {
      // Always verify role via a server-validated getMe() call — never trust JWT payload decoded client-side
      const { data: userData, error: userError } = await api.getMe();
      if (userData && !userError) {
        if (userData.role !== 'admin' && userData.role !== 'super_admin') {
          await api.logout();
          setLoading(false);
          return { error: 'Access denied. Admin privileges required.' };
        }
        setUser(userData);
        // Set a session cookie so Next.js middleware can gate /dashboard/* server-side
        document.cookie = 'dash_session=1; path=/; SameSite=Strict; max-age=28800';
      } else {
        await api.logout();
        setLoading(false);
        return { error: userError || 'Failed to verify credentials' };
      }
    }

    setLoading(false);
    return {};
  };

  const signOut = async () => {
    await api.logout();
    setUser(null);
    document.cookie = 'dash_session=; path=/; max-age=0';
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}