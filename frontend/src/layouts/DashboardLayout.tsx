import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  ShieldAlert,
  Check,
  DollarSign,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { NotificationDropdown } from '../components/navigation/NotificationDropdown';
import { TierBadge } from '../components/dashboard/TierBadge';
import { TierConfig, TIER_CONFIGS, calculateYtdRevenue, getTierProgress } from '../utils/tierSystem';

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

  const studioDisplayName = currentStudio?.name || 'MIRMIA STUDIO & ACADEMY';
  const studioDisplayLogo =
    currentStudio?.logo_url ||
    (typeof window !== 'undefined' ? localStorage.getItem('lensy_current_studio_logo') : null) ||
    '/mirmia-logo.png';

  const [currentUsername, setCurrentUsername] = useState<string>('johnnylongho');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lensy_sidebar_collapsed') === 'true';
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [studioTier, setStudioTier] = useState<TierConfig>(TIER_CONFIGS.gold);
  const [toastBanner, setToastBanner] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Lắng nghe Toast thông báo lỗi / từ chối truy cập (Access Denied)
  useEffect(() => {
    // 1. Kiểm tra location.state?.error
    if (location.state && (location.state as any).error) {
      setToastBanner({ type: 'error', text: (location.state as any).error });
      window.history.replaceState({}, document.title);
    }

    // 2. Kiểm tra sessionStorage lensy_toast
    try {
      const stored = sessionStorage.getItem('lensy_toast');
      if (stored) {
        sessionStorage.removeItem('lensy_toast');
        const parsed = JSON.parse(stored);
        setToastBanner(parsed);
      }
    } catch (_) {}

    // 3. Lắng nghe CustomEvent lensy:toast
    const handleToastEvent = (e: any) => {
      if (e.detail) {
        setToastBanner(e.detail);
      }
    };
    window.addEventListener('lensy:toast', handleToastEvent);
    return () => window.removeEventListener('lensy:toast', handleToastEvent);
  }, [location]);

  // Tự tắt Toast sau 4.5 giây
  useEffect(() => {
    if (toastBanner) {
      const timer = setTimeout(() => setToastBanner(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastBanner]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('lensy_sidebar_collapsed', String(next));
      return next;
    });
  };

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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentStudio?.id || '');
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id || '');

    if (!isUserUuid) return;

    let query = supabase.from('bookings').select('package_price, paid_amount, status, event_date');
    if (currentStudio && isUuid) {
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

  // Cấu trúc danh mục Menu theo đúng 3 nhóm vai trò RBAC:
  // - Role manager: Hiển thị Full Menu (Dashboard, Lịch chụp, Khách hàng, Thiết bị, Nhân sự, Cài đặt)
  const menuGroups = useMemo(() => {
    // =====================================================================
    // 3. HYBRID WORKSPACE DÀNH CHO STUDIO MEMBER (Thành viên Ekip có Job ngoài)
    // Phân tách 2 khu vực rõ ràng:
    // - Khu vực 1: TÀI KHOẢN CÁ NHÂN (Bảng điều khiển cá nhân, Khách hàng của tôi)
    // - Khu vực 2: KHÔNG GIAN STUDIO (Lịch phân công từ Studio, Bảng lương & Thù lao)
    // =====================================================================
    if (isStudioMember) {
      return [
        {
          title: 'Tài Khoản Cá Nhân',
          items: [
            {
              to: '/dashboard',
              label: 'Bảng Điều Khiển Cá Nhân',
              icon: Layers,
              isActive: location.pathname === '/dashboard' && !location.search.includes('view=studio'),
            },
            {
              to: '/dashboard/clients',
              label: 'Khách Hàng Của Tôi',
              icon: Users,
              isActive: location.pathname.startsWith('/dashboard/clients'),
            },
          ],
        },
        {
          title: 'Không Gian Studio',
          items: [
            {
              to: '/dashboard?view=studio',
              label: 'Lịch Phân Công Từ Studio',
              icon: Building2,
              isActive: location.pathname === '/dashboard' && location.search.includes('view=studio'),
            },
            {
              to: '/dashboard/payroll',
              label: 'Bảng Lương & Thù Lao (My Payroll)',
              icon: DollarSign,
              isActive: location.pathname.startsWith('/dashboard/payroll'),
            },
          ],
        },
        {
          title: 'Hồ Sơ & Cài Đặt',
          items: [
            {
              to: '/dashboard/settings',
              label: 'Cài Đặt Hồ Sơ',
              icon: Settings,
              isActive: location.pathname.startsWith('/dashboard/settings'),
            },
          ],
        },
      ];
    }

    // BẢO MẬT SUPER ADMIN (STRICT RBAC ISOLATION):
    // CHỈ render menu này NẾU thỏa mãn điều kiện tuyệt đối:
    // user?.account_type === 'super_admin' HOẶC user?.email === 'johnnyho1705@gmail.com'.
    // ĐẢM BẢO isStudioAdmin hoặc account_type === 'studio_admin' KHÔNG BAO GIỜ được nhìn thấy mục menu này.
    const isSuperAdmin = Boolean(
      (user as any)?.account_type === 'super_admin' ||
      user?.user_metadata?.account_type === 'super_admin' ||
      (accountType as string) === 'super_admin' ||
      user?.email === 'johnnyho1705@gmail.com'
    );

    if (isFreelancer) {
      return [
        {
          title: 'Vận Hành Solo',
          items: [
            {
              to: '/dashboard',
              label: 'Lịch Cá Nhân',
              icon: Layers,
              isActive: location.pathname === '/dashboard',
            },
            {
              to: '/dashboard/clients',
              label: 'Khách Hàng',
              icon: Users,
              isActive: location.pathname.startsWith('/dashboard/clients'),
            },
            ...(isSuperAdmin
              ? [
                  {
                    to: '/dashboard/super-admin',
                    label: 'Quản Trị Hệ Thống (Super Admin)',
                    icon: ShieldCheck,
                    isActive: location.pathname.startsWith('/dashboard/super-admin'),
                  },
                ]
              : []),
            {
              to: '/dashboard/settings',
              label: 'Cài Đặt',
              icon: Settings,
              isActive: location.pathname.startsWith('/dashboard/settings'),
            },
          ],
        },
      ];
    }

    // Role manager (Mặc định quản trị Studio)
    return [
      {
        title: 'Vận Hành Toàn Diện',
        items: [
          {
            to: '/dashboard',
            label: 'Dashboard & Lịch Chụp',
            icon: Layers,
            isActive: location.pathname === '/dashboard',
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
            to: '/dashboard/studio-settings',
            label: 'Nhân Sự',
            icon: Building2,
            isActive: location.pathname.startsWith('/dashboard/studio-settings'),
          },
          {
            to: '/dashboard/payroll',
            label: 'Bảng Lương Ekip',
            icon: DollarSign,
            isActive: location.pathname.startsWith('/dashboard/payroll'),
          },
          {
            to: '/dashboard/packages',
            label: 'Gói Dịch Vụ',
            icon: Package,
            isActive: location.pathname.startsWith('/dashboard/packages'),
          },
          ...(isSuperAdmin
            ? [
                {
                  to: '/dashboard/super-admin',
                  label: 'Quản Trị Hệ Thống (Super Admin)',
                  icon: ShieldCheck,
                  isActive: location.pathname.startsWith('/dashboard/super-admin'),
                },
              ]
            : []),
          {
            to: '/dashboard/settings',
            label: 'Cài Đặt',
            icon: Settings,
            isActive: location.pathname.startsWith('/dashboard/settings'),
          },
        ],
      },
    ];
  }, [isStudioMember, isFreelancer, isStudioAdmin, accountType, user, location.pathname]);

  const userFullName = user?.user_metadata?.full_name || 'Thợ ảnh';
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || 'TH';

  // Lấy tiêu đề trang
  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard/super-admin')) {
      return 'Trung Tâm Quản Trị Hệ Thống (Super Admin)';
    }
    if (location.pathname === '/dashboard') {
      if (isStudioMember) return 'Bàn Làm Việc Ekip Studio';
      if (isFreelancer) return 'Không Gian Freelancer Solo';
      return 'Tổng Quan Quản Lý Studio';
    }
    if (location.pathname.startsWith('/dashboard/payroll')) {
      return isStudioMember ? 'Thu Nhập & Thù Lao Của Tôi' : 'Bảng Lương & Đối Soát Thù Lao Ekip';
    }
    if (location.pathname.startsWith('/dashboard/clients')) return 'Hồ Sơ Khách Hàng (CRM)';
    if (location.pathname.startsWith('/dashboard/gears')) return 'Quản Lý Thiết Bị Studio';
    if (location.pathname.startsWith('/dashboard/packages')) return 'Bảng Giá & Gói Dịch Vụ';
    if (location.pathname.startsWith('/dashboard/studio-settings')) return 'Quản Trị Studio';
    if (location.pathname.startsWith('/dashboard/settings')) return 'Cài Đặt Hồ Sơ';
    return 'Studio CRM';
  };

  const navigate = useNavigate();

  const handleOpenNewBooking = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard?action=new-booking');
    } else {
      window.dispatchEvent(new CustomEvent('lensy:create-booking'));
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#090a0f] font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===================================================================== */}
      {/* 1. LEFT SIDEBAR (Có thể thu gọn linh hoạt / Collapsible)             */}
      {/* ===================================================================== */}
      <aside
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 lg:static flex-shrink-0 shrink-0 h-full overflow-y-auto border-r border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isSidebarCollapsed
            ? 'w-64 lg:w-20 p-4 lg:px-3 lg:py-5'
            : 'w-64 lg:w-64 p-4 sm:p-5 lg:px-3 lg:py-5'
        } ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Top Header: Fixed Toggle Button */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10 min-h-[44px]">
            {/* Nút thu gọn / mở rộng menu - Cố định vị trí góc trên cùng bên trái, con trỏ chuột không dịch chuyển khi bấm */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex w-9 h-9 items-center justify-center flex-shrink-0 rounded-xl text-gray-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
              aria-label={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-orange-500 hover:scale-110 transition-transform" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-gray-500 hover:text-orange-600 hover:scale-110 transition-transform" />
              )}
            </button>

            {!isSidebarCollapsed && (
              <div className="hidden lg:flex items-center gap-2 pr-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 truncate select-none">
                  Vận Hành Studio
                </span>
              </div>
            )}

            {/* Nút đóng trên mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items - Cố định tọa độ X, Y tuyệt đối không nhảy giật khi mở/đóng */}
          <div className="space-y-4">
            {menuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!isSidebarCollapsed ? (
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1 select-none">
                    {group.title}
                  </div>
                ) : (
                  <div className="h-px bg-gray-100 dark:bg-zinc-800/80 my-2 mx-1" />
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
                        className={`flex items-center w-full h-10 px-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                          isActive
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20'
                            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100/80 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                            isActive
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-white'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isSidebarCollapsed && (
                          <span className="ml-3 truncate select-none">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom widgets of Sidebar: Studio Brand Profile & Online Booking */}
        <div className="pt-3 space-y-2 border-t border-gray-100 dark:border-white/10">
          {!isSidebarCollapsed ? (
            <>
              {/* Studio Brand Profile Card (Logo không viền vàng, tên & subtitle bên dưới logo) */}
              <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-3">
                  {/* Studio Logo: Hoàn toàn không có viền vàng */}
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 p-0.5 shadow-2xs flex-shrink-0 overflow-hidden">
                    <img
                      src={studioDisplayLogo}
                      alt={studioDisplayName}
                      className="h-full w-full object-contain rounded-lg"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-bold text-gray-900 dark:text-white truncate" title={studioDisplayName}>
                      {studioDisplayName}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 truncate">
                      Studio Management
                    </p>
                  </div>
                </div>

                {/* Role Identifier Badge */}
                {isStudioAdmin ? (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="truncate">Quản Lý Studio</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500 text-white font-black uppercase">
                      Admin
                    </span>
                  </div>
                ) : isStudioMember ? (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">Thành Viên Ekip</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-600 text-white font-black uppercase">
                      Ekip
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <Camera className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">Freelancer Solo</span>
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase">
                      Solo
                    </span>
                  </div>
                )}
              </div>

              {/* Public Booking Link Banner */}
              <div className="rounded-xl border border-orange-200/60 dark:border-white/10 bg-orange-50/50 dark:bg-zinc-900/60 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1.5">
                  Link Đặt Lịch Online
                </div>
                <a
                  href={`/book/${currentUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900/90 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white shadow-2xs hover:border-orange-500 transition-all"
                >
                  <span className="truncate max-w-[130px] font-mono text-[11px]">@{currentUsername}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                </a>
              </div>
            </>
          ) : (
            /* Khi đóng sidebar không cần hiển thị logo, chỉ giữ icon đặt lịch nhỏ gọn */
            <div className="flex justify-center py-1">
              <a
                href={`/book/${currentUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50/80 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 hover:scale-105 transition-transform border border-orange-200/60 dark:border-white/10 shadow-2xs"
                title={`Mở link đặt lịch online: @${currentUsername}`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN CONTENT AREA (FLUID FULL-WIDTH LAYOUT)                        */}
      {/* ===================================================================== */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-[#090a0f] p-6 lg:p-8 flex flex-col justify-between min-h-screen">
        <div className="w-full flex-1 flex flex-col">
          {/* Header: Page Title + Actions + Profile Pill */}
          <div className="flex flex-row items-center justify-between w-full gap-2 mb-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/60 backdrop-blur-xl text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate tracking-tight text-gray-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                {isStudioAdmin ? (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-600 dark:text-orange-400 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                    <span>Quản Lý Studio</span>
                  </span>
                ) : isStudioMember ? (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Thành Viên Ekip</span>
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 shrink-0">
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Freelancer Solo</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Action Buttons & Profile Card Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Chỉ hiển thị nút Tạo Lịch Mới cho Quản lý Studio hoặc Freelancer */}
            {!isStudioMember && (
              <button
                type="button"
                onClick={handleOpenNewBooking}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                title="Tạo Lịch Mới"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Tạo Lịch Mới</span>
              </button>
            )}

            {/* Trung Tâm Thông Báo (In-App Notification Hub) */}
            <NotificationDropdown />

            {/* Theme Mode Toggle (Dark/Light) */}
            <div className="hidden sm:block">
              <ThemeToggle size="sm" />
            </div>

            {/* Profile Card Pill in top right */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl p-1 sm:px-3 sm:py-1.5 shadow-2xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-xs shrink-0">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {userFullName}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
                    {isStudioAdmin
                      ? `Quản lý: ${currentStudio?.name || 'Studio'}`
                      : isStudioMember
                      ? `Ekip: ${currentStudio?.name || 'Studio Member'}`
                      : 'Freelancer Solo'}
                  </div>
                </div>
                <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-gray-400 dark:text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 left-auto top-full mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-72 rounded-2xl bg-white dark:bg-zinc-900/95 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] p-2.5 z-50 text-xs space-y-2">
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

                  {/* BỘ CHUYỂN ĐỔI ROLE NHANH: CHỈ HIỂN THỊ DUY NHẤT CHO MASTER DEVELOPER johnnyho1705@gmail.com */}
                  {switchAccountType && user?.email === 'johnnyho1705@gmail.com' && (
                    <div className="p-2 rounded-xl bg-orange-50/50 dark:bg-zinc-800/80 border border-orange-200/60 dark:border-zinc-700/60 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#df8653] dark:text-orange-400 block">
                        [Dev Only] Giả Lập Role:
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

        {/* Dynamic Nested Page Content via Outlet (Fluid Full-Width) */}
        <div className="relative w-full">
          {/* Floating Toast Notification (Access Denied / Security Feedback) */}
          {toastBanner && (
            <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
              <div
                className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3.5 ${
                  toastBanner.type === 'error'
                    ? 'bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/50'
                    : 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50'
                }`}
              >
                {toastBanner.type === 'error' ? (
                  <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 text-xs">
                  <p className="font-bold text-sm tracking-tight mb-0.5">
                    {toastBanner.type === 'error' ? 'Cảnh Báo An Ninh' : 'Thông Báo Hệ Thống'}
                  </p>
                  <p className="leading-relaxed opacity-90">{toastBanner.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setToastBanner(null)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Đóng thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <Outlet />
        </div>
        </div>

        {/* Global Dashboard Footer: Powered by Lensy */}
        <footer className="mt-12 pt-6 pb-2 border-t border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-500 select-none">
          <div className="flex items-center gap-2">
            <img src="/lensy-logo.png" alt="Lensy CRM" className="h-5 w-5 object-contain rounded-md" />
            <span className="font-semibold text-slate-700 dark:text-zinc-300">Lensy CRM</span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span>Hệ thống Quản lý Studio & Nhiếp ảnh chuyên nghiệp</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Powered by</span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">Lensy</span>
            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[10px]">
              v2.5 Pro
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};
