import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Camera, Settings, ExternalLink, LogOut, Users } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [currentUsername, setCurrentUsername] = useState<string>('johnnylongho');

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
  }, [user]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Thanh Menu Quản Trị Studio / Dashboard Header (Chỉ hiển thị cho Thợ Ảnh/Admin) */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-red-500/30 bg-black shadow-md flex-shrink-0 group-hover:border-amber-400 transition-colors">
                <img
                  src="/mirmia-logo.png"
                  alt="Mirmia Studio & Academy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white tracking-tight">
                    Lensy
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    by Mirmia Studio
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/30">
                    MIRMIA
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Tabs Quản Trị */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                location.pathname === '/dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch Chụp</span>
            </Link>

            <Link
              to="/dashboard/clients"
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                location.pathname.startsWith('/dashboard/clients')
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Khách Hàng</span>
            </Link>

            <Link
              to="/dashboard/gears"
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                location.pathname.startsWith('/dashboard/gears')
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Thiết Bị</span>
            </Link>

            <Link
              to="/dashboard/settings"
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl font-bold transition-all ${
                location.pathname.startsWith('/dashboard/settings')
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài Đặt</span>
            </Link>

            {/* Nút Xem Trang Đặt Lịch Public Của Thợ Ảnh (Mở Tab Mới) */}
            <a
              href={`/book/${currentUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-amber-400 font-medium transition-colors"
              title="Xem trang đặt lịch của bạn như khách hàng nhìn thấy"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Link Đặt Lịch (@{currentUsername})</span>
            </a>
          </div>

          {/* Right User Status & Đăng xuất */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col text-right text-[11px]">
              <span className="text-white font-bold truncate max-w-[140px]">
                {user?.user_metadata?.full_name || 'Thợ ảnh'}
              </span>
              <span className="text-slate-400 text-[10px] truncate max-w-[140px] font-mono">
                {user?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Đăng xuất khỏi Lensy"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
