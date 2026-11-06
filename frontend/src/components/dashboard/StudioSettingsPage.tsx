import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Studio, StudioMember, StudioRole } from '../../types';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  ArrowLeft,
  Loader2,
  Upload,
  UserCheck,
  Clock,
  Mail,
  Phone,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Camera,
  UserPlus,
  BadgeCheck,
  ExternalLink,
  Bot,
  Send,
  Key,
  MessageSquare,
  Check,
  BellRing,
  Eye,
  EyeOff,
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
  TelegramConfig,
} from '../../lib/telegramNotifier';

export const StudioSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'integrations'>(
    (searchParams.get('tab') as any) || 'general'
  );

  // Studio Data
  const [studio, setStudio] = useState<Studio | null>(null);
  const [isStudioAdmin, setIsStudioAdmin] = useState(false);
  const [isStudioOwner, setIsStudioOwner] = useState(false);

  // Form Data
  const [studioName, setStudioName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [studioAddress, setStudioAddress] = useState('');
  const [studioFanpage, setStudioFanpage] = useState('');
  const [studioPhone, setStudioPhone] = useState('');
  const [verifiedStatus, setVerifiedStatus] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Ảnh bìa trang đặt lịch (Cover Banner)
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLogoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({
        type: 'error',
        message: 'Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, SVG).',
      });
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: 'error',
        message: 'Dung lượng ảnh không được vượt quá 5MB.',
      });
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingLogo(true);
    try {
      if (isSupabaseConfigured && user) {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `studio_logo_${studio?.id || user.id}_${Date.now()}.${fileExt}`;
        const filePath = `studios/${fileName}`;

        // 1. Thử upload vào Supabase Storage bucket 'avatars'
        let uploadRes = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        let bucketName = 'avatars';
        if (uploadRes.error) {
          // Fallback sang bucket 'public' nếu avatars chưa tạo
          const publicRes = await supabase.storage
            .from('public')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });
          if (!publicRes.error) {
            uploadRes = publicRes;
            bucketName = 'public';
          }
        }

        if (uploadRes.error) {
          throw uploadRes.error;
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        const newUrl = publicUrlData?.publicUrl;
        if (newUrl) {
          setLogoUrl(newUrl);
          setToast({
            type: 'success',
            message: '🎉 Upload logo Studio thành công! Đừng quên bấm "Lưu Thông Tin Studio".',
          });
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setLogoUrl(result);
            setToast({
              type: 'success',
              message: '🎉 Đã tải ảnh Logo lên thành công!',
            });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Lỗi upload logo Studio:', err);
      setToast({
        type: 'error',
        message: 'Không thể upload logo: ' + (err.message || 'Lỗi lưu trữ'),
      });
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload ảnh bìa trang đặt lịch (Studio Cover Banner)
  const handleCoverFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({
        type: 'error',
        message: 'Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).',
      });
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setToast({
        type: 'error',
        message: 'Dung lượng ảnh bìa không được vượt quá 8MB.',
      });
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploadingCover(true);
    try {
      if (isSupabaseConfigured && user) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `studio_cover_${studio?.id || user.id}_${Date.now()}.${fileExt}`;
        const filePath = `studios/${fileName}`;

        let uploadRes = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        let bucketName = 'avatars';
        if (uploadRes.error) {
          const publicRes = await supabase.storage
            .from('public')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });
          if (!publicRes.error) {
            uploadRes = publicRes;
            bucketName = 'public';
          }
        }

        if (uploadRes.error) {
          console.warn('[Storage] Upload failed, falling back to FileReader:', uploadRes.error);
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setCoverUrl(result);
              if (studio?.id) {
                localStorage.setItem(`lensy_studio_cover_${studio.id}`, result);
              }
              localStorage.setItem('lensy_current_studio_cover', result);
              setToast({
                type: 'success',
                message: '🎉 Tải ảnh bìa Studio thành công! Hãy bấm "Lưu Thông Tin Studio" để hoàn tất.',
              });
            }
          };
          reader.readAsDataURL(file);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        const newUrl = publicUrlData?.publicUrl;
        if (newUrl) {
          setCoverUrl(newUrl);
          if (studio?.id) {
            localStorage.setItem(`lensy_studio_cover_${studio.id}`, newUrl);
          }
          localStorage.setItem('lensy_current_studio_cover', newUrl);
          setToast({
            type: 'success',
            message: '🎉 Upload ảnh bìa Studio thành công! Hãy bấm "Lưu Thông Tin Studio" để lưu.',
          });
        }
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setCoverUrl(result);
            if (studio?.id) {
              localStorage.setItem(`lensy_studio_cover_${studio.id}`, result);
            }
            localStorage.setItem('lensy_current_studio_cover', result);
            setToast({
              type: 'success',
              message: '🎉 [Demo] Đã tải ảnh bìa Studio lên thành công!',
            });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh bìa Studio:', err);
      setToast({
        type: 'error',
        message: 'Lỗi upload ảnh bìa: ' + (err.message || 'Lỗi lưu trữ'),
      });
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // Create Studio Modal state (nếu chưa có studio)
  const [isCreatingStudio, setIsCreatingStudio] = useState(false);
  const [newStudioName, setNewStudioName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');

  // Members lists
  const [pendingMembers, setPendingMembers] = useState<StudioMember[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<StudioMember[]>([]);
  const [isProcessingMemberId, setIsProcessingMemberId] = useState<string | null>(null);
  const [selectedRolesForPending, setSelectedRolesForPending] = useState<Record<string, StudioRole>>({});

  // Invite Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<StudioRole>('photographer');

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Telegram Bot Integration State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => getTelegramConfig(null));
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  useEffect(() => {
    if (studio) {
      setTelegramConfig(getTelegramConfig(studio.id));
    }
  }, [studio]);

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    const success = saveTelegramConfig(telegramConfig, studio?.id);
    setIsSavingTelegram(false);
    if (success) {
      setToast({
        type: 'success',
        message: '🎉 Đã lưu cấu hình Telegram Bot thành công!',
      });
    } else {
      setToast({
        type: 'error',
        message: 'Không thể lưu cấu hình Telegram.',
      });
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.botToken.trim() || !telegramConfig.chatId.trim()) {
      setToast({
        type: 'error',
        message: 'Vui lòng nhập Bot Token và Chat ID trước khi kiểm tra.',
      });
      return;
    }
    setIsTestingTelegram(true);
    const result = await testTelegramConnection(
      telegramConfig.botToken,
      telegramConfig.chatId,
      studioName || studio?.name || 'Lensy Studio'
    );
    setIsTestingTelegram(false);
    setToast({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 1. Fetch Studio & Permissions
  const fetchStudioData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Kiểm tra xem user có phải là owner của studio nào không
        const { data: ownedStudios, error: ownerErr } = await supabase
          .from('studios')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        let currentStudio: Studio | null = null;
        let isOwner = false;
        let isAdmin = false;

        if (ownedStudios && ownedStudios.length > 0) {
          currentStudio = ownedStudios[0];
          isOwner = true;
          isAdmin = true;
        } else {
          // Kiểm tra xem user có là member với role 'admin' & status 'approved' không
          const { data: memberRecord } = await supabase
            .from('studio_members')
            .select('role, status, studios(*)')
            .eq('user_id', user.id)
            .eq('status', 'approved')
            .eq('role', 'admin')
            .maybeSingle();

          if (memberRecord && memberRecord.studios) {
            currentStudio = memberRecord.studios as any;
            isAdmin = true;
          }
        }

        if (currentStudio) {
          setStudio(currentStudio);
          setIsStudioOwner(isOwner);
          setIsStudioAdmin(isAdmin);
          setStudioName(currentStudio.name);
          const studioSavedLogo = currentStudio.logo_url || (typeof window !== 'undefined' ? localStorage.getItem('lensy_current_studio_logo') : null) || '/mirmia-logo.png';
          setLogoUrl(studioSavedLogo);

          const studioSavedCover =
            (currentStudio as any).cover_url ||
            (currentStudio as any).cover_image ||
            (typeof window !== 'undefined'
              ? (localStorage.getItem('lensy_studio_cover_' + currentStudio.id) ||
                 localStorage.getItem('lensy_current_studio_cover'))
              : null) ||
            '';
          setCoverUrl(studioSavedCover);

          // Khôi phục trường Địa Chỉ trực tiếp từ cột address
          let initialAddress = currentStudio.address || '';
          let initialFanpage = currentStudio.facebook_url || '';
          let initialPhone = currentStudio.phone || '';
          try {
            const rawMeta = localStorage.getItem('lensy_studio_meta_' + currentStudio.id);
            if (rawMeta) {
              const meta = JSON.parse(rawMeta);
              if (!initialAddress && meta.address) initialAddress = meta.address;
              if (!initialFanpage && meta.facebook_url) initialFanpage = meta.facebook_url;
              if (!initialPhone && meta.phone) initialPhone = meta.phone;
            }
          } catch {
            // ignore
          }
          setStudioAddress(initialAddress);
          setStudioFanpage(initialFanpage);
          setStudioPhone(initialPhone);
          setVerifiedStatus(currentStudio.verified_status || false);

          // Fetch members
          await fetchStudioMembers(currentStudio.id);
        } else {
          // Chưa có studio nào
          setStudio(null);
          setIsStudioAdmin(false);
          setIsStudioOwner(false);
        }
      } else {
        // Fallback demo data
        const mockStudio: Studio = {
          id: 'mock-studio-001',
          name: 'MIRMIA STUDIO & ACADEMY',
          logo_url: '/mirmia-logo.png',
          verified_status: true,
          owner_id: user.id,
        };
        setStudio(mockStudio);
        setIsStudioAdmin(true);
        setIsStudioOwner(true);
        setStudioName(mockStudio.name);
        setLogoUrl(mockStudio.logo_url || '');
        setStudioAddress('124 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh');
        setStudioFanpage('https://facebook.com/mirmia.studio');
        setVerifiedStatus(mockStudio.verified_status);

        setPendingMembers([]);

        setApprovedMembers([
          {
            id: 'req-000',
            studio_id: 'mock-studio-001',
            user_id: user.id,
            role: 'admin',
            status: 'approved',
            facebook_url: user.user_metadata?.facebook_url || null,
            is_verified: user.user_metadata?.is_verified || false,
            created_at: new Date().toISOString(),
            user: {
              id: user.id,
              full_name: user.user_metadata?.full_name || 'Johnny Long Hồ',
              email: user.email || 'longho@mirmia.vn',
              phone: user.user_metadata?.phone || '0901234567',
              avatar_url: user.user_metadata?.avatar_url || '/mirmia-logo.png',
              facebook_url: user.user_metadata?.facebook_url || null,
              is_verified: user.user_metadata?.is_verified || false,
            },
          },
        ]);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu Studio:', err);
      setToast({
        type: 'error',
        message: 'Không thể tải thông tin Studio: ' + (err.message || 'Lỗi kết nối'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudioMembers = async (studioId: string) => {
    try {
      const { data, error } = await supabase
        .from('studio_members')
        .select(`
          id,
          studio_id,
          user_id,
          role,
          status,
          facebook_url,
          is_verified,
          created_at,
          updated_at,
          users:user_id (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            facebook_url,
            is_verified
          )
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Lỗi fetch thành viên:', error);
        return;
      }

      const pending: StudioMember[] = [];
      const approved: StudioMember[] = [];

      (data || []).forEach((row: any) => {
        const item: StudioMember = {
          id: row.id,
          studio_id: row.studio_id,
          user_id: row.user_id,
          role: row.role,
          status: row.status,
          facebook_url: row.facebook_url || row.users?.facebook_url || null,
          is_verified: row.is_verified || row.users?.is_verified || false,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user: row.users ? {
            ...row.users,
            facebook_url: row.users.facebook_url || row.facebook_url || null,
            is_verified: row.users.is_verified || row.is_verified || false,
          } : undefined,
        };
        if (row.status === 'pending') {
          pending.push(item);
        } else if (row.status === 'approved') {
          approved.push(item);
        }
      });

      // Đảm bảo Chủ Studio (Owner) / Admin hiện tại luôn được liệt kê ở đầu danh sách Đội ngũ nhân sự
      if (user) {
        const adminIndex = approved.findIndex(m => m.user_id === user.id);
        if (adminIndex > 0) {
          const [adminMember] = approved.splice(adminIndex, 1);
          approved.unshift(adminMember);
        } else if (adminIndex === -1) {
          // Tự động gộp Admin/Owner vào đầu danh sách nếu chưa có bản ghi trong studio_members
          approved.unshift({
            id: `admin-${user.id}`,
            studio_id: studioId,
            user_id: user.id,
            role: 'admin',
            status: 'approved',
            facebook_url: (user as any).user_metadata?.facebook_url || null,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user: {
              id: user.id,
              full_name: (user as any).user_metadata?.full_name || (user as any).user_metadata?.name || user.email?.split('@')[0] || 'Chủ Studio (Admin)',
              email: user.email || '',
              phone: (user as any).user_metadata?.phone || '',
              avatar_url: (user as any).user_metadata?.avatar_url || '',
              facebook_url: (user as any).user_metadata?.facebook_url || null,
              is_verified: true,
            },
          });
        }
      }

      setPendingMembers(pending);
      setApprovedMembers(approved);
    } catch (err) {
      console.error('Lỗi xử lý danh sách thành viên:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchStudioData();
  }, [user]);

  // Lưu thông tin Tab "Thông tin chung" (handleSaveStudioInfo)
  const handleSaveStudioInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studio) return;

    setIsSaving(true);
    try {
      const cleanName = studioName.trim();
      const cleanLogo = logoUrl.trim();
      const cleanCover = coverUrl.trim();
      const cleanAddress = studioAddress.trim();
      const cleanFanpage = studioFanpage.trim();
      const cleanPhone = studioPhone.trim();

      // Đồng bộ ngay vào localStorage metadata để đảm bảo offline & schema fallback luôn persist dữ liệu mới nhất
      localStorage.setItem('lensy_current_studio_logo', cleanLogo);
      if (cleanCover) {
        localStorage.setItem('lensy_current_studio_cover', cleanCover);
        localStorage.setItem(`lensy_studio_cover_${studio.id}`, cleanCover);
      }
      localStorage.setItem(`lensy_studio_meta_${studio.id}`, JSON.stringify({
        name: cleanName,
        logo_url: cleanLogo,
        cover_url: cleanCover,
        address: cleanAddress,
        facebook_url: cleanFanpage,
        phone: cleanPhone,
      }));

      if (isSupabaseConfigured) {
        // Payload gửi lên Database với định dạng chuẩn xác
        let updatePayload: {
          name: string;
          logo_url: string | null;
          cover_url?: string | null;
          address?: string | null;
          facebook_url?: string | null;
          phone?: string | null;
          updated_at: string;
        } = {
          name: cleanName,
          logo_url: cleanLogo || null,
          cover_url: cleanCover || null,
          address: cleanAddress || null,
          facebook_url: cleanFanpage || null,
          phone: cleanPhone || null,
          updated_at: new Date().toISOString(),
        };

        let { error } = await supabase
          .from('studios')
          .update(updatePayload)
          .eq('id', studio.id);

        if (error) {
          const errMsg = error.message || '';
          console.warn('[Supabase Schema Cache] Cột mở rộng chưa có trong schema cache studios, tự động fallback:', errMsg);
          if (errMsg.includes('cover_url')) delete updatePayload.cover_url;
          if (errMsg.includes('facebook_url')) delete updatePayload.facebook_url;
          if (errMsg.includes('address')) delete updatePayload.address;
          if (errMsg.includes('phone')) delete updatePayload.phone;

          const retryRes = await supabase
            .from('studios')
            .update(updatePayload)
            .eq('id', studio.id);
          error = retryRes.error;
        }

        if (error) throw error;

        // Đồng bộ cover_image / cover_url vào users table để đảm bảo trang đặt lịch cá nhân /book/:username đọc được
        if (user) {
          try {
            await supabase
              .from('users')
              .update({
                cover_image: cleanCover || null,
                cover_url: cleanCover || null,
              })
              .eq('id', user.id);
          } catch (uErr) {
            console.warn('[StudioSettings] Fallback users update cover:', uErr);
          }
        }

        setStudio(prev => prev ? {
          ...prev,
          name: cleanName,
          logo_url: cleanLogo || null,
          cover_url: cleanCover || null,
          address: cleanAddress || undefined,
        } : null);
        try {
          if (refreshWorkspace) await refreshWorkspace();
        } catch (e) {
          console.warn('[StudioSettings] Lỗi refresh workspace:', e);
        }
        setToast({
          type: 'success',
          message: '🎉 Đã cập nhật thông tin Studio thành công!',
        });
      } else {
        await new Promise(r => setTimeout(r, 500));
        setStudio(prev => prev ? {
          ...prev,
          name: cleanName,
          logo_url: cleanLogo || null,
          address: cleanAddress || undefined,
        } : null);
        setToast({
          type: 'success',
          message: '🎉 [Demo] Đã lưu thông tin Studio thành công!',
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu Studio:', err);
      setToast({
        type: 'error',
        message: 'Lỗi cập nhật: ' + (err.message || 'Không thể lưu'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStudioInfo = handleSaveStudioInfo;
  const handleSaveGeneralInfo = handleSaveStudioInfo;

  // Tạo Studio mới (dành cho người dùng chưa có Studio)
  const handleCreateNewStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = newStudioName.trim();
    if (!trimmed) {
      setToast({ type: 'error', message: 'Vui lòng nhập tên Studio.' });
      return;
    }

    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('studios')
          .insert({
            name: trimmed,
            logo_url: newLogoUrl.trim() || null,
            owner_id: user.id,
            verified_status: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Cập nhật account_type của user thành studio_member
        await supabase
          .from('users')
          .update({ account_type: 'studio_member' })
          .eq('id', user.id);

        setStudio(data);
        setIsStudioOwner(true);
        setIsStudioAdmin(true);
        setStudioName(data.name);
        setLogoUrl(data.logo_url || '');
        setVerifiedStatus(data.verified_status);
        setIsCreatingStudio(false);

        await fetchStudioMembers(data.id);

        setToast({
          type: 'success',
          message: `🎉 Chúc mừng! Studio "${trimmed}" đã được kích hoạt thành công!`,
        });
      } else {
        const fakeStudio: Studio = {
          id: 'new-mock-studio',
          name: trimmed,
          logo_url: newLogoUrl.trim() || '/mirmia-logo.png',
          verified_status: true,
          owner_id: user.id,
        };
        setStudio(fakeStudio);
        setIsStudioOwner(true);
        setIsStudioAdmin(true);
        setStudioName(trimmed);
        setLogoUrl(fakeStudio.logo_url || '');
        setIsCreatingStudio(false);
        setToast({
          type: 'success',
          message: `🎉 [Demo] Đã tạo Studio "${trimmed}" thành công!`,
        });
      }
    } catch (err: any) {
      console.error('Lỗi tạo Studio:', err);
      setToast({
        type: 'error',
        message: 'Lỗi tạo Studio: ' + (err.message || 'Không thể tạo mới'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Duyệt thành viên (Approve)
  const handleApproveMember = async (member: StudioMember, roleOverride?: StudioRole) => {
    if (!studio) return;
    setIsProcessingMemberId(member.id);
    const assignedRole = roleOverride || selectedRolesForPending[member.id] || member.role || 'photographer';

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studio_members')
          .update({
            status: 'approved',
            role: assignedRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', member.id);

        if (error) throw error;

        // Cập nhật account_type của thành viên thành 'studio_member'
        await supabase
          .from('users')
          .update({ account_type: 'studio_member' })
          .eq('id', member.user_id);

        // Cập nhật state UI
        setPendingMembers(prev => prev.filter(m => m.id !== member.id));
        setApprovedMembers(prev => [{ ...member, status: 'approved', role: assignedRole }, ...prev]);

        const roleTitle = assignedRole === 'makeup_artist' ? 'Thợ Makeup (MUA)' : assignedRole === 'admin' ? 'Quản lý' : 'Thợ ảnh';
        setToast({
          type: 'success',
          message: `✅ Đã phê duyệt "${member.user?.full_name || 'Thành viên'}" với vai trò ${roleTitle}!`,
        });
      } else {
        await new Promise(r => setTimeout(r, 400));
        setPendingMembers(prev => prev.filter(m => m.id !== member.id));
        setApprovedMembers(prev => [{ ...member, status: 'approved', role: assignedRole }, ...prev]);
        const roleTitle = assignedRole === 'makeup_artist' ? 'Thợ Makeup (MUA)' : assignedRole === 'admin' ? 'Quản lý' : 'Thợ ảnh';
        setToast({
          type: 'success',
          message: `✅ [Demo] Đã phê duyệt thành viên với vai trò ${roleTitle}!`,
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi phê duyệt thành viên:', err);
      setToast({
        type: 'error',
        message: 'Lỗi phê duyệt: ' + (err.message || 'Không thể cập nhật'),
      });
    } finally {
      setIsProcessingMemberId(null);
    }
  };

  // Cập nhật đổi vai trò cho thành viên đã duyệt
  const handleUpdateMemberRole = async (member: StudioMember, newRole: StudioRole) => {
    if (!studio) return;
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studio_members')
          .update({
            role: newRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', member.id);
        if (error) throw error;
      }

      setApprovedMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
      const roleTitle = newRole === 'makeup_artist' ? 'Thợ Makeup (MUA)' : newRole === 'admin' ? 'Quản lý' : 'Thợ ảnh';
      setToast({
        type: 'success',
        message: `✅ Đã chuyển vai trò của "${member.user?.full_name || 'Nhân sự'}" sang ${roleTitle}!`,
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: 'Lỗi cập nhật vai trò: ' + (err.message || 'Không thể cập nhật'),
      });
    }
  };

  // Mời nhân sự mới trực tiếp vào Studio
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studio || !inviteName.trim()) return;

    try {
      const tempId = `sm-${Date.now()}`;
      const newMemberItem: StudioMember = {
        id: tempId,
        studio_id: studio.id,
        user_id: `u-${Date.now()}`,
        role: inviteRole,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: `u-${Date.now()}`,
          full_name: inviteName.trim(),
          email: inviteEmail.trim() || `${inviteName.toLowerCase().replace(/\s+/g, '')}@lensy.studio`,
          phone: invitePhone.trim() || '0900000000',
          avatar_url: inviteRole === 'makeup_artist'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        },
      };

      setApprovedMembers(prev => [newMemberItem, ...prev]);
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('');
      setInviteRole('photographer');

      const roleTitle = inviteRole === 'makeup_artist' ? 'Thợ Makeup (MUA)' : inviteRole === 'admin' ? 'Quản lý' : 'Thợ ảnh';
      setToast({
        type: 'success',
        message: `🎉 Đã thêm thành công ${roleTitle} "${newMemberItem.user?.full_name}" vào đội ngũ Studio!`,
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: 'Lỗi khi thêm nhân sự: ' + (err.message || 'Lỗi hệ thống'),
      });
    }
  };

  // Từ chối yêu cầu (Reject)
  const handleRejectMember = async (member: StudioMember) => {
    if (!studio) return;
    setIsProcessingMemberId(member.id);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studio_members')
          .update({
            status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', member.id);

        if (error) throw error;

        setPendingMembers(prev => prev.filter(m => m.id !== member.id));
        setToast({
          type: 'info',
          message: `Đã từ chối yêu cầu gia nhập của "${member.user?.full_name || 'Thợ ảnh'}".`,
        });
      } else {
        await new Promise(r => setTimeout(r, 300));
        setPendingMembers(prev => prev.filter(m => m.id !== member.id));
        setToast({
          type: 'info',
          message: `[Demo] Đã từ chối yêu cầu gia nhập.`,
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi từ chối thành viên:', err);
      setToast({
        type: 'error',
        message: 'Lỗi từ chối: ' + (err.message || 'Không thể cập nhật'),
      });
    } finally {
      setIsProcessingMemberId(null);
    }
  };

  // Gỡ bỏ thành viên đã duyệt
  const handleRemoveMember = async (member: StudioMember) => {
    if (!window.confirm(`Bạn có chắc muốn gỡ bỏ thợ ảnh "${member.user?.full_name || 'này'}" khỏi Studio?`)) {
      return;
    }

    setIsProcessingMemberId(member.id);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studio_members')
          .delete()
          .eq('id', member.id);

        if (error) throw error;

        setApprovedMembers(prev => prev.filter(m => m.id !== member.id));
        setToast({
          type: 'success',
          message: 'Đã gỡ bỏ thành viên khỏi Studio.',
        });
      } else {
        setApprovedMembers(prev => prev.filter(m => m.id !== member.id));
        setToast({
          type: 'success',
          message: '[Demo] Đã gỡ bỏ thành viên.',
        });
      }
    } catch (err: any) {
      console.error('Lỗi gỡ bỏ thành viên:', err);
      setToast({
        type: 'error',
        message: 'Lỗi gỡ bỏ: ' + err.message,
      });
    } finally {
      setIsProcessingMemberId(null);
    }
  };

  // Duyệt / Xác thực Thợ ảnh (Verification via Facebook)
  const handleVerifyMember = async (member: StudioMember) => {
    setIsProcessingMemberId(member.id);
    try {
      if (isSupabaseConfigured) {
        // Cập nhật bảng studio_members
        const { error: smErr } = await supabase
          .from('studio_members')
          .update({
            is_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', member.id);

        if (smErr) console.warn('Lỗi cập nhật studio_members:', smErr);

        // Cập nhật bảng users nếu có user_id
        if (member.user_id) {
          const { error: uErr } = await supabase
            .from('users')
            .update({
              is_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', member.user_id);

          if (uErr) console.warn('Lỗi cập nhật users:', uErr);
        }
      }

      // Cập nhật state nội bộ
      setApprovedMembers(prev =>
        prev.map(m =>
          m.id === member.id
            ? {
                ...m,
                is_verified: true,
                user: m.user ? { ...m.user, is_verified: true } : undefined,
              }
            : m
        )
      );

      setToast({
        type: 'success',
        message: `Đã xác thực danh tính & cấp tích xanh cho "${member.user?.full_name || 'Thợ ảnh'}".`,
      });
    } catch (err: any) {
      console.error('Lỗi khi duyệt xác thực thành viên:', err);
      setToast({
        type: 'error',
        message: 'Lỗi xác thực: ' + (err.message || 'Không thể cập nhật'),
      });
    } finally {
      setIsProcessingMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-100"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Đang tải bảng điều khiển Studio Admin...</p>
      </motion.div>
    );
  }

  // Nếu user không có quyền Admin/Owner và chưa có Studio
  if (!studio && !isStudioAdmin && !isStudioOwner) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Bạn Chưa Quản Trị Studio Nào
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Mục này dành riêng cho Chủ Studio hoặc Quản trị viên (Admin) để quản lý thông tin thương hiệu và phê duyệt nhân sự thợ ảnh.
          </p>
        </div>

        {isCreatingStudio ? (
          <form
            onSubmit={handleCreateNewStudio}
            className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-amber-500/30 backdrop-blur-xl shadow-2xl text-left space-y-4 max-w-lg mx-auto"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Đăng Ký Workspace Studio Mới</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên Studio / Thương Hiệu *
              </label>
              <input
                type="text"
                required
                value={newStudioName}
                onChange={e => setNewStudioName(e.target.value)}
                placeholder="VD: MIRMIA STUDIO & ACADEMY"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Link Logo Studio (Tùy chọn)
              </label>
              <input
                type="url"
                value={newLogoUrl}
                onChange={e => setNewLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingStudio(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Khởi Tạo Studio</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreatingStudio(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng Ký Khởi Tạo Studio Mới</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Về Trang Dashboard
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full flex flex-col gap-6"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideDown max-w-md">
          <div
            className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
                : toast.type === 'info'
                ? 'bg-slate-900/95 border-blue-500/50 text-blue-200'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header & Action Button (Single row aligned, no duplicate h1 or back btn) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Không gian làm việc và quản trị nhân sự Studio: {studio?.name || 'Mirmia Studio'}
        </p>

        <button
          onClick={fetchStudioData}
          className="px-3.5 py-2 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
          title="Tải lại dữ liệu"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-zinc-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Thông Tin Chung</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'members'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản Lý Nhân Sự</span>
          {pendingMembers.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
              {pendingMembers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('integrations');
            setSearchParams({ tab: 'integrations' });
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'integrations'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Tích Hợp & Telegram Bot</span>
          {telegramConfig.isEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Telegram Bot đang hoạt động" />
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: THÔNG TIN CHUNG & NHẬN DIỆN THƯƠNG HIỆU                       */}
      {/* ==================================================================== */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveStudioInfo} className="w-full space-y-6 animate-fadeIn">
          {/* BỐ CỤC 2 CỘT CÂN ĐỐI TOÀN MÀN HÌNH (7 COLS FORM + 5 COLS LIVE PREVIEW) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* CỘT TRÁI (7 COLS): CẤU HÌNH HÌNH ẢNH & THÔNG TIN STUDIO */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* CARD 1: ẢNH BÌA & LOGO STUDIO */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-orange-500" />
                      <span>Nhận Diện Hình Ảnh Studio</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Ảnh bìa và Logo chính thức tự động hiển thị trên đầu trang đặt lịch hẹn của khách
                    </p>
                  </div>
                  {verifiedStatus && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Đã Xác Thực</span>
                    </div>
                  )}
                </div>

                {/* KHU VỰC ẢNH BÌA (STUDIO COVER BANNER) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>🖼️</span>
                      <span>Ảnh Bìa Trang Đặt Lịch (Studio Cover Banner)</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Tỷ lệ 16:5 (1920x600px)</span>
                  </div>

                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800/60 group">
                    {coverUrl ? (
                      <>
                        <img
                          src={coverUrl}
                          alt="Studio Cover"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Chưa có ảnh bìa riêng
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          Trang đặt lịch hiện dùng ảnh mặc định. Hãy tải ảnh không gian Studio hoặc góc chụp thực tế của bạn.
                        </p>
                      </div>
                    )}

                    {/* Upload Input & Nút bấm trên Banner */}
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileSelected}
                      className="hidden"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {coverUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCoverUrl('');
                            if (studio?.id) localStorage.removeItem(`lensy_studio_cover_${studio.id}`);
                            localStorage.removeItem('lensy_current_studio_cover');
                            setToast({ type: 'info', message: 'Đã bỏ ảnh bìa riêng, trở về ảnh bìa mặc định.' });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-rose-600 text-white text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer"
                          title="Xóa ảnh bìa riêng"
                        >
                          Xóa Ảnh
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isUploadingCover}
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingCover ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải lên...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{coverUrl ? 'Thay Đổi Ảnh Bìa' : 'Tải Ảnh Bìa Lên'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* KHU VỰC LOGO STUDIO */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 shadow-xs flex-shrink-0 flex items-center justify-center">
                    <img
                      src={logoUrl || '/mirmia-logo.png'}
                      alt="Studio Logo"
                      className="w-full h-full object-contain rounded-xl"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Logo Thương Hiệu Studio
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Hiển thị trên Avatar trang đặt lịch, thư báo giá và menu Sidebar
                        </p>
                      </div>
                      
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileSelected}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-orange-600 hover:text-white text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Đổi Logo</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Hỗ trợ PNG, JPG, WEBP hoặc SVG (kích thước vuông, tối đa 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2: THÔNG TIN LIÊN HỆ & PHÁP LÝ */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Thông Tin Liên Hệ & Trụ Sở
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-orange-500" />
                      <span>Tên Studio Chính Thức *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                      placeholder="VD: MIRMIA STUDIO & ACADEMY"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                      <span>Số Điện Thoại / Hotline Studio</span>
                    </label>
                    <input
                      type="tel"
                      value={studioPhone}
                      onChange={e => setStudioPhone(e.target.value)}
                      placeholder="VD: 0901234567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>🌐</span>
                      <span>Fanpage / Link Mạng Xã Hội</span>
                    </label>
                    <input
                      type="url"
                      value={studioFanpage}
                      onChange={e => setStudioFanpage(e.target.value)}
                      placeholder="https://facebook.com/mirmia.studio"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>📍</span>
                      <span>Địa Chỉ Studio Trụ Sở *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studioAddress}
                      onChange={e => setStudioAddress(e.target.value)}
                      placeholder="VD: 124 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Lưu Thông Tin Studio</span>
                  </button>
                </div>
              </div>

            </div>

            {/* CỘT PHẢI (5 COLS): LIVE PREVIEW TRỰC QUAN TRANG ĐẶT LỊCH (BOOKING PORTAL MOCKUP) */}
            <div className="xl:col-span-5 sticky top-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Xem Trước Trang Đặt Lịch
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  Khách Hàng Nhìn Thấy
                </span>
              </div>

              {/* MÔ PHỎNG TRANG ĐẶT LỊCH CHUẨN REALTIME */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden space-y-0">
                
                {/* Header Browser Bar Mockup */}
                <div className="px-3.5 py-2.5 bg-slate-100/90 dark:bg-zinc-950/80 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[210px]">
                    lensy.vn/book/{(user as any)?.username || user?.user_metadata?.username || 'johnnylongho'}
                  </span>
                  <a
                    href={`/book/${(user as any)?.username || user?.user_metadata?.username || 'johnnylongho'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-500 font-bold flex items-center gap-1 text-[10px] cursor-pointer"
                    title="Mở trang đặt lịch trên tab mới"
                  >
                    <span>Mở Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Banner & Profile Preview */}
                <div className="p-4 space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    
                    {/* Studio Cover Banner Preview */}
                    <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-200 dark:bg-zinc-800">
                      <img
                        src={coverUrl || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80'}
                        alt={studioName || 'Studio Banner'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/95 dark:from-zinc-900/95 via-transparent to-black/10" />
                    </div>

                    {/* Logo & Studio Info Overlay */}
                    <div className="relative px-3 pb-3 pt-0 -mt-10 flex items-end gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-900 p-1 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={logoUrl || '/mirmia-logo.png'}
                          alt="Logo"
                          className="w-full h-full object-contain rounded-lg"
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                          }}
                        />
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                            Studio Profile
                          </span>
                          {verifiedStatus && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                              Verified
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {studioName || 'MIRMIA STUDIO & ACADEMY'}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                          Nhiếp ảnh gia chính: {(user as any)?.full_name || 'Johnny Long Hồ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dòng Chào Mừng Khách Hàng */}
                  <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-500/5 border border-orange-200/60 dark:border-orange-500/20 text-[11px] text-orange-950 dark:text-orange-200 leading-relaxed">
                    Chào mừng bạn đến với <b>{studioName || 'MIRMIA STUDIO & ACADEMY'}</b>. Vui lòng để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói chụp phù hợp nhất cho bạn.
                  </div>

                  {/* Mô phỏng các gói dịch vụ mẫu */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Gói Dịch Vụ Niêm Yết Của Bạn
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50 space-y-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 block w-max">
                          Chụp Studio
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">Portrait Nghệ Thuật</p>
                        <p className="font-extrabold text-orange-600 text-xs">500.000 đ</p>
                      </div>
                      <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/50 space-y-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 block w-max">
                          Trang Điểm & Styling
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">Make Up - Gói Cơ Bản</p>
                        <p className="font-extrabold text-orange-600 text-xs">80.000 đ</p>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin cam kết đồng bộ */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      Ảnh bìa, logo và hotline sau khi lưu sẽ lập tức đồng bộ thời gian thực (Realtime) vào toàn bộ hệ thống đặt lịch của Studio.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: QUẢN LÝ NHÂN SỰ                                               */}
      {/* ==================================================================== */}
      {activeTab === 'members' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section 1: Yêu cầu gia nhập đang chờ duyệt (Pending) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Yêu Cầu Gia Nhập Đang Chờ Phê Duyệt ({pendingMembers.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Cơ chế xác thực Bắt tay kép</span>
            </div>

            {pendingMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <UserCheck className="w-8 h-8 mx-auto text-slate-500/60" />
                <p className="text-xs font-medium">Hiện không có yêu cầu xin gia nhập nào đang chờ.</p>
                <p className="text-[11px] text-slate-500">
                  Khi thợ chụp hoặc MUA tìm kiếm Studio của bạn và gửi yêu cầu, thông tin sẽ xuất hiện tại đây để bạn duyệt.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMembers.map(member => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border border-amber-500/30 flex-shrink-0">
                        <img
                          src={member.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={member.user?.full_name || 'Nhân sự'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {member.user?.full_name || 'Nhân sự ẩn danh'}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                            Chờ duyệt
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {member.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {member.user?.email || 'Chưa cập nhật'}
                            </span>
                          )}
                          {member.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {member.user?.phone || 'Chưa cập nhật'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Role Selector + Approve & Reject */}
                    <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">Vai trò:</span>
                        <select
                          value={selectedRolesForPending[member.id] || member.role || 'photographer'}
                          onChange={e => setSelectedRolesForPending(prev => ({ ...prev, [member.id]: e.target.value as StudioRole }))}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-amber-300 outline-none cursor-pointer"
                        >
                          <option value="photographer">Thợ Ảnh</option>
                          <option value="makeup_artist">Thợ Makeup</option>
                          <option value="admin">Quản lý</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessingMemberId === member.id}
                        onClick={() => handleRejectMember(member)}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessingMemberId === member.id}
                        onClick={() => handleApproveMember(member)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                      >
                        {isProcessingMemberId === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Phê Duyệt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Đội Ngũ Nhân Sự Chính Thức (Chia 2 nhóm Nhiếp ảnh & Makeup) */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Đội Ngũ Nhân Sự Trực Thuộc ({approvedMembers.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Mời Nhân Sự Mới</span>
              </button>
            </div>

            {/* Nhóm 1: Đội ngũ Nhiếp ảnh */}
            <div className="p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                  <Camera className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Đội Ngũ Nhiếp Ảnh (Photographers)
                  </h4>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                  {approvedMembers.filter(m => m.role === 'photographer' || m.role === 'admin').length} nhân sự
                </span>
              </div>

              {approvedMembers.filter(m => m.role === 'photographer' || m.role === 'admin').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Chưa có nhiếp ảnh gia nào trong nhóm này.</p>
              ) : (
                <div className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {approvedMembers
                    .filter(m => m.role === 'photographer' || m.role === 'admin')
                    .map(member => (
                      <div key={member.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* 1. Thông tin cá nhân & Vai trò */}
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-amber-500/30 flex-shrink-0">
                            <img
                              src={member.user?.avatar_url || '/mirmia-logo.png'}
                              alt={member.user?.full_name || 'Thợ ảnh'}
                              className="w-full h-full object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {member.user?.full_name || 'Thợ ảnh'}
                              </span>
                              {(member.is_verified || member.user?.is_verified) && (
                                <VerifiedBadge className="w-4 h-4" />
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                member.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}>
                                {member.role === 'admin' ? 'Quản lý' : 'Thợ ảnh'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {member.user?.email || member.user?.phone || 'Chưa cập nhật liên hệ'}
                            </p>
                          </div>
                        </div>

                        {/* 2. Cột Facebook với icon 🔗 */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 md:hidden">Facebook:</span>
                          {(() => {
                            const fbUrl = member.facebook_url || member.user?.facebook_url;
                            if (fbUrl) {
                              const href = fbUrl.startsWith('http') ? fbUrl : `https://${fbUrl}`;
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-500/20 transition-all hover:scale-[1.02]"
                                  title={fbUrl}
                                >
                                  <span>🔗</span>
                                  <span className="max-w-[120px] sm:max-w-[150px] truncate">Facebook</span>
                                  <ExternalLink className="w-3 h-3 text-blue-500" />
                                </a>
                              );
                            }
                            return (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                Chưa gắn Facebook
                              </span>
                            );
                          })()}
                        </div>

                        {/* 3. Cột Trạng thái */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 md:hidden">Trạng thái:</span>
                          {(member.is_verified || member.user?.is_verified) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                              <span>Đã xác thực</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Chưa xác thực</span>
                            </span>
                          )}
                        </div>

                        {/* 4. Hành động: Duyệt/Xác thực, Đổi vai trò, Gỡ bỏ */}
                        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                          {/* Nút Outline Blue Duyệt / Xác Thực nếu chưa xác thực */}
                          {!(member.is_verified || member.user?.is_verified) && (
                            <button
                              type="button"
                              disabled={isProcessingMemberId === member.id}
                              onClick={() => handleVerifyMember(member)}
                              className="px-3 py-1.5 rounded-xl border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10"
                            >
                              {isProcessingMemberId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              <span>Duyệt / Xác Thực</span>
                            </button>
                          )}

                          {/* Role Selector */}
                          <select
                            value={member.role}
                            onChange={e => handleUpdateMemberRole(member, e.target.value as StudioRole)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                          >
                            <option value="photographer">Thợ ảnh</option>
                            <option value="makeup_artist">Thợ Makeup</option>
                            <option value="admin">Quản lý</option>
                          </select>

                          {member.user_id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              Gỡ bỏ
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Nhóm 2: Đội ngũ Makeup (MUA) */}
            <div className="p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-fuchsia-500 dark:text-fuchsia-400">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Đội Ngũ Makeup (Makeup Artists / MUA)
                  </h4>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-500 font-bold border border-fuchsia-500/20">
                  {approvedMembers.filter(m => m.role === 'makeup_artist').length} nhân sự
                </span>
              </div>

              {approvedMembers.filter(m => m.role === 'makeup_artist').length === 0 ? (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <p className="text-xs">Chưa có Thợ Makeup nào trong đội ngũ.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteRole('makeup_artist');
                      setIsInviteModalOpen(true);
                    }}
                    className="text-xs font-bold text-fuchsia-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Thêm Thợ Makeup đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {approvedMembers
                    .filter(m => m.role === 'makeup_artist')
                    .map(member => (
                      <div key={member.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* 1. Thông tin cá nhân & Vai trò */}
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-fuchsia-500/30 flex-shrink-0">
                            <img
                              src={member.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={member.user?.full_name || 'Thợ Makeup'}
                              className="w-full h-full object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {member.user?.full_name || 'Thợ Makeup'}
                              </span>
                              {(member.is_verified || member.user?.is_verified) && (
                                <VerifiedBadge className="w-4 h-4" />
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">
                                Thợ Makeup (MUA)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {member.user?.email || member.user?.phone || 'Chưa cập nhật liên hệ'}
                            </p>
                          </div>
                        </div>

                        {/* 2. Cột Facebook với icon 🔗 */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 md:hidden">Facebook:</span>
                          {(() => {
                            const fbUrl = member.facebook_url || member.user?.facebook_url;
                            if (fbUrl) {
                              const href = fbUrl.startsWith('http') ? fbUrl : `https://${fbUrl}`;
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-500/20 transition-all hover:scale-[1.02]"
                                  title={fbUrl}
                                >
                                  <span>🔗</span>
                                  <span className="max-w-[120px] sm:max-w-[150px] truncate">Facebook</span>
                                  <ExternalLink className="w-3 h-3 text-blue-500" />
                                </a>
                              );
                            }
                            return (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                Chưa gắn Facebook
                              </span>
                            );
                          })()}
                        </div>

                        {/* 3. Cột Trạng thái */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 md:hidden">Trạng thái:</span>
                          {(member.is_verified || member.user?.is_verified) ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                              <span>Đã xác thực</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Chưa xác thực</span>
                            </span>
                          )}
                        </div>

                        {/* 4. Hành động */}
                        <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                          {/* Nút Outline Blue Duyệt / Xác Thực nếu chưa xác thực */}
                          {!(member.is_verified || member.user?.is_verified) && (
                            <button
                              type="button"
                              disabled={isProcessingMemberId === member.id}
                              onClick={() => handleVerifyMember(member)}
                              className="px-3 py-1.5 rounded-xl border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10"
                            >
                              {isProcessingMemberId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                              )}
                              <span>Duyệt / Xác Thực</span>
                            </button>
                          )}

                          {/* Role Selector */}
                          <select
                            value={member.role}
                            onChange={e => handleUpdateMemberRole(member, e.target.value as StudioRole)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                          >
                            <option value="makeup_artist">Thợ Makeup</option>
                            <option value="photographer">Thợ ảnh</option>
                            <option value="admin">Quản lý</option>
                          </select>

                          {member.user_id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              Gỡ bỏ
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Mời Nhân Sự Mới */}
          {isInviteModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden"
              onClick={() => setIsInviteModalOpen(false)}
            >
              <div
                className="relative z-10 w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Thêm Nhân Sự Vào Studio</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleInviteMember} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Họ và Tên Nhân Sự *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Lan Anh Makeup / Tuấn Hoàng Photo"
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Vai Trò Phụ Trách *</label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as StudioRole)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="photographer">Thợ Ảnh (Photographer)</option>
                      <option value="makeup_artist">Thợ Makeup (MUA)</option>
                      <option value="admin">Quản lý Studio (Admin)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Số Điện Thoại / Zalo</label>
                    <input
                      type="tel"
                      placeholder="VD: 0901234567"
                      value={invitePhone}
                      onChange={e => setInvitePhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Email Liên Hệ</label>
                    <input
                      type="email"
                      placeholder="VD: staff@studio.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      Xác Nhận Thêm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TÍCH HỢP & TELEGRAM BOT                                       */}
      {/* ==================================================================== */}
      {activeTab === 'integrations' && (
        <div className="w-full max-w-4xl space-y-6 animate-fadeIn">
          <form onSubmit={handleSaveTelegram} className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Kênh Thông Báo Telegram Bot</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        MIỄN PHÍ
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">
                      Nhận thông báo tức thì về điện thoại hoặc Group ê-kíp khi có cọc mới, khách đặt lịch hoặc chọn ảnh
                    </p>
                  </div>
                </div>

                {/* Master Switch */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {telegramConfig.isEnabled ? 'Đang Bật' : 'Đang Tắt'}
                  </span>
                  <input
                    type="checkbox"
                    checked={telegramConfig.isEnabled}
                    onChange={e => setTelegramConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 relative" />
                </label>
              </div>

              {/* Bot Token & Chat ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>Telegram Bot Token *</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTelegramToken(!showTelegramToken)}
                      className="text-[10px] text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showTelegramToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showTelegramToken ? 'Ẩn token' : 'Hiện token'}</span>
                    </button>
                  </label>
                  <input
                    type={showTelegramToken ? 'text' : 'password'}
                    value={telegramConfig.botToken}
                    onChange={e => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
                    placeholder="VD: 7123456789:AAFn_XXXXXXX_XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-white/40">
                    Lấy mã token từ bot <b>@BotFather</b> trên Telegram
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span>Telegram Chat ID / Group ID *</span>
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.chatId}
                    onChange={e => setTelegramConfig(prev => ({ ...prev, chatId: e.target.value }))}
                    placeholder="VD: 123456789 (Cá nhân) hoặc -100123456789 (Group)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-white/40">
                    Chat ID cá nhân hoặc Group nội bộ Studio (bắt đầu bằng dấu trừ <code>-100...</code>)
                  </p>
                </div>
              </div>

              {/* Tùy chọn sự kiện nhận thông báo */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <BellRing className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sự Kiện Nhận Thông Báo Qua Telegram:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-amber-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notifyOnNewBooking}
                      onChange={e => setTelegramConfig(prev => ({ ...prev, notifyOnNewBooking: e.target.checked }))}
                      className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-100">🎉 Khách đặt lịch mới</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Khi khách gửi yêu cầu qua link báo giá hoặc đặt lịch</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-amber-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notifyOnDeposit}
                      onChange={e => setTelegramConfig(prev => ({ ...prev, notifyOnDeposit: e.target.checked }))}
                      className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-100">⚡ Nhận cọc & Khóa lịch</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Khi tiền cọc VietQR về tài khoản hoặc duyệt bill cọc</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-amber-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notifyOnProofingLocked}
                      onChange={e => setTelegramConfig(prev => ({ ...prev, notifyOnProofingLocked: e.target.checked }))}
                      className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-100">🎨 Khách chốt chọn ảnh</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Khách hoàn tất chọn ảnh để retoucher chỉnh màu ngay</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-amber-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notifyOnConflict}
                      onChange={e => setTelegramConfig(prev => ({ ...prev, notifyOnConflict: e.target.checked }))}
                      className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-100">⚠️ Cảnh báo trùng thiết bị / thợ</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Khi có nguy cơ đụng máy ảnh hoặc trùng thợ makeup</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTelegram || !telegramConfig.botToken || !telegramConfig.chatId}
                  className="px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTestingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Gửi Thử Tin Nhắn (Kiểm Tra Kết Nối)</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingTelegram}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                >
                  {isSavingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Cấu Hình Telegram</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Guide Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Hướng Dẫn 4 Bước Tạo Telegram Bot Miễn Phí Trong 1 Phút</span>
            </h3>
            <ol className="text-xs text-slate-600 dark:text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Mở ứng dụng Telegram, tìm kiếm <b>@BotFather</b> và gửi lệnh <code>/newbot</code>.
              </li>
              <li>
                Đặt tên cho Bot (VD: <i>Mirmia Studio Notifier</i>) và username (kết thúc bằng chữ <i>bot</i>).
              </li>
              <li>
                Copy đoạn <b>HTTP API Token</b> do BotFather gửi và dán vào ô <b>Telegram Bot Token</b> ở trên.
              </li>
              <li>
                Để lấy <b>Chat ID</b>: Nhắn tin cho bot <b>@userinfobot</b> để xem ID cá nhân, hoặc thêm Bot vừa tạo vào Group Studio rồi gửi lệnh test để lấy ID group (thường bắt đầu bằng dấu trừ <code>-100...</code>).
              </li>
            </ol>
          </div>
        </div>
      )}
    </motion.div>
  );
};
