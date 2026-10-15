import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, AccountType } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Studio, StudioRole } from '../types';

interface WorkspaceContextType {
  currentStudio: Studio | null;
  studioRole: StudioRole | null;
  accountType: AccountType;
  isStudioAdmin: boolean;
  isStudioOwner: boolean;
  isStudioMember: boolean;
  isFreelancer: boolean;
  isLoading: boolean;
  userStudios: Studio[];
  refreshWorkspace: () => Promise<void>;
  switchAccountType?: (newType: AccountType) => void;
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

  // Local account type override (cho phép chuyển đổi demo hoặc nhận từ metadata)
  const [accountType, setAccountType] = useState<AccountType>('studio_admin');

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

    // Đọc loại tài khoản từ metadata
    const userMetaType = user.user_metadata?.account_type as AccountType | 'studio' | undefined;
    let initialType: AccountType = 'freelancer';
    if (userMetaType === 'studio' || userMetaType === 'studio_admin') {
      initialType = 'studio_admin';
    } else if (userMetaType === 'studio_member') {
      initialType = 'studio_member';
    } else if (userMetaType === 'freelancer') {
      initialType = 'freelancer';
    } else {
      // Mặc định studio_admin để có trải nghiệm đầy đủ
      initialType = 'studio_admin';
    }
    setAccountType(initialType);

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
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
          return;
        }

        // 3. User là Freelancer độc lập hoặc theo metadata
        if (initialType === 'freelancer') {
          setCurrentStudio(null);
          setStudioRole(null);
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setUserStudios([]);
          setAccountType('freelancer');
        } else if (initialType === 'studio_member') {
          // Tạo mock studio liên kết cho thành viên
          const memberStudio: Studio = {
            id: 'studio-collab-001',
            name: user.user_metadata?.studio_name || 'Mirmia Studio Partner',
            logo_url: '/mirmia-logo.png',
            verified_status: true,
            owner_id: 'studio-lead-id',
          };
          setCurrentStudio(memberStudio);
          setUserStudios([memberStudio]);
          setStudioRole('photographer');
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setAccountType('studio_member');
        } else {
          // Studio Admin
          const defaultStudio: Studio = {
            id: 'studio-owner-001',
            name: user.user_metadata?.studio_name || 'Studio Của Tôi',
            logo_url: '/mirmia-logo.png',
            verified_status: true,
            owner_id: user.id,
          };
          setCurrentStudio(defaultStudio);
          setUserStudios([defaultStudio]);
          setStudioRole('admin');
          setIsStudioAdmin(true);
          setIsStudioOwner(true);
          setAccountType('studio_admin');
        }
      } else {
        // Demo Mock Fallback dựa theo accountType
        if (initialType === 'freelancer') {
          setCurrentStudio(null);
          setStudioRole(null);
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setUserStudios([]);
          setAccountType('freelancer');
        } else if (initialType === 'studio_member') {
          const memberStudio: Studio = {
            id: 'mirmia-studio-collab',
            name: 'MIRMIA STUDIO (Ekip Member)',
            logo_url: '/mirmia-logo.png',
            verified_status: true,
            owner_id: 'other-owner-id',
          };
          setCurrentStudio(memberStudio);
          setUserStudios([memberStudio]);
          setStudioRole('photographer');
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
          setAccountType('studio_member');
        } else {
          const mockStudio: Studio = {
            id: 'a0000000-0000-0000-0000-000000000001',
            name: 'MIRMIA STUDIO & ACADEMY WORKSPACE',
            logo_url: '/mirmia-logo.png',
            verified_status: true,
            owner_id: user.id,
          };
          setCurrentStudio(mockStudio);
          setUserStudios([mockStudio]);
          setStudioRole('admin');
          setIsStudioAdmin(true);
          setIsStudioOwner(true);
          setAccountType('studio_admin');
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

  // Cho phép chuyển đổi nhanh giữa 3 góc nhìn tài khoản để kiểm thử hoặc trải nghiệm
  const switchAccountType = (newType: AccountType) => {
    setAccountType(newType);
    if (newType === 'freelancer') {
      setCurrentStudio(null);
      setStudioRole(null);
      setIsStudioAdmin(false);
      setIsStudioOwner(false);
    } else if (newType === 'studio_member') {
      const memberStudio: Studio = {
        id: 'studio-collab-001',
        name: user?.user_metadata?.studio_name || 'Mirmia Creative Team',
        logo_url: '/mirmia-logo.png',
        verified_status: true,
        owner_id: 'studio-lead-id',
      };
      setCurrentStudio(memberStudio);
      setStudioRole('photographer');
      setIsStudioAdmin(false);
      setIsStudioOwner(false);
    } else {
      const adminStudio: Studio = {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: user?.user_metadata?.studio_name || 'MIRMIA STUDIO & ACADEMY',
        logo_url: '/mirmia-logo.png',
        verified_status: true,
        owner_id: user?.id || 'owner-id',
      };
      setCurrentStudio(adminStudio);
      setStudioRole('admin');
      setIsStudioAdmin(true);
      setIsStudioOwner(true);
    }
  };

  const isFreelancer = accountType === 'freelancer';
  const isStudioMember = accountType === 'studio_member';
  const isStudioAdminResolved = accountType === 'studio_admin';

  return (
    <WorkspaceContext.Provider
      value={{
        currentStudio,
        studioRole,
        accountType,
        isStudioAdmin: isStudioAdminResolved,
        isStudioOwner,
        isStudioMember,
        isFreelancer,
        isLoading,
        userStudios,
        refreshWorkspace,
        switchAccountType,
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
