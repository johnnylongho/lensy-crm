import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Studio, StudioMember } from '../../types';
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
} from 'lucide-react';

export const StudioSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');

  // Studio Data
  const [studio, setStudio] = useState<Studio | null>(null);
  const [isStudioAdmin, setIsStudioAdmin] = useState(false);
  const [isStudioOwner, setIsStudioOwner] = useState(false);

  // Form Data
  const [studioName, setStudioName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [verifiedStatus, setVerifiedStatus] = useState(false);

  // Create Studio Modal state (nếu chưa có studio)
  const [isCreatingStudio, setIsCreatingStudio] = useState(false);
  const [newStudioName, setNewStudioName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');

  // Members lists
  const [pendingMembers, setPendingMembers] = useState<StudioMember[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<StudioMember[]>([]);
  const [isProcessingMemberId, setIsProcessingMemberId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

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
          setLogoUrl(currentStudio.logo_url || '');
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
        setVerifiedStatus(mockStudio.verified_status);

        setPendingMembers([
          {
            id: 'req-001',
            studio_id: 'mock-studio-001',
            user_id: 'user-002',
            role: 'photographer',
            status: 'pending',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            user: {
              id: 'user-002',
              full_name: 'Trần Văn Hoàng (Hoang Photography)',
              email: 'hoang.photo@gmail.com',
              phone: '0988776655',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            },
          },
        ]);

        setApprovedMembers([
          {
            id: 'req-000',
            studio_id: 'mock-studio-001',
            user_id: user.id,
            role: 'admin',
            status: 'approved',
            created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
            user: {
              id: user.id,
              full_name: user.user_metadata?.full_name || 'Johnny Long Hồ',
              email: user.email || 'longho@mirmia.vn',
              phone: '0901234567',
              avatar_url: '/mirmia-logo.png',
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
          created_at,
          updated_at,
          users:user_id (
            id,
            full_name,
            email,
            phone,
            avatar_url
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
          created_at: row.created_at,
          updated_at: row.updated_at,
          user: row.users,
        };
        if (row.status === 'pending') {
          pending.push(item);
        } else if (row.status === 'approved') {
          approved.push(item);
        }
      });

      setPendingMembers(pending);
      setApprovedMembers(approved);
    } catch (err) {
      console.error('Lỗi xử lý danh sách thành viên:', err);
    }
  };

  useEffect(() => {
    fetchStudioData();
  }, [user]);

  // Lưu thông tin Tab "Thông tin chung"
  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studio) return;

    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studios')
          .update({
            name: studioName.trim(),
            logo_url: logoUrl.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studio.id);

        if (error) throw error;

        setStudio(prev => prev ? { ...prev, name: studioName.trim(), logo_url: logoUrl.trim() || null } : null);
        setToast({
          type: 'success',
          message: '🎉 Đã cập nhật thông tin Studio thành công!',
        });
      } else {
        await new Promise(r => setTimeout(r, 500));
        setStudio(prev => prev ? { ...prev, name: studioName.trim(), logo_url: logoUrl.trim() || null } : null);
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
  const handleApproveMember = async (member: StudioMember) => {
    if (!studio) return;
    setIsProcessingMemberId(member.id);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studio_members')
          .update({
            status: 'approved',
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
        setApprovedMembers(prev => [{ ...member, status: 'approved' }, ...prev]);

        setToast({
          type: 'success',
          message: `✅ Đã phê duyệt thợ ảnh "${member.user?.full_name || 'Thành viên'}" vào Studio!`,
        });
      } else {
        await new Promise(r => setTimeout(r, 400));
        setPendingMembers(prev => prev.filter(m => m.id !== member.id));
        setApprovedMembers(prev => [{ ...member, status: 'approved' }, ...prev]);
        setToast({
          type: 'success',
          message: `✅ [Demo] Đã phê duyệt thợ ảnh thành công!`,
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

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Đang tải bảng điều khiển Studio Admin...</p>
      </div>
    );
  }

  // Nếu user không có quyền Admin/Owner và chưa có Studio
  if (!studio && !isStudioAdmin && !isStudioOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-center">
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
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
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

      {/* Header & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-slate-500 dark:text-white/60 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-950/40 flex-shrink-0">
              <div className="w-full h-full bg-white dark:bg-black/60 rounded-[14px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white/90 tracking-tight">
                  Quản Trị Studio & Nhân Sự
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
                  {isStudioOwner ? 'Studio Owner' : 'Studio Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50">
                Không gian làm việc cho Studio: {studio?.name}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchStudioData}
          className="px-3.5 py-2 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          title="Tải lại dữ liệu"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Thông Tin Chung</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all relative ${
            activeTab === 'members'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
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
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: THÔNG TIN CHUNG                                               */}
      {/* ==================================================================== */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneralInfo} className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hồ Sơ Thương Hiệu Studio
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-white/50">
                  Thông tin này sẽ tự động gắn lên trang đặt lịch của các thợ ảnh trực thuộc Studio
                </p>
              </div>
              {verifiedStatus && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Đã Xác Thực Thương Hiệu</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Logo Preview */}
              <div className="md:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/20 border border-white/5 text-center space-y-3">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 p-1 shadow-lg">
                  <img
                    src={logoUrl || '/mirmia-logo.png'}
                    alt="Studio Logo"
                    className="w-full h-full object-contain rounded-xl"
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{studioName || 'Tên Studio'}</p>
                  <p className="text-[10px] text-slate-400">Xem trước Logo</p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>Tên Studio Chính Thức *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studioName}
                    onChange={e => setStudioName(e.target.value)}
                    placeholder="VD: MIRMIA STUDIO & ACADEMY"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>URL Logo Studio</span>
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://domain.com/path-to-logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    Khuyến nghị sử dụng định dạng ảnh PNG nền trong suốt để hiển thị đẹp nhất trên giao diện tối.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Thông Tin Studio</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: QUẢN LÝ NHÂN SỰ                                               */}
      {/* ==================================================================== */}
      {activeTab === 'members' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section 1: Yêu cầu gia nhập đang chờ duyệt (Pending) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-4">
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
                  Khi thợ chụp tìm kiếm Studio của bạn và gửi yêu cầu, thông tin sẽ xuất hiện tại đây để bạn duyệt.
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
                          alt={member.user?.full_name || 'Thợ ảnh'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {member.user?.full_name || 'Thợ ảnh ẩn danh'}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                            Chờ duyệt (Pending)
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {member.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {member.user.email}
                            </span>
                          )}
                          {member.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {member.user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Approve & Reject */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={isProcessingMemberId === member.id}
                        onClick={() => handleRejectMember(member)}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingMemberId === member.id}
                        onClick={() => handleApproveMember(member)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition-all"
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

          {/* Section 2: Danh sách thợ ảnh đã duyệt (Official Team) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Đội Ngũ Nhiếp Ảnh Gia Trực Thuộc ({approvedMembers.length})
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">Được gắn badge Studio Verified</span>
            </div>

            {approvedMembers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Chưa có thành viên nào được duyệt.</p>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-white/5">
                {approvedMembers.map(member => (
                  <div key={member.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-emerald-500/30 flex-shrink-0">
                        <img
                          src={member.user?.avatar_url || '/mirmia-logo.png'}
                          alt={member.user?.full_name || 'Thợ ảnh'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {member.user?.full_name || 'Thợ ảnh'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                            member.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {member.role === 'admin' ? 'Quản trị viên' : 'Thợ ảnh chính'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {member.user?.email || member.user?.phone || 'Chưa cập nhật liên hệ'}
                        </p>
                      </div>
                    </div>

                    {/* Chỉ cho gỡ bỏ nếu không phải chính mình hoặc không phải owner */}
                    {member.user_id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        className="text-[11px] text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        Gỡ bỏ
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
