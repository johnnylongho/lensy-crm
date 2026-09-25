import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [currentUsername, setCurrentUsername] = useState<string>('johnnylongho');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStudioAdmin, setIsStudioAdmin] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

    // Check if user is studio owner or approved admin
    const checkAdmin = async () => {
      try {
        const { data: owned } = await supabase
          .from('studios')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (owned && owned.length > 0) {
          setIsStudioAdmin(true);
          return;
        }

        const { data: member } = await supabase
          .from('studio_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .eq('status', 'approved')
          .limit(1);

        if (member && member.length > 0) {
          setIsStudioAdmin(true);
        } else {
          setIsStudioAdmin(false);
        }
      } catch (err) {
        console.error('Lỗi kiểm tra quyền Studio Admin:', err);
      }
    };
    checkAdmin();
  }, [user]);

  // Đóng mobile menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setIsMobileMenuOpen(false);
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
  ];

  const userFullName = user?.user_metadata?.full_name || 'Thợ ảnh';
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || 'TH';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-100 flex flex-col relative overflow-x-hidden transition-colors duration-200">
      {/* ==================================================================== */}
      {/* 1. LIQUID GLASS BACKGROUND MESH GRADIENT (Ánh sáng mờ ảo phía sau)  */}
      {/* ==================================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Khối 1: Tím Pastel / Indigo Gradient (Góc trên bên trái) */}
        <div className="absolute -top-32 -left-32 w-80 sm:w-[500px] h-80 sm:h-[500px] rounded-full bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-pink-500/10 dark:from-indigo-600/30 dark:via-purple-600/25 dark:to-transparent blur-[120px] opacity-30 dark:opacity-35" />

        {/* Khối 2: Xanh Ngọc / Teal Cyan Gradient (Góc trên bên phải) */}
        <div className="absolute top-10 -right-32 w-80 sm:w-[550px] h-80 sm:h-[550px] rounded-full bg-gradient-to-br from-teal-400/25 via-cyan-500/20 to-emerald-500/15 dark:from-teal-500/30 dark:via-emerald-600/25 dark:to-transparent blur-[120px] opacity-30 dark:opacity-35" />

        {/* Khối 3: Hổ Phách Ấm / Rose Gradient (Góc dưới trung tâm) */}
        <div className="absolute -bottom-40 left-1/3 w-80 sm:w-[600px] h-80 sm:h-[600px] rounded-full bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-transparent dark:from-amber-600/20 dark:via-purple-900/15 dark:to-transparent blur-[140px] opacity-30 dark:opacity-25" />
      </div>

      {/* ==================================================================== */}
      {/* 2. TOP HEADER NAVBAR NỔI (STICKY TOP-0 VỚI TOÀN BỘ 5 MENU DÀN TRẢI) */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/75 dark:bg-black/60 backdrop-blur-xl border-b border-white/60 dark:border-white/10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Studio Name */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="h-8 w-auto flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/lensy-logo.png"
                alt="Lensy - CRM for Photographers"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Lensy
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  CRM
                </span>
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-400/80 italic font-medium tracking-wider mt-0.5">
                by Mirmia Studio
              </span>
            </div>
          </Link>

          {/* Dàn trải toàn bộ các menu chính trên màn hình Desktop/Tablet (md/lg trở lên) - flex items-center gap-4 lg:gap-6 */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                    item.isActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Menu thứ 5: Link Đặt Lịch công khai */}
            <a
              href={`/book/${currentUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
              title={`Trang Đặt Lịch Công Khai (@${currentUsername})`}
            >
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
              <span>Link Đặt Lịch</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-0.5">
                @{currentUsername}
              </span>
            </a>
          </nav>

          {/* Right Header Actions: User Info, Theme Toggle duy nhất, Đăng xuất, Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {/* Tên User & Email trên Desktop */}
            <div className="hidden lg:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                {userInitials}
              </div>
              <div className="flex flex-col text-right min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                  {userFullName}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono truncate max-w-[130px]">
                  {user?.email}
                </span>
              </div>
            </div>

            {/* Nút ThemeToggle duy nhất trên toàn màn hình - nằm cạnh User/Đăng xuất */}
            <ThemeToggle size="sm" />

            {/* Nút Đăng xuất */}
            <button
              type="button"
              onClick={() => signOut()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-slate-600 dark:text-white/70 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold border border-white/60 dark:border-white/10 transition-all"
              title="Đăng xuất khỏi Lensy"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>

            {/* Nút Hamburger menu chỉ hiển thị trên mobile (< md) */}
            <div className="md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="p-2 rounded-xl bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Mobile Drawer Dropdown khi mở Hamburger */}
              {isMobileMenuOpen && (
                <div className="absolute right-3 top-full mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-2xl p-3 z-50 animate-scaleUp text-xs space-y-1.5">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    Menu Điều Hướng
                  </div>

                  {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                          item.isActive
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
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
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                      <span>Link Đặt Lịch</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">@{currentUsername}</span>
                  </a>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/10" />

                  {/* Thông tin User & Đăng xuất trên Mobile */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100/60 dark:bg-white/5 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{userFullName}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold transition-colors"
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
