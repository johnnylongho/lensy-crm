import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
  TrendingUp,
  Plus,
  Calendar as CalendarIcon,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { TierBadge } from '../components/dashboard/TierBadge';
import { TierConfig, TIER_CONFIGS, calculateYtdRevenue, getTierProgress } from '../utils/tierSystem';
import { QuickPassShowModal } from '../components/dashboard/QuickPassShowModal';

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentStudio, studioRole, isStudioAdmin, isFreelancer } = useWorkspace();
  const location = useLocation();

  const [currentUsername, setCurrentUsername] = useState<string>('johnnylongho');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPassShowOpen, setIsPassShowOpen] = useState(false);
  const [studioTier, setStudioTier] = useState<TierConfig>(TIER_CONFIGS.gold);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const navItems = [
    {
      to: '/dashboard',
      label: 'Tổng Quan',
      icon: Layers,
      isActive: location.pathname === '/dashboard',
    },
    {
      to: '/dashboard/packages',
      label: 'Gói Dịch Vụ',
      icon: Package,
      isActive: location.pathname.startsWith('/dashboard/packages'),
    },
    {
      to: '/dashboard/clients',
      label: 'Khách Hàng',
      icon: Users,
      isActive: location.pathname.startsWith('/dashboard/clients'),
    },
    ...(!isFreelancer
      ? [
          {
            to: '/dashboard/gears',
            label: 'Thiết Bị',
            icon: SlidersHorizontal,
            isActive: location.pathname.startsWith('/dashboard/gears'),
          },
        ]
      : []),
    {
      to: '/dashboard/settings',
      label: 'Cài Đặt',
      icon: Settings,
      isActive: location.pathname.startsWith('/dashboard/settings'),
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
    if (location.pathname === '/dashboard') return 'Tổng Quan Studio';
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
      {/* 1. LEFT SIDEBAR                                                       */}
      {/* ===================================================================== */}
      <aside
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 lg:static flex-shrink-0 w-64 lg:w-64 shrink-0 h-full overflow-y-auto border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800/80">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 p-1.5 border border-orange-200/60 dark:border-orange-800/40 group-hover:scale-105 transition-transform">
                <img src="/lensy-logo.png" alt="Lensy CRM" className="h-full w-full object-contain rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>Lensy</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 uppercase border border-orange-500/25">
                    CRM
                  </span>
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Studio Management
                </p>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Menus */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-gray-400 dark:text-zinc-500 uppercase">
              Menu Chính
            </div>
            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = item.isActive;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-bold'
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Operations & Team Management Sub-menu (Chỉ dành cho Studio) */}
          {!isFreelancer && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-gray-400 dark:text-zinc-500 uppercase">
                Vận Hành & Dịch Vụ
              </div>
              <div className="space-y-1 text-sm font-medium">
                {[
                  { label: 'Hiệu Suất Ekip', icon: TrendingUp, to: '/dashboard' },
                  { label: 'Khách Hàng & Hợp Đồng', icon: Users, to: '/dashboard/clients' },
                  { label: 'Kho Thiết Bị & Khấu Hao', icon: SlidersHorizontal, to: '/dashboard/gears' },
                  { label: 'Bảng Giá & Gói Dịch Vụ', icon: Package, to: '/dashboard/packages' },
                ].map((sub, idx) => {
                  const Icon = sub.icon;
                  return (
                    <Link
                      key={idx}
                      to={sub.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {isFreelancer && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 space-y-1 text-xs">
              <div className="font-bold text-amber-500 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Chế Độ Thợ Tự Do</span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-tight">
                Giao diện tinh giản, tập trung lịch chụp cá nhân, khách hàng và doanh thu solo.
              </p>
            </div>
          )}
        </div>

        {/* Bottom widgets of Sidebar */}
        <div className="pt-6 space-y-3">
          {/* Studio Bays Status Pill (Chỉ hiển thị cho Studio) */}
          {!isFreelancer && (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/40 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-white mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Studio Bays</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300/40 rounded-full px-2 py-0.5 font-medium">
                  2/3 Sẵn sàng
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Bay 1 (Cyclorama)</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">Đang Chụp</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Bay 2 (Daylight Loft)</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sẵn Sàng</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                  <span>Bay 3 (Sanctuary Garden)</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sẵn Sàng</span>
                </div>
              </div>
            </div>
          )}

          {/* Public Booking Link Banner */}
          <div className="rounded-xl border border-orange-200/60 dark:border-orange-950/40 bg-orange-50/50 dark:bg-orange-950/20 p-3">
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
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {getPageTitle()}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Hệ thống quản lý lịch chụp, dòng tiền và vận hành Studio chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Top Action Buttons & Profile Card Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Button: + Pass Show (Tạo lịch thủ công nhanh) */}
            <button
              type="button"
              onClick={() => setIsPassShowOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Tạo lịch chụp thủ công / Nhận pass show"
            >
              <Zap className="h-4 w-4 stroke-[2.5] text-amber-500" />
              <span>Pass Show</span>
            </button>

            {/* Button: + Tạo Lịch Mới */}
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
                    {isFreelancer ? 'Thợ Tự Do (Freelancer)' : (currentStudio?.name || 'Studio Admin')}
                  </div>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 dark:text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl p-2 z-50 text-xs space-y-1">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{userFullName}</p>
                      <TierBadge tier={studioTier} size="xs" />
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono truncate">{user?.email}</p>
                    {isFreelancer ? (
                      <div className="pt-1.5 mt-1 border-t border-gray-200 dark:border-zinc-700/60 flex items-center justify-between text-[10px]">
                        <span className="text-gray-600 dark:text-zinc-400 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-amber-500" />
                          <span className="font-semibold">Thợ Ảnh Tự Do</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono uppercase font-bold">
                          Freelancer
                        </span>
                      </div>
                    ) : currentStudio && (
                      <div className="pt-1.5 mt-1 border-t border-gray-200 dark:border-zinc-700/60 flex items-center justify-between text-[10px]">
                        <span className="text-gray-600 dark:text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-orange-600" />
                          <span className="truncate max-w-[120px] font-semibold">{currentStudio.name}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 font-mono uppercase font-bold">
                          {studioRole === 'admin' ? 'Admin' : 'Thợ ảnh'}
                        </span>
                      </div>
                    )}
                  </div>

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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outlet: Renders PhotographerDashboard or child routes */}
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>

        {/* Modal: Tạo lịch thủ công / Pass show */}
        <QuickPassShowModal
          isOpen={isPassShowOpen}
          onClose={() => setIsPassShowOpen(false)}
        />
      </main>
    </div>
  );
};

export default DashboardLayout;
