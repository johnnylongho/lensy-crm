import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import {
  Calendar,
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
  Briefcase,
  SlidersHorizontal,
  TrendingUp,
  DollarSign,
  Plus,
  Palette,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { TierBadge } from '../components/dashboard/TierBadge';
import { TierConfig, TIER_CONFIGS, calculateYtdRevenue, getTierProgress } from '../utils/tierSystem';

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentStudio, studioRole, isStudioAdmin } = useWorkspace();
  const { uiMode, toggleUiMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUsername, setCurrentUsername] = useState<string>('johnnylongho');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [studioTier, setStudioTier] = useState<TierConfig>(TIER_CONFIGS.gold);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      isActive: location.pathname === '/dashboard' && !location.search,
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
    {
      to: '/dashboard/gears',
      label: 'Thiết Bị',
      icon: SlidersHorizontal,
      isActive: location.pathname.startsWith('/dashboard/gears'),
    },
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

  // =========================================================================
  // GIAO DIỆN 1: WARM CLAY FROSTED GLASS THEME (THEME MỚI TỐI ƯU THEO YÊU CẦU)
  // =========================================================================
  if (uiMode === 'clay') {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#eed7c7] via-[#f7e8dc] to-[#e4cbbe] dark:from-[#131418] dark:via-[#191b22] dark:to-[#111216] p-3 sm:p-6 lg:p-8 font-sans selection:bg-[#df8653] selection:text-white transition-colors duration-300">
        {/* Decorative Warm Ambient Light Orbs for Glassmorphism Depth */}
        <div className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#f8baa0]/40 dark:from-[#c86d3b]/20 to-transparent blur-[120px]" />
        <div className="pointer-events-none fixed top-1/3 -right-40 h-[650px] w-[650px] rounded-full bg-gradient-to-tl from-[#e8a382]/35 dark:from-[#e49366]/15 via-[#f0c3aa]/20 to-transparent blur-[140px]" />
        <div className="pointer-events-none fixed -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#deb199]/40 dark:from-[#965a3c]/20 to-transparent blur-[120px]" />

        {/* Decorative Ribbon curve behind the glass sheet */}
        <div className="pointer-events-none fixed top-10 left-10 h-full w-full opacity-25 dark:opacity-10">
          <svg
            viewBox="0 0 1200 900"
            fill="none"
            className="h-full w-full stroke-orange-300/40"
            strokeWidth="6"
          >
            <path d="M-100,500 C200,300 400,750 800,400 C1100,100 1300,500 1500,300" />
            <path d="M-50,550 C250,350 450,800 850,450 C1150,150 1350,550 1550,350" strokeWidth="2" strokeDasharray="8 8" />
          </svg>
        </div>

        {/* ========================================================================= */}
        {/* MAIN FROSTED GLASS CONTAINER                                              */}
        {/* ========================================================================= */}
        <div className="relative mx-auto max-w-[1520px] rounded-[32px] sm:rounded-[38px] border border-white/60 dark:border-white/10 clay-glass-container p-4 sm:p-6 lg:p-8 backdrop-blur-2xl transition-all">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* ===================================================================== */}
            {/* 1. LEFT SIDEBAR                                                       */}
            {/* ===================================================================== */}
            <aside className="lg:w-64 shrink-0">
              {/* Logo / Brand Header */}
              <div className="flex items-center justify-between pb-6">
                <Link to="/dashboard" className="flex items-center gap-3 group">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#c86d3b] to-[#e49366] text-white shadow-[0_4px_14px_rgba(200,109,59,0.35)] group-hover:scale-105 transition-transform">
                    <Camera className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1b2234] dark:text-white">
                      Lensy
                    </h1>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b776a] dark:text-zinc-400">
                      Studio CRM
                    </p>
                  </div>
                </Link>

                {/* Mobile menu button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/10 p-2 text-[#463d36] dark:text-white backdrop-blur-md"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>

              {/* Navigation Menus */}
              <div
                className={`space-y-6 lg:block ${
                  isMobileMenuOpen ? 'block' : 'hidden'
                }`}
                ref={mobileMenuRef}
              >
                {/* Main Menu */}
                <div>
                  <div className="px-3 mb-2.5 text-[11px] font-semibold tracking-wider text-[#98877b] dark:text-zinc-400 uppercase">
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
                          className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? 'border border-white/90 dark:border-white/15 bg-white/85 dark:bg-white/15 text-[#1a2030] dark:text-white shadow-[0_4px_16px_rgba(180,140,120,0.15)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md'
                              : 'text-[#5d564f] dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-[#1a2030] dark:hover:text-white'
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors ${
                              isActive
                                ? 'bg-[#1b2234] dark:bg-[#c86d3b] text-white shadow-xs'
                                : 'text-[#7d7167] dark:text-zinc-400 group-hover:text-[#1a2030] dark:group-hover:text-white'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Team Management Sub-menu */}
                <div>
                  <div className="px-3 mb-2.5 text-[11px] font-semibold tracking-wider text-[#98877b] dark:text-zinc-400 uppercase">
                    Quản Lý Vận Hành
                  </div>
                  <div className="space-y-1 text-sm font-medium text-[#5d564f] dark:text-zinc-400">
                    {[
                      { label: 'Hiệu Suất Ekip', icon: TrendingUp, to: '/dashboard' },
                      { label: 'Hồ Sơ Khách Hàng', icon: Users, to: '/dashboard/clients' },
                      { label: 'Kho Thiết Bị & ROI', icon: Camera, to: '/dashboard/gears' },
                      { label: 'Bảng Giá & Gói Chụp', icon: Package, to: '/dashboard/packages' },
                    ].map((sub, idx) => {
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={idx}
                          to={sub.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-xs text-[#5d564f] dark:text-zinc-400 hover:bg-white/35 dark:hover:bg-white/5 hover:text-[#1a2030] dark:hover:text-white transition-colors"
                        >
                          <Icon className="h-3.5 w-3.5 text-[#8f7e73] dark:text-zinc-400" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Studio Bays Status Pill */}
                <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 p-3.5 backdrop-blur-md shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2a241f] dark:text-white mb-2">
                    <span>Studio Bays</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300/40 rounded-full px-2 py-0.5">
                      2/3 Sẵn sàng
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center text-[#554b43] dark:text-zinc-400">
                      <span>Bay 1 (Cyclorama)</span>
                      <span className="font-semibold text-[#c86d3b]">Đang Chụp</span>
                    </div>
                    <div className="flex justify-between items-center text-[#554b43] dark:text-zinc-400">
                      <span>Bay 2 (Daylight Loft)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sẵn Sàng</span>
                    </div>
                    <div className="flex justify-between items-center text-[#554b43] dark:text-zinc-400">
                      <span>Bay 3 (Sanctuary)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sẵn Sàng</span>
                    </div>
                  </div>
                </div>

                {/* Switch back to Classic Theme button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={toggleUiMode}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 p-2 text-xs font-semibold text-[#6d5b4f] dark:text-zinc-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all"
                    title="Chuyển sang giao diện Classic Slate ban đầu"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#c86d3b]" />
                    <span>Giao diện Cũ (Classic)</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* ===================================================================== */}
            {/* 2. MAIN CONTENT AREA                                                  */}
            {/* ===================================================================== */}
            <main className="flex-1 space-y-6 min-w-0">
              {/* Header: Page Title + Actions + Profile Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1b2234] dark:text-white">
                    {getPageTitle()}
                  </h2>
                  <p className="text-xs text-[#827367] dark:text-zinc-400 mt-0.5">
                    Hệ thống quản lý lịch chụp, dòng tiền và studio chuyên nghiệp
                  </p>
                </div>

                {/* Top Action Buttons & Profile Card Pill */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  {/* Button: + Tạo Lịch Mới */}
                  <button
                    type="button"
                    onClick={handleOpenNewBooking}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#df8653] to-[#c86d3b] px-3.5 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(200,109,59,0.35)] hover:brightness-105 active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Tạo Lịch Mới</span>
                  </button>

                  {/* Theme Switcher Toggle */}
                  <ThemeToggle size="sm" />

                  {/* Profile Card Pill in top right */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2.5 rounded-full border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md hover:bg-white/90 dark:hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#c86d3b] to-[#df8653] text-xs font-bold text-white shadow-xs">
                        {userInitials}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-xs font-bold text-[#1b2234] dark:text-white leading-tight">
                          {userFullName}
                        </div>
                        <div className="text-[10px] text-[#8b776a] dark:text-zinc-400 leading-tight">
                          {currentStudio?.name || 'Studio'}
                        </div>
                      </div>
                      <ChevronDown className={`h-3.5 w-3.5 text-[#7c7066] dark:text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-white/95 dark:bg-[#121318]/95 backdrop-blur-2xl border border-white/90 dark:border-white/10 shadow-2xl p-2 z-50 text-xs space-y-1">
                        <div className="p-3 rounded-xl bg-[#faf3ed] dark:bg-white/5 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-[#1b2234] dark:text-white truncate">{userFullName}</p>
                            <TierBadge tier={studioTier} size="xs" />
                          </div>
                          <p className="text-[11px] text-[#8b776a] dark:text-zinc-400 font-mono truncate">{user?.email}</p>
                        </div>

                        <div className="pt-1 space-y-0.5">
                          <Link
                            to="/dashboard/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#463d36] dark:text-zinc-300 hover:bg-[#faf3ed] dark:hover:bg-white/5 font-medium transition-colors"
                          >
                            <Settings className="w-4 h-4 text-[#8b776a]" />
                            <span>Cài Đặt Hồ Sơ</span>
                          </Link>

                          {isStudioAdmin && (
                            <Link
                              to="/dashboard/studio-settings"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#463d36] dark:text-zinc-300 hover:bg-[#faf3ed] dark:hover:bg-white/5 font-medium transition-colors"
                            >
                              <Building2 className="w-4 h-4 text-[#c86d3b]" />
                              <span>Quản Trị Studio</span>
                            </Link>
                          )}

                          <a
                            href={`/book/${currentUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-[#463d36] dark:text-zinc-300 hover:bg-[#faf3ed] dark:hover:bg-white/5 font-medium transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-[#c86d3b]" />
                              <span>Trang Đặt Lịch</span>
                            </span>
                            <span className="text-[10px] font-mono text-[#8b776a]">@{currentUsername}</span>
                          </a>

                          {/* Quick theme toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              toggleUiMode();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#463d36] dark:text-zinc-300 hover:bg-[#faf3ed] dark:hover:bg-white/5 font-medium transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Palette className="w-4 h-4 text-[#c86d3b]" />
                              <span>Đổi sang Classic UI</span>
                            </span>
                          </button>
                        </div>

                        <div className="h-px bg-[#ebdcd1] dark:bg-white/10 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-medium transition-colors cursor-pointer"
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
            </main>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN 2: CLASSIC MINIMALIST SLATE THEME (DỰ PHÒNG HOÀN TOÀN)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-800 dark:text-slate-100 flex flex-col relative overflow-x-hidden transition-colors duration-200">
      {/* Liquid Glass Background Depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-transparent blur-[120px] opacity-30 dark:opacity-35" />
        <div className="absolute top-10 -right-32 w-80 sm:w-[550px] h-80 sm:h-[550px] rounded-full bg-gradient-to-br from-teal-500/20 via-emerald-600/15 to-transparent blur-[120px] opacity-30 dark:opacity-35" />
        <div className="absolute -bottom-40 left-1/3 w-80 sm:w-[600px] h-80 sm:h-[600px] rounded-full bg-gradient-to-tr from-amber-600/15 via-rose-950/10 to-transparent blur-[120px] opacity-30 dark:opacity-25" />
      </div>

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-[#050505]/75 backdrop-blur-2xl border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="h-8 w-auto flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img src="/lensy-logo.png" alt="Lensy CRM" className="h-8 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Lensy
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                CRM
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative py-1 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  item.isActive
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                )}
              </Link>
            ))}

            <a
              href={`/book/${currentUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative py-1 text-xs sm:text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Link Đặt Lịch</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Nút chuyển sang Clay Studio Theme */}
            <button
              type="button"
              onClick={toggleUiMode}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme Clay (Mới)</span>
            </button>

            <ThemeToggle size="sm" />

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-white/40 dark:hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-white/10 group-hover:ring-amber-400/50 transition-all flex-shrink-0">
                  {userInitials}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 animate-scaleUp text-xs space-y-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{userFullName}</p>
                      <TierBadge tier={studioTier} size="xs" />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">{user?.email}</p>
                  </div>

                  <div className="pt-1 space-y-0.5">
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Cài Đặt Tài Khoản</span>
                    </Link>

                    {isStudioAdmin && (
                      <Link
                        to="/dashboard/studio-settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>Quản Trị Studio</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        toggleUiMode();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      <span>Bật Theme Clay (Mới)</span>
                    </button>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-white/10 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-3 top-full mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-3 z-50 text-xs space-y-1.5">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium ${
                          item.isActive
                            ? 'bg-amber-500/10 text-amber-500 font-semibold'
                            : 'text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      toggleUiMode();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-600 font-semibold"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Bật Theme Clay (Mới)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 relative z-10">
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DashboardLayout;
