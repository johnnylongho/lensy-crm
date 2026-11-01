import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, AccountType } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Studio, StudioRole, UserRole } from '../types';

export const isValidUuid = (value?: string | null): boolean => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

interface WorkspaceContextType {
  currentStudio: Studio | null;
  studioRole: StudioRole | null;
  accountType: AccountType;
  role: UserRole;
  isManager: boolean;
  isStudioAdmin: boolean;
  isStudioOwner: boolean;
  isStudioMember: boolean;
  isMember: boolean;
  isFreelancer: boolean;
  isLoading: boolean;
  userStudios: Studio[];
  refreshWorkspace: () => Promise<void>;
  switchAccountType?: (newType: AccountType | UserRole) => void;
  switchRole?: (newRole: UserRole) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // KHÓA CỨNG: Mặc định khởi tạo theo user_metadata hoặc freelancer (Không đọc từ localStorage)
  const initialType: AccountType = (user?.user_metadata?.account_type as AccountType) || 'freelancer';
  const initialResolvedRole: UserRole =
    initialType === 'freelancer'
      ? 'freelancer'
      : initialType === 'studio_member'
      ? 'member'
      : 'manager';

  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);
  const [studioRole, setStudioRole] = useState<StudioRole | null>(
    initialType === 'studio_admin' ? 'admin' : initialType === 'studio_member' ? 'photographer' : null
  );
  const [isStudioAdminState, setIsStudioAdminState] = useState<boolean>(initialType === 'studio_admin');
  const [isStudioOwner, setIsStudioOwner] = useState<boolean>(initialType === 'studio_admin');
  const [userStudios, setUserStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [userRole, setUserRole] = useState<UserRole>(initialResolvedRole);

  // Ref lưu trạng thái đang fetch để tránh nhiều fetch chồng chéo
  const isFetchingRef = useRef(false);

  // Xóa sạch vết tích role giả lập cũ nếu có trong localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('lensy_active_role');
    } catch (_) {}
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      setCurrentStudio(null);
      setStudioRole(null);
      setIsStudioAdminState(false);
      setIsStudioOwner(false);
      setUserStudios([]);
      setAccountType('freelancer');
      setUserRole('freelancer');
      setIsLoading(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      let resolvedRole: UserRole = 'freelancer';
      let resolvedType: AccountType = 'freelancer';
      let resolvedStudio: Studio | null = null;
      let resolvedUserStudios: Studio[] = [];
      let resolvedStudioRole: StudioRole | null = null;
      let resolvedIsAdmin = false;
      let resolvedIsOwner = false;

      // 1. Phân tích Metadata mặc định khi đăng ký
      const userMetaRole = user.user_metadata?.role as UserRole | undefined;
      const userMetaType = user.user_metadata?.account_type as any;
      if (userMetaRole) {
        resolvedRole = userMetaRole;
        if (userMetaRole === 'manager') resolvedType = 'studio_admin';
        else if (userMetaRole === 'member') resolvedType = 'studio_member';
        else resolvedType = 'freelancer';
      } else if (userMetaType === 'studio' || userMetaType === 'studio_admin' || userMetaType === 'manager') {
        resolvedType = 'studio_admin';
        resolvedRole = 'manager';
      } else if (userMetaType === 'studio_member' || userMetaType === 'member') {
        resolvedType = 'studio_member';
        resolvedRole = 'member';
      } else {
        resolvedType = 'freelancer';
        resolvedRole = 'freelancer';
      }

      // 2. Query dữ liệu thực tế từ Supabase DB
      if (isSupabaseConfigured && user.id) {
        const [dbUserRes, ownedStudiosRes, memberRecordsRes] = await Promise.all([
          supabase
            .from('users')
            .select('role, studio_id, account_type')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('studios')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('studio_members')
            .select('role, status, studios(*)')
            .eq('user_id', user.id)
            .eq('status', 'approved'),
        ]);

        const dbUser = dbUserRes.data;
        const ownedStudios = ownedStudiosRes.data;
        const memberRecords = memberRecordsRes.data;

        // ƯU TIÊN 1: Nếu user là chủ sở hữu thực sự của Studio trong DB (Studio Owner/Admin)
        if (ownedStudios && ownedStudios.length > 0) {
          resolvedStudio = ownedStudios[0] as Studio;
          resolvedUserStudios = ownedStudios as Studio[];
          resolvedStudioRole = 'admin';
          resolvedIsAdmin = true;
          resolvedIsOwner = true;
          resolvedType = 'studio_admin';
          resolvedRole = 'manager';
        }
        // ƯU TIÊN 2: Nếu user là thành viên được duyệt trong Studio (Studio Member)
        else if (memberRecords && memberRecords.length > 0) {
          const firstApproved = memberRecords[0];
          resolvedStudio = firstApproved.studios as unknown as Studio;
          resolvedUserStudios = memberRecords.map(m => m.studios as unknown as Studio).filter(Boolean);
          resolvedStudioRole = firstApproved.role as StudioRole;
          const isAdmin = firstApproved.role === 'admin';
          resolvedIsAdmin = isAdmin;
          resolvedIsOwner = false;
          resolvedType = isAdmin ? 'studio_admin' : 'studio_member';
          resolvedRole = isAdmin ? 'manager' : 'member';
        }
        // ƯU TIÊN 3: Dựa trên cột account_type thực tế trong bảng users
        else if (dbUser?.account_type) {
          if (dbUser.account_type === 'studio_admin') {
            resolvedType = 'studio_admin';
            resolvedRole = 'manager';
            resolvedIsAdmin = true;
            resolvedIsOwner = true;
          } else if (dbUser.account_type === 'studio_member') {
            resolvedType = 'studio_member';
            resolvedRole = 'member';
            resolvedIsAdmin = false;
            resolvedIsOwner = false;
          } else {
            resolvedType = 'freelancer';
            resolvedRole = 'freelancer';
            resolvedIsAdmin = false;
            resolvedIsOwner = false;
          }
        }
      }

      // Cập nhật State từ DB (Không có bất kỳ override nào từ LocalStorage)
      setCurrentStudio(resolvedStudio);
      setUserStudios(resolvedUserStudios);
      setStudioRole(resolvedStudioRole);
      setIsStudioAdminState(resolvedIsAdmin);
      setIsStudioOwner(resolvedIsOwner);
      setAccountType(resolvedType);
      setUserRole(resolvedRole);
    } catch (err) {
      console.error('[WorkspaceContext] Lỗi tải thông tin Workspace từ Supabase:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  // HÀM SWITCH ROLE: Chỉ duy nhất developer master johnnyho1705@gmail.com được phép chuyển đổi để test giao diện
  const switchAccountType = (newType: AccountType | UserRole) => {
    if (user?.email !== 'johnnyho1705@gmail.com') {
      console.warn('[RBAC Security] Chặn hành vi role spoofing từ user:', user?.email);
      return;
    }

    const normalizedType: AccountType =
      newType === 'manager' || newType === 'studio_admin'
        ? 'studio_admin'
        : newType === 'member' || newType === 'studio_member'
        ? 'studio_member'
        : 'freelancer';

    if (normalizedType === 'freelancer') {
      setAccountType('freelancer');
      setUserRole('freelancer');
      setCurrentStudio(null);
      setStudioRole(null);
      setIsStudioAdminState(false);
      setIsStudioOwner(false);
    } else if (normalizedType === 'studio_member') {
      setAccountType('studio_member');
      setUserRole('member');
      setStudioRole('photographer');
      setIsStudioAdminState(false);
      setIsStudioOwner(false);
    } else {
      setAccountType('studio_admin');
      setUserRole('manager');
      setStudioRole('admin');
      setIsStudioAdminState(true);
      setIsStudioOwner(true);
    }
  };

  const switchRole = (newRole: UserRole) => {
    switchAccountType(newRole);
  };

  // GÁN CỨNG QUYỀN HẠN PHỤ THUỘC 100% VÀO DỮ LIỆU THỰC TẾ
  const isFreelancer = accountType === 'freelancer' || userRole === 'freelancer';
  const isStudioMember = accountType === 'studio_member' || userRole === 'member';
  const isStudioAdmin = accountType === 'studio_admin' || userRole === 'manager' || isStudioAdminState;
  const isManager = isStudioAdmin;
  const isMember = isStudioMember;

  return (
    <WorkspaceContext.Provider
      value={{
        currentStudio,
        studioRole,
        accountType,
        role: userRole,
        isManager,
        isStudioAdmin,
        isStudioOwner,
        isStudioMember,
        isMember,
        isFreelancer,
        isLoading,
        userStudios,
        refreshWorkspace,
        switchAccountType,
        switchRole,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
