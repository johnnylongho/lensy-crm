import React from 'react';
import { Calendar, DollarSign, Camera, CheckCircle2, TrendingUp, LogOut, User } from 'lucide-react';
import { CalendarEvent } from '../../types';
import { InstallPwaButton } from './InstallPwaButton';
import { useAuth } from '../../context/AuthContext';

interface Props {
  events: CalendarEvent[];
}

export const DashboardHeader: React.FC<Props> = ({ events }) => {
  const { user, signOut } = useAuth();
  const bookedEvents = events.filter(e => e.status === 'da_chot' || e.status === 'da_tra_file' || e.status === 'hoan_thanh');
  const pendingEvents = events.filter(e => e.status === 'cho_coc');
  const totalRevenue = events.reduce((sum, e) => sum + e.packagePrice, 0);
  const totalDepositCollected = events.reduce((sum, e) => sum + e.depositAmount, 0);

  return (
    <div className="space-y-4">
      {/* Title & Profile Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-red-500/30 bg-black shadow-lg shadow-red-950/40 flex-shrink-0">
            <img
              src="/mirmia-logo.png"
              alt="Mirmia Studio & Academy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">MIRMIA STUDIO & ACADEMY</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-950/60 border border-red-500/30 text-red-300 rounded-full">
                Lensy CRM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {user ? (
                <span>Tài khoản: <strong className="text-amber-400 font-mono">{user.email}</strong></span>
              ) : (
                'Hệ thống trợ lý số quản lý lịch trình & nhận show cho Mirmia'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <InstallPwaButton />
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px]">Đã Thu Cọc</span>
            <span className="font-mono font-bold text-emerald-400">
              {totalDepositCollected.toLocaleString('vi-VN')} đ
            </span>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Đăng xuất khỏi Lensy"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Show Đã Chốt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{bookedEvents.length}</div>
          <div className="text-[11px] text-emerald-400 font-medium">Đã nhận cọc & khóa lịch</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Đang Chờ Cọc</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingEvents.length}</div>
          <div className="text-[11px] text-slate-500">Đã gửi link báo giá</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Dự Kiến Doanh Thu</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-amber-300 font-mono">
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-500">Tổng giá trị hợp đồng</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tỷ Lệ Chốt Show</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 font-mono">
            {Math.round((bookedEvents.length / (events.length || 1)) * 100)}%
          </div>
          <div className="text-[11px] text-indigo-400">Hiệu suất cao</div>
        </div>
      </div>
    </div>
  );
};
