import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Users,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Phone,
  Mail,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge';

export interface StudioRecord {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string | null;
  invite_code?: string;
  verified_status: boolean;
  tier?: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  address?: string;
  created_at?: string;
  is_active?: boolean;
  total_bookings?: number;
}

export interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  account_type: 'freelancer' | 'studio_admin' | 'studio_member' | string;
  is_verified?: boolean;
  created_at?: string;
  avatar_url?: string;
  facebook_url?: string | null;
}

// Dữ liệu mẫu dự phòng (Mock Fallback Data) khi cơ sở dữ liệu trống hoặc offline
const FALLBACK_STUDIOS: StudioRecord[] = [
  {
    id: 'std-001',
    name: 'MIRMIA Studio Flagship',
    slug: 'mirmia-studio',
    logo_url: null,
    invite_code: 'MIRMIA-VIP88',
    verified_status: true,
    tier: 'Pro',
    owner_id: 'usr-001',
    owner_name: 'Johnny Long Hồ',
    owner_email: 'johnnylongho@gmail.com',
    address: '124 Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    created_at: '2026-01-10T08:00:00Z',
    is_active: true,
    total_bookings: 38,
  },
  {
    id: 'std-002',
    name: 'Clay Studio Concept',
    slug: 'clay-studio',
    logo_url: null,
    invite_code: 'CLAY-2026',
    verified_status: true,
    tier: 'Growth',
    owner_id: 'usr-002',
    owner_name: 'Nguyễn Minh Quân',
    owner_email: 'quan.clay@gmail.com',
    address: '45 Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
    created_at: '2026-02-15T09:30:00Z',
    is_active: true,
    total_bookings: 22,
  },
  {
    id: 'std-003',
    name: 'Hà Nội Wedding & Bridal',
    slug: 'hanoi-wedding',
    logo_url: null,
    invite_code: 'HNW-999',
    verified_status: false,
    tier: 'Starter',
    owner_id: 'usr-004',
    owner_name: 'Trần Thị Thu Hà',
    owner_email: 'thuha.wedding@gmail.com',
    address: '88 Phố Huế, Quận Hai Bà Trưng, Hà Nội',
    created_at: '2026-03-01T14:20:00Z',
    is_active: true,
    total_bookings: 9,
  },
  {
    id: 'std-004',
    name: 'Lumière Art & Fashion',
    slug: 'lumiere-art',
    logo_url: null,
    invite_code: 'LUMIERE-X',
    verified_status: true,
    tier: 'Enterprise',
    owner_id: 'usr-005',
    owner_name: 'Lê Hoàng Nam',
    owner_email: 'nam.lumiere@gmail.com',
    address: '15 Lê Duẩn, Quận Hải Châu, Đà Nẵng',
    created_at: '2026-03-20T10:15:00Z',
    is_active: false,
    total_bookings: 54,
  },
];

const FALLBACK_USERS: UserRecord[] = [
  {
    id: 'usr-001',
    full_name: 'Johnny Long Hồ',
    email: 'johnnylongho@gmail.com',
    phone: '0908123456',
    account_type: 'studio_admin',
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    facebook_url: 'https://facebook.com/johnnylongho',
  },
  {
    id: 'usr-002',
    full_name: 'Nguyễn Minh Quân',
    email: 'quan.clay@gmail.com',
    phone: '0912345678',
    account_type: 'studio_admin',
    is_verified: true,
    created_at: '2026-02-10T08:30:00Z',
  },
  {
    id: 'usr-003',
    full_name: 'Trần Văn Hoàng (Hoàng Cam)',
    email: 'hoangcam.photo@gmail.com',
    phone: '0933888999',
    account_type: 'freelancer',
    is_verified: true,
    created_at: '2026-02-28T11:45:00Z',
  },
  {
    id: 'usr-004',
    full_name: 'Trần Thị Thu Hà',
    email: 'thuha.wedding@gmail.com',
    phone: '0988776655',
    account_type: 'studio_admin',
    is_verified: false,
    created_at: '2026-03-01T14:20:00Z',
  },
  {
    id: 'usr-005',
    full_name: 'Lê Hoàng Nam',
    email: 'nam.lumiere@gmail.com',
    phone: '0945678901',
    account_type: 'studio_admin',
    is_verified: true,
    created_at: '2026-03-20T10:15:00Z',
  },
  {
    id: 'usr-006',
    full_name: 'Võ Thị Mai Anh (MUA Mai)',
    email: 'maianh.makeup@gmail.com',
    phone: '0977112233',
    account_type: 'studio_member',
    is_verified: true,
    created_at: '2026-03-25T16:00:00Z',
  },
  {
    id: 'usr-007',
    full_name: 'Đặng Tuấn Khang (Retoucher)',
    email: 'khang.retouch@gmail.com',
    phone: '0909988776',
    account_type: 'studio_member',
    is_verified: false,
    created_at: '2026-04-02T09:10:00Z',
  },
];

