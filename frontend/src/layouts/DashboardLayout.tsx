import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
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
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { TierBadge } from '../components/dashboard/TierBadge';
import { TierConfig, TIER_CONFIGS, calculateYtdRevenue, getTierProgress } from '../utils/tierSystem';

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentStudio, studioRole, isStudioAdmin } = useWorkspace();
  const location = useLocation();
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
  }, [location.pathname]);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Lịch Chụp',
      icon: Calendar,
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
    {
      to: '/dashboard/gears',
      label: 'Thiết Bị',
      icon: Camera,
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] dark:bg-[#050505] text-slate-800 dark:text-slate-100 flex flex-col relative overflow-x-hidden transition-colors duration-200">
      {/* ==================================================================== */}
      {/* 1. LIQUID GLASS BACKGROUND DEPTH (Ánh sáng mờ ảo phía sau nền sâu thẳm) */}
      {/* ==================================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Khối 1: Tím Indigo / Amber Gradient sâu thẳm */}
        <div className="absolute -top-32 -left-32 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-transparent blur-[120px] opacity-30 dark:opacity-35" />

        {/* Khối 2: Teal / Cyan Gradient */}
        <div className="absolute top-10 -right-32 w-80 sm:w-[550px] h-80 sm:h-[550px] rounded-full bg-gradient-to-br from-teal-500/20 via-emerald-600/15 to-transparent blur-[120px] opacity-30 dark:opacity-35" />

        {/* Khối 3: Hổ phách nhẹ trung tâm */}
        <div className="absolute -bottom-40 left-1/3 w-80 sm:w-[600px] h-80 sm:h-[600px] rounded-full bg-gradient-to-tr from-amber-600/15 via-rose-950/10 to-transparent blur-[120px] opacity-30 dark:opacity-25" />
      </div>

      {/* ==================================================================== */}
      {/* 2. TOP HEADER NAVBAR NỔI (MINIMALIST GLASSMORPHISM - KHÔNG TRÀN CHỮ)  */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-[#050505]/75 backdrop-blur-2xl border-b border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo: Tối giản, thanh lịch, xóa bỏ tên Studio thừa trên Header */}
          <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="h-8 w-auto flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/lensy-logo.png"
                alt="Lensy CRM"
                className="h-8 w-auto object-contain"
              />
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

          {/* Dàn trải các menu chính dạng Minimalist Text Links: Xóa nền & viền, text-gray-400, whitespace-nowrap */}
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

            {/* Menu Link Đặt Lịch công khai dạng Text Link */}
            <a
              href={`/book/${currentUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative py-1 text-xs sm:text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
              title={`Trang Đặt Lịch Công Khai (@${currentUsername})`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Link Đặt Lịch</span>
            </a>
          </nav>

          {/* Right Header Actions: ThemeToggle + User Avatar Dropdown */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle duy nhất */}
            <ThemeToggle size="sm" />

            {/* User Avatar Dropdown (Gom toàn bộ User Actions: Tên, Cài đặt, Đăng xuất) */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-white/40 dark:hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                aria-label="User profile and menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-white/10 group-hover:ring-amber-400/50 transition-all flex-shrink-0">
                  {userInitials}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {/* Dropdown Menu thả xuống */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 animate-scaleUp text-xs space-y-1">
                  {/* Profile info header */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{userFullName}</p>
                      <TierBadge tier={studioTier} size="xs" />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate">{user?.email}</p>
                    {currentStudio && (
                      <div className="pt-1.5 mt-1 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-500" />
                          <span className="truncate max-w-[120px] font-semibold">{currentStudio.name}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono uppercase font-bold">
                          {studioRole === 'admin' ? 'Admin' : 'Thợ ảnh'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Links */}
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

                    <a
                      href={`/book/${currentUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <ExternalLink className="w-4 h-4 text-amber-500" />
                        <span>Trang Đặt Lịch</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">@{currentUsername}</span>
                    </a>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 dark:bg-white/10 my-1" />

                  {/* Sign Out Button */}
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

                  {/* Dấu ấn bản quyền */}
                  <div className="pt-1.5 pb-0.5 text-center">
                    <span className="text-[10px] text-gray-400 dark:text-gray-400 italic">
                      by Mirmia Studio
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger (< md) */}
            <div className="md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="p-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Mobile Drawer Dropdown */}
              {isMobileMenuOpen && (
                <div className="absolute right-3 top-full mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-3 z-50 animate-scaleUp text-xs space-y-1.5">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Menu Điều Hướng
                  </div>

                  {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
                          item.isActive
                            ? 'bg-amber-500/10 text-amber-500 font-semibold'
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  <a
                    href={`/book/${currentUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/5 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                      <span>Link Đặt Lịch</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">@{currentUsername}</span>
                  </a>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/10" />

                  {/* Sign Out on Mobile */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. MAIN CONTENT AREA (Bung toàn bộ chiều rộng max-w-7xl)             */}
      {/* ==================================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
