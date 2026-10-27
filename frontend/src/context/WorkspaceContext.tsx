import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, AccountType } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Studio, StudioRole, UserRole } from '../types';

// Hằng số UUID hợp lệ chuẩn RFC 4122 cho chế độ Fallback / Demo Role Switcher
const FALLBACK_ADMIN_STUDIO_ID = 'a0000000-0000-0000-0000-000000000001';
const FALLBACK_MEMBER_STUDIO_ID = 'a0000000-0000-0000-0000-000000000002';

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

// Helper lấy role lưu trữ từ localStorage để loại bỏ UI Flickering
const getSavedActiveRole = (): AccountType => {
  try {
    const saved = localStorage.getItem('lensy_active_role');
    if (saved === 'freelancer' || saved === 'studio_member' || saved === 'studio_admin') {
      return saved as AccountType;
    }
  } catch (e) {
    // Ignore error
  }
  return 'studio_admin';
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Khởi tạo state từ localStorage (Persist Demo Role Switcher)
  const initialSavedType = getSavedActiveRole();
  const initialResolvedRole: UserRole =
    initialSavedType === 'freelancer'
      ? 'freelancer'
      : initialSavedType === 'studio_member'
      ? 'member'
      : 'manager';

  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);
  const [studioRole, setStudioRole] = useState<StudioRole | null>(
    initialSavedType === 'studio_admin' ? 'admin' : 'photographer'
  );
  const [isStudioAdmin, setIsStudioAdmin] = useState<boolean>(initialSavedType === 'studio_admin');
  const [isStudioOwner, setIsStudioOwner] = useState<boolean>(initialSavedType === 'studio_admin');
  const [userStudios, setUserStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [accountType, setAccountType] = useState<AccountType>(initialSavedType);
  const [userRole, setUserRole] = useState<UserRole>(initialResolvedRole);

  // Ref lưu trạng thái đang fetch để tránh nhiều fetch chồng chéo
  const isFetchingRef = useRef(false);

  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      setCurrentStudio(null);
      setStudioRole(null);
      setIsStudioAdmin(false);
      setIsStudioOwner(false);
      setUserStudios([]);
      setIsLoading(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // STALE-WHILE-REVALIDATE: Giữ nguyên state cũ, không reset isStudioAdmin hay role về default!
    try {
      const savedActiveRole = getSavedActiveRole();
      let resolvedRole: UserRole = 'manager';
      let resolvedType: AccountType = 'studio_admin';
      let resolvedStudio: Studio | null = null;
      let resolvedUserStudios: Studio[] = [];
      let resolvedStudioRole: StudioRole | null = 'admin';
      let resolvedIsAdmin = true;
      let resolvedIsOwner = true;

      // 1. Phân tích Metadata mặc định
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
      } else if (userMetaType === 'freelancer') {
        resolvedType = 'freelancer';
        resolvedRole = 'freelancer';
      }

      if (isSupabaseConfigured && isValidUuid(user.id)) {
        // Query song song để tối ưu tốc độ và không giật state
        const [dbUserRes, ownedStudiosRes, memberRecordsRes] = await Promise.all([
          supabase
            .from('users')
            .select('role, studio_id')
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

        const safeDbStudioId = isValidUuid(dbUser?.studio_id) ? dbUser!.studio_id : null;

        // Nếu user là chủ Studio (Owner/Admin)
        if (ownedStudios && ownedStudios.length > 0) {
          resolvedStudio = ownedStudios[0] as Studio;
          resolvedUserStudios = ownedStudios as Studio[];
          resolvedStudioRole = 'admin';
          resolvedIsAdmin = true;
          resolvedIsOwner = true;
          resolvedType = 'studio_admin';
          resolvedRole = 'manager';
        } else if (memberRecords && memberRecords.length > 0) {
          const firstApproved = memberRecords[0];
          resolvedStudio = firstApproved.studios as unknown as Studio;
          resolvedUserStudios = memberRecords.map(m => m.studios as unknown as Studio).filter(Boolean);
          resolvedStudioRole = firstApproved.role as StudioRole;
          const isAdmin = firstApproved.role === 'admin';
          resolvedIsAdmin = isAdmin;
          resolvedIsOwner = false;
          resolvedType = isAdmin ? 'studio_admin' : 'studio_member';
          resolvedRole = isAdmin ? 'manager' : 'member';
        } else {
          // Fallback an toàn
          if (dbUser?.role === 'freelancer' || resolvedRole === 'freelancer') {
            resolvedStudio = null;
            resolvedStudioRole = null;
            resolvedIsAdmin = false;
            resolvedIsOwner = false;
            resolvedUserStudios = [];
            resolvedType = 'freelancer';
            resolvedRole = 'freelancer';
          } else if (dbUser?.role === 'member' || resolvedRole === 'member') {
            resolvedStudio = {
              id: safeDbStudioId || FALLBACK_MEMBER_STUDIO_ID,
              name: user.user_metadata?.studio_name || 'Mirmia Studio Partner',
              logo_url: '/mirmia-logo.png',
              invite_code: 'MIRMIA-JOIN',
              verified_status: true,
              owner_id: user.id,
            };
            resolvedUserStudios = [resolvedStudio];
            resolvedStudioRole = 'photographer';
            resolvedIsAdmin = false;
            resolvedIsOwner = false;
            resolvedType = 'studio_member';
            resolvedRole = 'member';
          } else {
            resolvedStudio = {
              id: safeDbStudioId || FALLBACK_ADMIN_STUDIO_ID,
              name: user.user_metadata?.studio_name || 'MIRMIA STUDIO & ACADEMY WORKSPACE',
              logo_url: '/mirmia-logo.png',
              invite_code: 'MIRMIA-VIP88',
              verified_status: true,
              owner_id: user.id,
            };
            resolvedUserStudios = [resolvedStudio];
            resolvedStudioRole = 'admin';
            resolvedIsAdmin = true;
            resolvedIsOwner = true;
            resolvedType = 'studio_admin';
            resolvedRole = 'manager';
          }
        }
      } else {
        // Mock fallback khi chưa kết nối Supabase
        const mockStudio: Studio = {
          id: FALLBACK_ADMIN_STUDIO_ID,
          name: 'MIRMIA STUDIO & ACADEMY WORKSPACE',
          logo_url: '/mirmia-logo.png',
          invite_code: 'MIRMIA-VIP88',
          verified_status: true,
          owner_id: user.id,
        };
        resolvedStudio = mockStudio;
        resolvedUserStudios = [mockStudio];
        resolvedStudioRole = 'admin';
        resolvedIsAdmin = true;
        resolvedIsOwner = true;
        resolvedType = 'studio_admin';
        resolvedRole = 'manager';
      }

      // NẾU NGƯỜI DÙNG ĐÃ CHỌN ROLE QUA ROLE SWITCHER, DUY TRÌ LỰA CHỌN ĐÓ (PERSIST DEMO ROLE)
      if (savedActiveRole) {
        if (savedActiveRole === 'studio_admin') {
          resolvedType = 'studio_admin';
          resolvedRole = 'manager';
          resolvedIsAdmin = true;
        } else if (savedActiveRole === 'studio_member') {
          resolvedType = 'studio_member';
          resolvedRole = 'member';
          resolvedIsAdmin = false;
        } else if (savedActiveRole === 'freelancer') {
          resolvedType = 'freelancer';
          resolvedRole = 'freelancer';
          resolvedIsAdmin = false;
        }
      }

      // BATCH UPDATE TOÀN BỘ STATE MỘT LẦN DUY NHẤT (Không có intermediate state gây flash)
      setCurrentStudio(resolvedStudio);
      setUserStudios(resolvedUserStudios);
      setStudioRole(resolvedStudioRole);
      setIsStudioAdmin(resolvedIsAdmin);
      setIsStudioOwner(resolvedIsOwner);
      setAccountType(resolvedType);
      setUserRole(resolvedRole);
    } catch (err) {
      console.error('[WorkspaceContext] Lỗi tải thông tin Workspace:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]); // QUAN TRỌNG: Chỉ re-run khi user.id thay đổi, không re-run khi chỉ re-focus tab

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  // Chuyển đổi nhanh giữa 3 góc nhìn vai trò (RBAC Switcher) kèm Lưu LocalStorage
  const switchAccountType = (newType: AccountType | UserRole) => {
    const normalizedType: AccountType =
      newType === 'manager' || newType === 'studio_admin'
        ? 'studio_admin'
        : newType === 'member' || newType === 'studio_member'
        ? 'studio_member'
        : 'freelancer';

    try {
      localStorage.setItem('lensy_active_role', normalizedType);
    } catch (e) {
      console.warn('Cannot write to localStorage', e);
    }

    const existingValidId = isValidUuid(currentStudio?.id) ? currentStudio!.id : null;

    if (normalizedType === 'freelancer') {
      setAccountType('freelancer');
      setUserRole('freelancer');
      setCurrentStudio(null);
      setStudioRole(null);
      setIsStudioAdmin(false);
      setIsStudioOwner(false);
    } else if (normalizedType === 'studio_member') {
      setAccountType('studio_member');
      setUserRole('member');
      const memberStudio: Studio = {
        id: existingValidId || FALLBACK_MEMBER_STUDIO_ID,
        name: user?.user_metadata?.studio_name || 'Mirmia Creative Team',
        logo_url: '/mirmia-logo.png',
        invite_code: 'MIRMIA-CREW',
        verified_status: true,
        owner_id: user?.id || FALLBACK_ADMIN_STUDIO_ID,
      };
      setCurrentStudio(memberStudio);
      setStudioRole('photographer');
      setIsStudioAdmin(false);
      setIsStudioOwner(false);
    } else {
      setAccountType('studio_admin');
      setUserRole('manager');
      const adminStudio: Studio = {
        id: existingValidId || FALLBACK_ADMIN_STUDIO_ID,
        name: user?.user_metadata?.studio_name || 'MIRMIA STUDIO & ACADEMY WORKSPACE',
        logo_url: '/mirmia-logo.png',
        invite_code: 'MIRMIA-VIP88',
        verified_status: true,
        owner_id: user?.id || FALLBACK_ADMIN_STUDIO_ID,
      };
      setCurrentStudio(adminStudio);
      setStudioRole('admin');
      setIsStudioAdmin(true);
      setIsStudioOwner(true);
    }
  };

  const switchRole = (newRole: UserRole) => {
    switchAccountType(newRole);
  };

  const isFreelancer = userRole === 'freelancer' || accountType === 'freelancer';
  const isMember = userRole === 'member' || accountType === 'studio_member';
  const isManager = userRole === 'manager' || accountType === 'studio_admin';

  return (
    <WorkspaceContext.Provider
      value={{
        currentStudio,
        studioRole,
        accountType,
        role: userRole,
        isManager,
        isStudioAdmin: isManager,
        isStudioOwner,
        isStudioMember: isMember,
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
