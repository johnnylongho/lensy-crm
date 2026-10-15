import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  Calendar,
  Users,
  SlidersHorizontal,
  Building2,
  Settings,
  DollarSign,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Camera,
  Crown,
  Sparkles,
} from 'lucide-react';

/**
 * Component Sidebar.jsx - Hệ thống điều hướng phân quyền (RBAC Navigation)
 * Render danh mục menu tương ứng theo 3 vai trò:
 * - manager: Full Menu (Dashboard, Lịch chụp, Khách hàng, Thiết bị, Nhân sự, Cài đặt)
 * - freelancer: Lịch cá nhân, Khách hàng, Thiết bị (cá nhân), Cài đặt (Ẩn Nhân sự, Studio Bays)
 * - member: Tối giản: Lịch của tôi (My Schedule), Thu nhập (My Payroll), Hồ sơ cá nhân
 */
export const Sidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { role, currentStudio, isManager, isMember, isFreelancer } = useWorkspace();
  const { user } = useAuth();

  // Xác định vai trò hiện tại (chuẩn hóa về: manager | freelancer | member)
  const currentRole = role || (isManager ? 'manager' : isMember ? 'member' : 'freelancer');

  // Hàm sinh danh mục menu sử dụng Switch Case theo `currentRole` (hoặc `user.role`)
  const getMenuItemsByRole = (userRole) => {
    switch (userRole) {
      case 'manager':
        // Role manager: Hiển thị Full Menu (Dashboard, Lịch chụp, Khách hàng, Thiết bị, Nhân sự, Cài đặt)
        return [
          {
            to: '/dashboard',
            label: 'Dashboard',
            icon: Layers,
            badge: 'Admin',
            isActive: location.pathname === '/dashboard',
          },
          {
            to: '/dashboard',
            label: 'Lịch Chụp',
            icon: Calendar,
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
            badge: 'Studio',
            isActive: location.pathname.startsWith('/dashboard/studio-settings'),
          },
          {
            to: '/dashboard/settings',
            label: 'Cài Đặt',
            icon: Settings,
            isActive: location.pathname.startsWith('/dashboard/settings'),
          },
        ];

      case 'freelancer':
        // Role freelancer: Ẩn menu Nhân sự, Ẩn menu Studio Bays.
        // Chỉ hiện: Lịch cá nhân, Khách hàng, Thiết bị (cá nhân), Cài đặt.
        return [
          {
            to: '/dashboard',
            label: 'Lịch Cá Nhân',
            icon: Calendar,
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
            label: 'Thiết Bị (Cá Nhân)',
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

      case 'member':
        // Role member: Sidebar tối giản nhất.
        // Chỉ hiện: "Lịch của tôi (My Schedule)", "Thu nhập (My Payroll)", "Hồ sơ cá nhân".
        return [
          {
            to: '/dashboard',
            label: 'Lịch Của Tôi (My Schedule)',
            icon: Calendar,
            badge: 'Hôm nay',
            isActive: location.pathname === '/dashboard',
          },
          {
            to: '/dashboard/settings',
            label: 'Thu Nhập (My Payroll)',
            icon: DollarSign,
            isActive: false,
          },
          {
            to: '/dashboard/settings',
            label: 'Hồ Sơ Cá Nhân',
            icon: User,
            isActive: location.pathname.startsWith('/dashboard/settings'),
          },
        ];

      default:
        return [
          {
            to: '/dashboard',
            label: 'Dashboard',
            icon: Layers,
            isActive: location.pathname === '/dashboard',
          },
          {
            to: '/dashboard/settings',
            label: 'Cài Đặt',
            icon: Settings,
            isActive: location.pathname.startsWith('/dashboard/settings'),
          },
        ];
    }
  };

  const menuItems = getMenuItemsByRole(currentRole);

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Brand & Workspace Title */}
      <div>
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-gray-100 dark:border-zinc-800">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-[#df8653] to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all flex-shrink-0">
              L
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight truncate">
                  {currentStudio?.name || 'Lensy Studio'}
                </div>
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1">
                  {currentRole === 'manager' ? (
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-0.5">
                      <Crown className="w-3 h-3" /> Quản Lý Studio
                    </span>
                  ) : currentRole === 'member' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <Camera className="w-3 h-3" /> Ekip Studio
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" /> Freelancer
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Menu Items List */}
        <nav className="space-y-1.5">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.to}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  item.isActive
                    ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Role Badge */}
      {!isCollapsed && (
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-gray-400 dark:text-zinc-500 flex items-center justify-between">
          <span>Vai trò: <strong className="text-gray-700 dark:text-zinc-300 capitalize">{currentRole}</strong></span>
          <span className="font-mono text-[9px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">RBAC v2</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