export const SuperAdminConsolePage: React.FC = () => {
  const { user } = useAuth();

  // State quản lý tab & dữ liệu
  const [activeTab, setActiveTab] = useState<'studios' | 'users'>('studios');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [studios, setStudios] = useState<StudioRecord[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [totalBookingsCount, setTotalBookingsCount] = useState<number>(123);

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Nạp dữ liệu từ Supabase (có fallback an toàn)
  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      if (!isSupabaseConfigured) {
        setStudios(FALLBACK_STUDIOS);
        setUsersList(FALLBACK_USERS);
        setTotalBookingsCount(123);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // 1. Tải danh sách Studios
      const { data: studiosData, error: studiosError } = await supabase
        .from('studios')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Tải danh sách Users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Tải tổng số Bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      if (bookingsCount !== null && bookingsCount !== undefined) {
        setTotalBookingsCount(bookingsCount);
      }

      // Xử lý studios kết hợp owner name
      if (studiosData && studiosData.length > 0) {
        const mappedStudios: StudioRecord[] = studiosData.map(s => {
          const matchedOwner = usersData?.find(u => u.id === s.owner_id);
          return {
            id: s.id,
            name: s.name,
            slug: s.slug || `studio-${s.id.substring(0, 6)}`,
            logo_url: s.logo_url || s.logo,
            invite_code: s.invite_code || 'CHƯA TẠO',
            verified_status: s.verified_status ?? true,
            tier: s.tier || 'Standard',
            owner_id: s.owner_id,
            owner_name: matchedOwner?.full_name || 'Quản lý Studio',
            owner_email: matchedOwner?.email || 'N/A',
            address: s.address || 'Hồ Chí Minh, Việt Nam',
            created_at: s.created_at,
            is_active: s.verified_status !== false,
          };
        });
        setStudios(mappedStudios);
      } else {
        setStudios(FALLBACK_STUDIOS);
      }

      if (usersData && usersData.length > 0) {
        setUsersList(usersData as UserRecord[]);
      } else {
        setUsersList(FALLBACK_USERS);
      }
    } catch (err) {
      console.warn('Lỗi khi nạp dữ liệu Super Admin:', err);
      setStudios(FALLBACK_STUDIOS);
      setUsersList(FALLBACK_USERS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handler: Đổi gói cước Studio
  const handleUpdateStudioTier = async (studioId: string, newTier: string) => {
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('studios')
          .update({ tier: newTier, updated_at: new Date().toISOString() })
          .eq('id', studioId);
      }
      setStudios(prev =>
        prev.map(s => (s.id === studioId ? { ...s, tier: newTier } : s))
      );
      showToast('success', `Đã cập nhật gói cước Studio thành "${newTier}"!`);
    } catch (err: any) {
      showToast('error', `Lỗi cập nhật: ${err?.message || 'Không thể lưu gói cước'}`);
    }
  };

  // Handler: Khóa / Mở khóa Studio
  const handleToggleStudioStatus = async (studioId: string, currentActive: boolean) => {
    const nextStatus = !currentActive;
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('studios')
          .update({ verified_status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', studioId);
      }
      setStudios(prev =>
        prev.map(s =>
          s.id === studioId ? { ...s, is_active: nextStatus, verified_status: nextStatus } : s
        )
      );
      showToast(
        'success',
        nextStatus ? 'Đã kích hoạt mở khóa Studio thành công!' : 'Đã tạm khóa Studio khỏi hệ thống!'
      );
    } catch (err: any) {
      showToast('error', `Lỗi thao tác: ${err?.message || 'Không thể thay đổi trạng thái Studio'}`);
    }
  };

  // Handler: Đổi phân loại tài khoản người dùng (Account Type)
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('users')
          .update({ account_type: newRole })
          .eq('id', userId);
      }
      setUsersList(prev =>
        prev.map(u => (u.id === userId ? { ...u, account_type: newRole } : u))
      );
      showToast('success', `Đã chuyển đổi phân loại tài khoản sang "${newRole}"!`);
    } catch (err: any) {
      showToast('error', `Lỗi: ${err?.message || 'Không thể cập nhật quyền người dùng'}`);
    }
  };

  // Handler: Toggle xác thực người dùng (Facebook Verification)
  const handleToggleUserVerification = async (userId: string, currentVerified: boolean) => {
    const nextVerified = !currentVerified;
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('users')
          .update({ is_verified: nextVerified })
          .eq('id', userId);
      }
      setUsersList(prev =>
        prev.map(u => (u.id === userId ? { ...u, is_verified: nextVerified } : u))
      );
      showToast(
        'success',
        nextVerified ? 'Đã duyệt huy hiệu xác thực cho thợ ảnh!' : 'Đã hủy trạng thái xác thực!'
      );
    } catch (err: any) {
      showToast('error', `Lỗi: ${err?.message || 'Không thể cập nhật xác thực'}`);
    }
  };

  // Filtered Studios
  const filteredStudios = useMemo(() => {
    return studios.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.slug && s.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.invite_code && s.invite_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.owner_name && s.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.owner_email && s.owner_email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTier = tierFilter === 'All' || s.tier?.toLowerCase() === tierFilter.toLowerCase();
      return matchSearch && matchTier;
    });
  }, [studios, searchQuery, tierFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchRole = roleFilter === 'All' || u.account_type === roleFilter;
      return matchSearch && matchRole;
    });
  }, [usersList, searchQuery, roleFilter]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold backdrop-blur-2xl border transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/30 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. HEADER SECTION (SUPER ADMIN ROOT)                                  */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all shadow-2xs group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              SYSTEM ROOT • SUPER ADMIN CONSOLE
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Trung Tâm Quản Trị Hệ Thống SaaS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Quản trị toàn diện các Studio đa khách hàng (Tenants), phân quyền tài khoản người dùng và kiểm soát phân bổ gói cước nền tảng.
          </p>
        </div>

        {/* Nút Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-zinc-200 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm Mới Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. TOP 3 KPI BENTO CARDS (EXECUTIVE METRICS)                           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Studios */}
        <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 border-l-4 border-l-orange-500 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                TỔNG STUDIO VẬN HÀNH
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                {studios.length} <span className="text-sm font-sans font-normal text-slate-400">Tenant</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span>Hoạt động: {studios.filter(s => s.is_active !== false).length}</span>
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              VIP / Pro: {studios.filter(s => s.tier === 'VIP' || s.tier === 'Pro' || s.tier === 'Enterprise').length}
            </span>
          </div>
        </div>

        {/* Card 2: Users */}
        <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 border-l-4 border-l-blue-500 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                TỔNG NGƯỜI DÙNG SAAS
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                {usersList.length} <span className="text-sm font-sans font-normal text-slate-400">Users</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span>Chủ Studio: {usersList.filter(u => u.account_type === 'studio_admin').length}</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              Freelancer: {usersList.filter(u => u.account_type === 'freelancer').length}
            </span>
          </div>
        </div>

        {/* Card 3: Bookings Volume */}
        <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/50 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 border-l-4 border-l-amber-500 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                LỊCH ĐẶT TRÊN TOÀN HỆ THỐNG
              </span>
              <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                {totalBookingsCount} <span className="text-sm font-sans font-normal text-slate-400">Ca chụp</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span>Bảo chứng: SePAY Banking</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Multi-tenant 100%</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TABS CONTAINER & WORKSPACE CONTROLS                                */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-2xl p-4 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('studios')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'studios'
                  ? 'bg-zinc-950 text-white dark:bg-orange-600 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Quản Lý Studio Trên Hệ Thống ({studios.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-zinc-950 text-white dark:bg-orange-600 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Quản Lý Người Dùng (Users) ({usersList.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 self-end sm:self-auto">
            {activeTab === 'studios'
              ? `Hiển thị ${filteredStudios.length} / ${studios.length} studio`
              : `Hiển thị ${filteredUsers.length} / ${usersList.length} người dùng`}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'studios'
                  ? 'Tìm theo tên Studio, mã mời, chủ sở hữu, email...'
                  : 'Tìm theo tên người dùng, email, SĐT...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Bộ lọc tùy theo Tab */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            {activeTab === 'studios' ? (
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="All" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Tất Cả Gói Cước</option>
                <option value="Free" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gói Miễn Phí (Free)</option>
                <option value="Starter" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gói Khởi Đầu (Starter)</option>
                <option value="Growth" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gói Tăng Trưởng (Growth)</option>
                <option value="Pro" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gói Chuyên Nghiệp (Pro)</option>
                <option value="Enterprise" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gói Enterprise / VIP</option>
              </select>
            ) : (
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="All" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Tất Cả Phân Loại</option>
                <option value="studio_admin" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Chủ Studio / Quản Lý</option>
                <option value="freelancer" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Freelancer Solo</option>
                <option value="studio_member" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Thành Viên Ekip</option>
              </select>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: DANH SÁCH STUDIO                                               */}
        {/* ===================================================================== */}
        {activeTab === 'studios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="pb-3 pt-1">Studio & Mã Mời</th>
                  <th className="pb-3 pt-1">Chủ Sở Hữu / Liên Hệ</th>
                  <th className="pb-3 pt-1">Địa Chỉ & Định Danh</th>
                  <th className="pb-3 pt-1">Gói Cước (Tier)</th>
                  <th className="pb-3 pt-1">Trạng Thái</th>
                  <th className="pb-3 pt-1 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredStudios.map(s => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Tên & Mã mời */}
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-500/30">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {s.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                            <span>Mã Ekip:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {s.invite_code || 'CHƯA TẠO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Chủ sở hữu */}
                    <td className="py-3.5 pr-2">
                      <div className="font-medium text-slate-900 dark:text-zinc-200">
                        {s.owner_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 truncate">
                        {s.owner_email}
                      </div>
                    </td>

                    {/* Slug & Địa chỉ */}
                    <td className="py-3.5 pr-2 max-w-[220px]">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-zinc-400 truncate">
                        /book/studio/{s.slug}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate" title={s.address}>
                        {s.address}
                      </div>
                    </td>

                    {/* Gói Cước (Dropdown cập nhật trực tiếp) */}
                    <td className="py-3.5 pr-2">
                      <select
                        value={s.tier || 'Standard'}
                        onChange={e => handleUpdateStudioTier(s.id, e.target.value)}
                        className="h-7 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-[11px] font-bold text-slate-800 dark:text-zinc-200 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="Free" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Free (10 Show)</option>
                        <option value="Starter" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Starter (30 Show)</option>
                        <option value="Growth" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Growth (50 Show)</option>
                        <option value="Pro" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Pro (Không giới hạn)</option>
                        <option value="Enterprise" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Enterprise VIP</option>
                      </select>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 pr-2">
                      {s.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Tạm Khóa
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Link xem public booking của Studio */}
                        {s.slug && (
                          <a
                            href={`/book/studio/${s.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-300 hover:text-orange-500 transition-colors"
                            title="Mở Cổng Booking Khách Hàng của Studio"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Nút Khóa / Mở Khóa Studio */}
                        <button
                          type="button"
                          onClick={() => handleToggleStudioStatus(s.id, s.is_active !== false)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            s.is_active !== false
                              ? 'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                              : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {s.is_active !== false ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Mở Khóa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudios.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                Không tìm thấy studio nào khớp với điều kiện tìm kiếm.
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: QUẢN LÝ NGƯỜI DÙNG (USERS)                                     */}
        {/* ===================================================================== */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="pb-3 pt-1">Họ Tên & Email</th>
                  <th className="pb-3 pt-1">Số Điện Thoại</th>
                  <th className="pb-3 pt-1">Phân Loại Tài Khoản</th>
                  <th className="pb-3 pt-1">Xác Thực Thợ Ảnh</th>
                  <th className="pb-3 pt-1">Ngày Gia Nhập</th>
                  <th className="pb-3 pt-1 text-right">Thao Tác Quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Tên & Email */}
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-zinc-300 shrink-0 border border-slate-300 dark:border-zinc-700">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                            <span>{u.full_name}</span>
                            {u.is_verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Số điện thoại */}
                    <td className="py-3.5 pr-2 font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                      {u.phone || 'Chưa cập nhật'}
                    </td>

                    {/* Phân loại tài khoản (Select Box) */}
                    <td className="py-3.5 pr-2">
                      <select
                        value={u.account_type || 'freelancer'}
                        onChange={e => handleUpdateUserRole(u.id, e.target.value)}
                        className="h-7 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-[11px] font-bold text-slate-800 dark:text-zinc-200 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="studio_admin" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Chủ Studio / Quản Lý (studio_admin)</option>
                        <option value="freelancer" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Freelancer Solo (freelancer)</option>
                        <option value="studio_member" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Thành Viên Ekip (studio_member)</option>
                      </select>
                    </td>

                    {/* Trạng thái xác thực */}
                    <td className="py-3.5 pr-2">
                      <button
                        type="button"
                        onClick={() => handleToggleUserVerification(u.id, !!u.is_verified)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          u.is_verified
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700 hover:border-blue-400'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{u.is_verified ? 'Đã Xác Thực' : 'Chưa Duyệt'}</span>
                      </button>
                    </td>

                    {/* Ngày gia nhập */}
                    <td className="py-3.5 pr-2 font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '2026-01-01'}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 text-right whitespace-nowrap">
                      {u.facebook_url && (
                        <a
                          href={u.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:text-blue-500 transition-colors text-[10px] font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Facebook</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
                Không tìm thấy người dùng nào khớp với điều kiện tìm kiếm.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminConsolePage;
