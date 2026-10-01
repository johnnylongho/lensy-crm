import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Studio, StudioRole } from '../types';

interface WorkspaceContextType {
  currentStudio: Studio | null;
  studioRole: StudioRole | null;
  isStudioAdmin: boolean;
  isStudioOwner: boolean;
  isStudioMember: boolean;
  isFreelancer: boolean;
  isLoading: boolean;
  userStudios: Studio[];
  refreshWorkspace: () => Promise<void>;
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

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // 1. Kiểm tra Studio do user sở hữu (Owner)
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
          setIsStudioAdmin(role === 'admin');
          setIsStudioOwner(false);
          return;
        }

        // 3. User là Freelancer độc lập (Chưa thuộc Studio nào)
        setCurrentStudio(null);
        setStudioRole(null);
        setIsStudioAdmin(false);
        setIsStudioOwner(false);
        setUserStudios([]);
      } else {
        // Demo Mock Fallback
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

  const isStudioMember = !!currentStudio;
  const isFreelancer = !currentStudio;

  return (
    <WorkspaceContext.Provider
      value={{
        currentStudio,
        studioRole,
        isStudioAdmin,
        isStudioOwner,
        isStudioMember,
        isFreelancer,
        isLoading,
        userStudios,
        refreshWorkspace,
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
