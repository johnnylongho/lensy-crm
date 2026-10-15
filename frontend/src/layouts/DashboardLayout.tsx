import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { supabase } from '../lib/supabase';
import {
  Camera,
  Settings,
  ExternalLink,
  LogOut,
  Users,
  Menu,
  X,
  Package,
  Building2,
  ChevronDown,
  Layers,
  SlidersHorizontal,
  Plus,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { TierBadge } from '../components/dashboard/TierBadge';
import { TierConfig, TIER_CONFIGS, calculateYtdRevenue, getTierProgress } from '../utils/tierSystem';
import { QuickPassShowModal } from '../components/dashboard/QuickPassShowModal';

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    currentStudio,
    studioRole,
    isStudioAdmin,
    isStudioMember,
    isFreelancer,
    accountType,
    switchAccountType,
  } = useWorkspace();
  const location = useLocation();

  const [currentUsername, setCurrentUsername] = useState<string>('johnnylongho');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lensy_sidebar_collapsed') === 'true';
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPassShowOpen, setIsPassShowOpen] = useState(false);
  const [studioTier, setStudioTier] = useState<TierConfig>(TIER_CONFIGS.gold);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('lensy_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Lắng nghe sự kiện mở modal pass show từ mọi component
  useEffect(() => {
    const handlePassShow = () => setIsPassShowOpen(true);
    window.addEventListener('lensy:pass-show', handlePassShow);
    return () => window.removeEventListener('lensy:pass-show', handlePassShow);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.username) {
          setCurrentUsername(data.username);
        }
      });

    // Tính toán cấp bậc studio
    const currentYear = new Date().getFullYear();
    let query = supabase.from('bookings').select('package_price, paid_amount, status, event_date');
    if (currentStudio) {
      query = query.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user.id}`);
    } else {
      query = query.eq('photographer_id', user.id);
    }
    query.then(({ data }) => {
      if (data && data.length > 0) {
        const mapped = data.map((b: any) => ({
          id: '',
          clientName: '',
          sessionType: 'wedding' as const,
          eventDate: b.event_date,
          startTime: '',
          endTime: '',
          location: '',
          status: b.status,
          packagePrice: Number(b.package_price || 0),
          depositAmount: 0,
          paidAmount: Number(b.paid_amount || 0),
        }));
        const ytd = calculateYtdRevenue(mapped, currentYear);
        const { currentTier } = getTierProgress(ytd, currentYear);
        setStudioTier(currentTier);
      }
    });
  }, [user, currentStudio]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname, location.search]);

  // Cấu trúc danh mục Menu phân nhóm khoa học theo 3 nhóm vai trò:
  // 1. Quản lý studio: Toàn quyền
  // 2. Thành viên studio: Tập trung ca chụp phân công, CRM khách, kho thiết bị mượn máy
  // 3. Freelancer: Cá nhân solo, CRM khách, bảng giá cá nhân
  const menuGroups = [
    {
      title: 'Vận Hành',
      items: [
        {
          to: '/dashboard',
          label: isStudioMember ? 'Lịch Chụp Phân Công' : isFreelancer ? 'Lịch Chụp Cá Nhân' : 'Tổng Quan Lịch Chụp',
          icon: Layers,
          isActive: location.pathname === '/dashboard',
        },
        {
          to: '/dashboard/clients',
          label: 'Hồ Sơ Khách Hàng (CRM)',
          icon: Users,
          isActive: location.pathname.startsWith('/dashboard/clients'),
        },
      ],
    },
    {
      title: 'Dịch Vụ & Thiết Bị',
      items: [
        // Quản lý studio hoặc Freelancer quản lý bảng giá của mình
        ...(!isStudioMember
          ? [
              {
                to: '/dashboard/packages',
                label: isFreelancer ? 'Bảng Giá Cá Nhân' : 'Bảng Giá & Gói Dịch Vụ',
                icon: Package,
                isActive: location.pathname.startsWith('/dashboard/packages'),
              },
            ]
          : []),
        // Kho thiết bị studio: Hiển thị cho Quản lý studio và Thành viên studio (để mượn máy)
        ...(!isFreelancer
          ? [
              {
                to: '/dashboard/gears',
                label: isStudioMember ? 'Kho Máy Studio (Mượn)' : 'Kho Thiết Bị Studio',
                icon: SlidersHorizontal,
                isActive: location.pathname.startsWith('/dashboard/gears'),
              },
            ]
          : []),
      ],
    },
    {
      title: 'Hệ Thống',
      items: [
        // Quản trị studio: Chỉ Quản lý Studio (Chủ studio) mới có quyền truy cập
        ...(isStudioAdmin
          ? [
              {
                to: '/dashboard/studio-settings',
                label: 'Quản Trị Studio',
                icon: Building2,
                isActive: location.pathname.startsWith('/dashboard/studio-settings'),
              },
            ]
          : []),
        {
          to: '/dashboard/settings',
          label: 'Cài Đặt Hồ Sơ',
          icon: Settings,
          isActive: location.pathname.startsWith('/dashboard/settings'),
        },
      ],
    },
  ];

  const userFullName = user?.user_metadata?.full_name || 'Thợ ảnh';
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || 'TH';

  // Lấy tiêu đề trang
  const getPageTitle = () => {
    if (location.pathname === '/dashboard') {
      if (isStudioMember) return 'Bàn Làm Việc Ekip Studio';
      if (isFreelancer) return 'Không Gian Freelancer Solo';
      return 'Tổng Quan Quản Lý Studio';
    }
    if (location.pathname.startsWith('/dashboard/clients')) return 'Hồ Sơ Khách Hàng (CRM)';
    if (location.pathname.startsWith('/dashboard/gears')) return 'Quản Lý Thiết Bị Studio';
    if (location.pathname.startsWith('/dashboard/packages')) return 'Bảng Giá & Gói Dịch Vụ';
    if (location.pathname.startsWith('/dashboard/studio-settings')) return 'Quản Trị Studio';
    if (location.pathname.startsWith('/dashboard/settings')) return 'Cài Đặt Hồ Sơ';
    return 'Studio CRM';
  };

  const handleOpenNewBooking = () => {
    window.dispatchEvent(new CustomEvent('lensy:create-booking'));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-zinc-950 font-sans selection:bg-[#df8653] selection:text-white transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===================================================================== */}
      {/* 1. LEFT SIDEBAR (Có thể thu gọn linh hoạt / Collapsible)             */}
      {/* ===================================================================== */}
      <aside
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 lg:static flex-shrink-0 shrink-0 h-full overflow-y-auto border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isSidebarCollapsed
            ? 'w-64 lg:w-20 p-4 lg:px-3 lg:py-5'
            : 'w-64 lg:w-64 p-4 sm:p-5 lg:px-3 lg:py-5'
        } ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800/80">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 group ${isSidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}
              title="Trang chủ Lensy CRM"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 p-1.5 border border-orange-200/60 dark:border-orange-800/40 group-hover:scale-105 transition-transform flex-shrink-0">
                <img src="/lensy-logo.png" alt="Lensy CRM" className="h-full w-full object-contain rounded-lg" />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden transition-opacity duration-200">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>Lensy</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 uppercase border border-orange-500/25">
                      CRM
                    </span>
                  </h1>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 truncate">
                    Studio Management
                  </p>
                </div>
              )}
            </Link>

            {/* Nút đóng trên mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Identifier Badge trên Sidebar */}
          {!isSidebarCollapsed && (
            <div className="px-1">
              {isStudioAdmin ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/25 text-[#df8653] dark:text-orange-400 text-xs font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="truncate">Quản Lý Studio</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500 text-white font-black uppercase">
                    Admin
                  </span>
                </div>
              ) : isStudioMember ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <Users className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Thành Viên Ekip</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black uppercase">
                    Ekip
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <Camera className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate">Freelancer Solo</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase">
                    Solo
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <div className="space-y-6">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5">
                {!isSidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    {group.title}
                  </div>
                )}
                <nav className="space-y-1">
                  {group.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const isActive = item.isActive;
                    return (
                      <Link
                        key={itemIdx}
                        to={item.to}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={`flex items-center rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          isSidebarCollapsed
                            ? 'justify-center p-2.5'
                            : 'w-full gap-3 px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20'
                            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                            isActive
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isSidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Banners phân vai trò */}
          {!isSidebarCollapsed && (
            <>
              {isFreelancer && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 space-y-1 text-xs">
                  <div className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chế Độ Freelancer Tự Do</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-tight">
                    Tập trung quản lý lịch cá nhân, danh bạ khách CRM & dòng tiền thực thu solo.
                  </p>
                </div>
              )}
              {isStudioMember && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 space-y-1 text-xs">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Chế Độ Ekip Studio</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-tight">
                    Theo dõi lịch chụp được phân công, kho thiết bị mượn và cập nhật tiến độ ca chụp.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom widgets of Sidebar */}
        <div className="pt-6 space-y-3">
          {/* Public Booking Link Banner */}
          <div className={`rounded-xl border border-orange-200/60 dark:border-orange-950/40 bg-orange-50/50 dark:bg-orange-950/20 ${
            isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-3'
          }`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
                  Link Đặt Lịch Online
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2">
                  Gửi link này cho khách xem báo giá và chốt cọc tự động.
                </p>
                <a
                  href={`/book/${currentUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-900 dark:text-white shadow-2xs hover:border-orange-500 transition-all"
                >
                  <span className="truncate max-w-[130px] font-mono text-[11px]">@{currentUsername}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                </a>
              </>
            ) : (
              <a
                href={`/book/${currentUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-orange-600 dark:text-orange-400 hover:scale-105 transition-transform"
                title={`Mở link đặt lịch online: @${currentUsername}`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Desktop Toggle Sidebar Button DUY NHẤT */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 hidden lg:block">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`w-full flex items-center h-10 rounded-xl text-gray-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-zinc-800 transition-all cursor-pointer group ${
                isSidebarCollapsed ? 'justify-center' : 'px-1'
              }`}
              title={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
              aria-label={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
            >
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-zinc-700/60 transition-colors">
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                ) : (
                  <PanelLeftClose className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-xs font-semibold whitespace-nowrap overflow-hidden text-gray-600 dark:text-zinc-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors ml-2.5">
                  Thu gọn menu
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN CONTENT AREA                                                  */}
      {/* ===================================================================== */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-8">
        {/* Header: Page Title + Actions + Profile Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {getPageTitle()}
                </h2>
                {isStudioAdmin ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400">
                    👑 Quản Lý Studio
                  </span>
                ) : isStudioMember ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    📸 Thành Viên Ekip
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    🎯 Freelancer Solo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {isStudioMember
                  ? 'Theo dõi ca chụp nhận bàn giao, kiểm soát thiết bị mượn và tiến độ buổi chụp'
                  : isFreelancer
                  ? 'Không gian làm việc tinh gọn: lịch chụp cá nhân, CRM khách hàng và doanh thu thực thu'
                  : 'Hệ thống quản lý lịch chụp, dòng tiền thực thu và vận hành Studio chuyên nghiệp'}
              </p>
            </div>
          </div>

          {/* Top Action Buttons & Profile Card Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Button: Pass Show (Tạo lịch thủ công nhanh) */}
            <button
              type="button"
              onClick={() => setIsPassShowOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Tạo lịch chụp thủ công / Nhận pass show"
            >
              <Zap className="h-4 w-4 stroke-[2.5] text-amber-500" />
              <span>Pass Show</span>
            </button>

            {/* Button: Tạo Lịch Mới (Chỉ quản lý hoặc freelancer) */}
            <button
              type="button"
              onClick={handleOpenNewBooking}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Tạo Lịch Mới</span>
            </button>

            {/* Theme Mode Toggle (Dark/Light) */}
            <ThemeToggle size="sm" />

            {/* Profile Card Pill in top right */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-2xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {userFullName}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
                    {isStudioAdmin
                      ? `👑 Quản Lý: ${currentStudio?.name || 'Studio'}`
                      : isStudioMember
                      ? `📸 Ekip: ${currentStudio?.name || 'Studio Member'}`
                      : '🎯 Freelancer Solo'}
                  </div>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 dark:text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl p-2.5 z-50 text-xs space-y-2">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{userFullName}</p>
                      <TierBadge tier={studioTier} size="xs" />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono truncate">{user?.email}</p>
                    <div className="pt-1.5 mt-1 border-t border-gray-200 dark:border-zinc-700/60 flex items-center justify-between text-[10px]">
                      <span className="text-gray-600 dark:text-zinc-400 font-semibold">Vai trò hiện tại:</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        isStudioAdmin
                          ? 'bg-orange-500/20 text-[#df8653] dark:text-orange-400'
                          : isStudioMember
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        {accountType}
                      </span>
                    </div>
                  </div>

                  {/* BỘ CHUYỂN ĐỔI ROLE NHANH ĐỂ TRẢI NGHIỆM GIAO DIỆN (Switch Role) */}
                  {switchAccountType && (
                    <div className="p-2 rounded-xl bg-orange-50/50 dark:bg-zinc-800/80 border border-orange-200/60 dark:border-zinc-700/60 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#df8653] dark:text-orange-400 block">
                        Chuyển Đổi Trải Nghiệm Role:
                      </span>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => switchAccountType('freelancer')}
                          className={`py-1 px-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                            isFreelancer
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-amber-400'
                          }`}
                        >
                          Freelancer
                        </button>
                        <button
                          type="button"
                          onClick={() => switchAccountType('studio_member')}
                          className={`py-1 px-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                            isStudioMember
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-emerald-400'
                          }`}
                        >
                          Thành Viên
                        </button>
                        <button
                          type="button"
                          onClick={() => switchAccountType('studio_admin')}
                          className={`py-1 px-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                            isStudioAdmin
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-orange-400'
                          }`}
                        >
                          Quản Lý
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 space-y-0.5">
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Cài Đặt Hồ Sơ</span>
                    </Link>

                    {isStudioAdmin && (
                      <Link
                        to="/dashboard/studio-settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-orange-600" />
                        <span>Quản Trị Studio</span>
                      </Link>
                    )}

                    <a
                      href={`/book/${currentUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-orange-600" />
                        <span>Trang Đặt Lịch</span>
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">@{currentUsername}</span>
                    </a>
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-zinc-800 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất Khỏi Hệ Thống</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Nested Page Content via Outlet */}
        <div className="relative">
          <Outlet />
        </div>
      </main>

      {/* Modal Quick Pass Show (Tạo lịch nhanh) */}
      <QuickPassShowModal
        isOpen={isPassShowOpen}
        onClose={() => setIsPassShowOpen(false)}
        onBookingCreated={() => {
          setIsPassShowOpen(false);
          window.dispatchEvent(new CustomEvent('lensy:refresh-bookings'));
        }}
      />
    </div>
  );
};
