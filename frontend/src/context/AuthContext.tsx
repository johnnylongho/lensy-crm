import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Lấy session hiện tại khi ứng dụng khởi động
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Lắng nghe thay đổi trạng thái đăng nhập (onAuthStateChange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hàm Đăng nhập bằng Email & Mật khẩu
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Demo mock fallback
      const mockUser = {
        id: 'mock-user-id',
        email,
        user_metadata: { full_name: 'Mirmia Photographer (Demo)' },
      } as any;
      setUser(mockUser);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      console.error('[Supabase Auth] Lỗi đăng nhập:', err);
      return { error: err };
    }
  };

  // Hàm Đăng ký tài khoản mới bằng Email & Mật khẩu
  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) {
      const mockUser = {
        id: 'mock-user-id',
        email,
        user_metadata: { full_name: fullName || 'Mirmia Photographer' },
      } as any;
      setUser(mockUser);
      return { error: null, user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || 'Mirmia Photographer',
            studio_name: 'MIRMIA STUDIO & ACADEMY',
          },
        },
      });

      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      return { error: null, user: data.user };
    } catch (err: any) {
      console.error('[Supabase Auth] Lỗi đăng ký:', err);
      return { error: err, user: null };
    }
  };

  // Hàm Đăng xuất
  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
