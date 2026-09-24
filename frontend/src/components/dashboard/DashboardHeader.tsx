import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Camera,
  CheckCircle2,
  TrendingUp,
  LogOut,
  User,
  Settings,
  Wallet,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { InstallPwaButton } from './InstallPwaButton';
import { useAuth } from '../../context/AuthContext';

interface Props {
  events: CalendarEvent[];
  onOpenCreateQuote?: () => void;
  onOpenWebhookSimulator?: () => void;
  onOpenReceiptReview?: (booking: CalendarEvent) => void;
}

export const DashboardHeader: React.FC<Props> = ({
  events,
  onOpenCreateQuote,
  onOpenWebhookSimulator,
  onOpenReceiptReview,
}) => {
  const { user, signOut } = useAuth();
  const bookedEvents = events.filter(e => e.status === 'da_chot' || e.status === 'da_tra_file' || e.status === 'hoan_thanh');
  const pendingEvents = events.filter(e => e.status === 'cho_coc');
  const pendingReceipts = events.filter(e => e.status === 'cho_xac_nhan_coc');

  // Logic Tài chính mới tách rõ Gross và Net Profit
  const totalRevenue = events.reduce((sum, e) => sum + (Number(e.packagePrice) || 0), 0); // Tổng giá trị hợp đồng
  const totalDepositCollected = events.reduce((sum, e) => sum + (Number(e.depositAmount) || 0), 0); // Đã thu cọc
  const totalGrossCollected = events.reduce((sum, e) => sum + (Number(e.paidAmount) || Number(e.depositAmount) || 0), 0); // Tổng Doanh Thu Đã Thu (Gross)
  const totalExpenses = events.reduce((sum, e) => sum + (Number(e.expenses) || 0), 0); // Tổng Chi Phí Show
  const totalNetProfit = totalGrossCollected - totalExpenses; // LỢI NHUẬN RÒNG THỰC TẾ
  const netMargin = totalGrossCollected > 0 ? Math.round((totalNetProfit / totalGrossCollected) * 100) : 0;

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
          {pendingReceipts.length > 0 && onOpenReceiptReview && (
            <button
              type="button"
              onClick={() => onOpenReceiptReview(pendingReceipts[0])}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-orange-950/60 animate-pulse hover:scale-[1.02]"
              title="Có khách hàng vừa gửi ảnh biên lai cọc cần duyệt"
            >
              <span>🔔 {pendingReceipts.length} Biên Lai Cần Duyệt</span>
            </button>
          )}
          {onOpenWebhookSimulator && (
            <button
              type="button"
              onClick={onOpenWebhookSimulator}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Mô phỏng nhận tiền cọc qua SePAY/VietQR để test tự động hóa"
            >
              <span>⚡ Test Cọc (SePAY)</span>
            </button>
          )}

          {onOpenCreateQuote && (
            <button
              type="button"
              onClick={onOpenCreateQuote}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02]"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>+ Tạo Báo Giá Mới</span>
            </button>
          )}

          <Link
            to="/dashboard/gears"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-500/50 text-slate-200 hover:text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Quản lý kho thiết bị Camera, Lens, Đèn"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Kho Thiết Bị</span>
          </Link>

          <Link
            to="/dashboard/settings"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Cài đặt thông tin Studio, Username và Số tài khoản ngân hàng"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Cài Đặt</span>
          </Link>

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

      {/* 4 Thẻ Tổng Quan (Summary Cards) - Tách Rõ Gross & Net Profit Theo Yêu Cầu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Số Lượng Show */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Show Đã Chốt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{bookedEvents.length}</div>
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>+{pendingEvents.length} đang chờ cọc</span>
            <span className="text-indigo-400 font-bold">{Math.round((bookedEvents.length / (events.length || 1)) * 100)}% chốt</span>
          </div>
        </div>

        {/* Card 2: Tổng Doanh Thu (Gross) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tổng Doanh Thu (Gross)</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-sky-300 font-mono">
            {totalGrossCollected.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Tổng hợp đồng: {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
        </div>

        {/* Card 3: Tổng Chi Phí (Job Expenses) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tổng Chi Phí (Expenses)</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono">
            -{totalExpenses.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-slate-400">Makeup, studio, trợ lý...</div>
        </div>

        {/* Card 4: LỢI NHUẬN RÒNG (Net Profit) - Hero Highlight Card (Tiền thật bỏ túi) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900/90 to-slate-900/90 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <span>Lợi Nhuận Ròng (Net)</span>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {totalNetProfit.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-300/80 font-semibold flex items-center justify-between">
            <span>Tiền thật bỏ túi</span>
            <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-300">
              Lãi: {netMargin}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
