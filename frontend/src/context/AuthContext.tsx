import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type AccountType = 'freelancer' | 'studio_member' | 'studio_admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    accountType?: AccountType | 'studio',
    extraInfo?: { studioName?: string; phone?: string }
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
      setUser(prev => {
        if (!session?.user) return null;
        if (prev && prev.id === session.user.id) {
          return prev;
        }
        return session.user;
      });
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
        user_metadata: {
          full_name: 'Mirmia Studio Manager',
          account_type: 'studio_admin',
        },
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

  // Hàm Đăng ký tài khoản mới với 3 phân loại: Freelancer, Thành viên Studio, Quản lý Studio
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    accountType: AccountType | 'studio' = 'freelancer',
    extraInfo?: { studioName?: string; phone?: string }
  ) => {
    // Chuẩn hóa loại tài khoản: 'studio' cũ map thành 'studio_admin'
    const normalizedType: AccountType = accountType === 'studio' ? 'studio_admin' : accountType;

    const metadata: Record<string, any> = {
      full_name: fullName || 'Thợ ảnh Lensy',
      account_type: normalizedType,
    };

    if (normalizedType === 'studio_admin') {
      metadata.studio_name = extraInfo?.studioName || `${fullName || 'Studio'} Workspace`;
      metadata.is_studio_owner = true;
    } else if (normalizedType === 'studio_member') {
      metadata.studio_name = extraInfo?.studioName || 'Studio Cộng Tác';
      metadata.is_studio_owner = false;
    } else {
      metadata.is_studio_owner = false;
    }

    if (extraInfo?.phone) {
      metadata.phone = extraInfo.phone;
    }

    if (!isSupabaseConfigured) {
      const mockUser = {
        id: 'mock-user-id',
        email,
        user_metadata: metadata,
      } as any;
      setUser(mockUser);
      return { error: null, user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
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
