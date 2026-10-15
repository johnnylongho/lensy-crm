import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);
  const [studioRole, setStudioRole] = useState<StudioRole | null>(null);
  const [isStudioAdmin, setIsStudioAdmin] = useState(false);
  const [isStudioOwner, setIsStudioOwner] = useState(false);
  const [userStudios, setUserStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [accountType, setAccountType] = useState<AccountType>('studio_admin');
  const [userRole, setUserRole] = useState<UserRole>('manager');

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

    const userMetaRole = user.user_metadata?.role as UserRole | undefined;
    const userMetaType = user.user_metadata?.account_type as any;
    let initialType: AccountType = 'studio_admin';
    let resolvedRole: UserRole = 'manager';

    if (userMetaRole) {
      resolvedRole = userMetaRole;
      if (userMetaRole === 'manager') initialType = 'studio_admin';
      else if (userMetaRole === 'member') initialType = 'studio_member';
      else initialType = 'freelancer';
    } else if (userMetaType === 'studio' || userMetaType === 'studio_admin' || userMetaType === 'manager') {
      initialType = 'studio_admin';
      resolvedRole = 'manager';
    } else if (userMetaType === 'studio_member' || userMetaType === 'member') {
      initialType = 'studio_member';
      resolvedRole = 'member';
    } else if (userMetaType === 'freelancer') {
      initialType = 'freelancer';
      resolvedRole = 'freelancer';
    }

    setAccountType(initialType);
    setUserRole(resolvedRole);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured && isValidUuid(user.id)) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('role, studio_id')
          .eq('id', user.id)
          .maybeSingle();

        if (dbUser?.role) {
          if (dbUser.role === 'manager' || dbUser.role === 'admin') {
            resolvedRole = 'manager';
            initialType = 'studio_admin';
          } else if (dbUser.role === 'member' || dbUser.role === 'photographer' || dbUser.role === 'assistant' || dbUser.role === 'retoucher') {
            resolvedRole = 'member';
            initialType = 'studio_member';
          } else if (dbUser.role === 'freelancer') {
            resolvedRole = 'freelancer';
            initialType = 'freelancer';
          }
          setUserRole(resolvedRole);
          setAccountType(initialType);
        }

        // 1. Kiểm tra Studio do user sở hữu (Owner/Admin)
        const { data: ownedStudios } = await supabase
          .from('studios')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (ownedStudios && ownedStudios.length > 0) {
          const mainStudio = ownedStudios[0] as Studio;
          setCurrentStudio(mainStudio);
          setUserStudios(ownedStudios as Studio[]);
          setStudioRole('admin');
          setIsStudioAdmin(true);
          setIsStudioOwner(true);
          setAccountType('studio_admin');
          setUserRole('manager');
          return;
        }

        // 2. Kiểm tra Studio user là thành viên đã được duyệt (Approved Member)
        const { data: memberRecords } = await supabase
          .from('studio_members')
          .select('role, status, studios(*)')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        if (memberRecords && memberRecords.length > 0) {
          const firstApproved = memberRecords[0];
          const studioData = firstApproved.studios as unknown as Studio;
          const role = firstApproved.role as StudioRole;

          setCurrentStudio(studioData);
          setUserStudios(memberRecords.map(m => m.studios as unknown as Studio).filter(Boolean));
          setStudioRole(role);
          const isAdmin = role === 'admin';
          setIsStudioAdmin(isAdmin);
          setIsStudioOwner(false);
          setAccountType(isAdmin ? 'studio_admin' : 'studio_member');
          setUserRole(isAdmin ? 'manager' : 'member');
          return;
        }

        // 3. Fallback an toàn với UUID chuẩn (Tránh lỗi invalid input syntax for type uuid)
        const safeDbStudioId = isValidUuid(dbUser?.studio_id) ? dbUser!.studio_id : null;

        if (resolvedRole === 'freelancer') {
          setCurrentStudio(null);
          setStudioRole(null);
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setUserStudios([]);
          setAccountType('freelancer');
          setUserRole('freelancer');
        } else if (resolvedRole === 'member') {
          const memberStudio: Studio = {
            id: safeDbStudioId || FALLBACK_MEMBER_STUDIO_ID,
            name: user.user_metadata?.studio_name || 'Mirmia Studio Partner',
            logo_url: '/mirmia-logo.png',
            invite_code: 'MIRMIA-JOIN',
            verified_status: true,
            owner_id: user.id,
          };
          setCurrentStudio(memberStudio);
          setUserStudios([memberStudio]);
          setStudioRole('photographer');
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setAccountType('studio_member');
          setUserRole('member');
        } else {
          const defaultStudio: Studio = {
            id: safeDbStudioId || FALLBACK_ADMIN_STUDIO_ID,
            name: user.user_metadata?.studio_name || 'MIRMIA STUDIO & ACADEMY WORKSPACE',
            logo_url: '/mirmia-logo.png',
            invite_code: 'MIRMIA-VIP88',
            verified_status: true,
            owner_id: user.id,
          };
          setCurrentStudio(defaultStudio);
          setUserStudios([defaultStudio]);
          setStudioRole('admin');
          setIsStudioAdmin(true);
          setIsStudioOwner(true);
          setAccountType('studio_admin');
          setUserRole('manager');
        }
      } else {
        // Demo Mock Fallback khi chưa kết nối Supabase
        if (resolvedRole === 'freelancer') {
          setCurrentStudio(null);
          setStudioRole(null);
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setUserStudios([]);
          setAccountType('freelancer');
          setUserRole('freelancer');
        } else if (resolvedRole === 'member') {
          const memberStudio: Studio = {
            id: FALLBACK_MEMBER_STUDIO_ID,
            name: 'MIRMIA STUDIO (Ekip Member)',
            logo_url: '/mirmia-logo.png',
            invite_code: 'MIRMIA-MEM01',
            verified_status: true,
            owner_id: FALLBACK_ADMIN_STUDIO_ID,
          };
          setCurrentStudio(memberStudio);
          setUserStudios([memberStudio]);
          setStudioRole('photographer');
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setAccountType('studio_member');
          setUserRole('member');
        } else {
          const mockStudio: Studio = {
            id: FALLBACK_ADMIN_STUDIO_ID,
            name: 'MIRMIA STUDIO & ACADEMY WORKSPACE',
            logo_url: '/mirmia-logo.png',
            invite_code: 'MIRMIA-VIP88',
            verified_status: true,
            owner_id: user.id,
          };
          setCurrentStudio(mockStudio);
          setUserStudios([mockStudio]);
          setStudioRole('admin');
          setIsStudioAdmin(true);
          setIsStudioOwner(true);
          setAccountType('studio_admin');
          setUserRole('manager');
        }
      }
    } catch (err) {
      console.error('[WorkspaceContext] Lỗi tải thông tin Workspace:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  // Chuyển đổi nhanh giữa 3 góc nhìn vai trò (RBAC Switcher) dùng UUID chuẩn
  const switchAccountType = (newType: AccountType | UserRole) => {
    const existingValidId = isValidUuid(currentStudio?.id) ? currentStudio!.id : null;

    if (newType === 'freelancer') {
      setAccountType('freelancer');
      setUserRole('freelancer');
      setCurrentStudio(null);
      setStudioRole(null);
      setIsStudioAdmin(false);
      setIsStudioOwner(false);
    } else if (newType === 'studio_member' || newType === 'member') {
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
