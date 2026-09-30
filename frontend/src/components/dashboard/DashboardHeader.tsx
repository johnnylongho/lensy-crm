import React, { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import CountUp from 'react-countup';
import {
  DollarSign,
  Camera,
  CheckCircle2,
  Wallet,
  Receipt,
  Sparkles,
  MoreHorizontal,
  Zap,
  Bell,
  Check,
  Upload,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { InstallPwaButton } from './InstallPwaButton';
import { useAuth } from '../../context/AuthContext';
import { TierBadge } from './TierBadge';
import { calculateYtdRevenue, getTierProgress } from '../../utils/tierSystem';

interface Props {
  events: CalendarEvent[];
  onOpenCreateQuote?: () => void;
  onOpenWebhookSimulator?: () => void;
  onOpenReceiptReview?: (booking: CalendarEvent) => void;
  onOpenImportCsv?: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export const DashboardHeader: React.FC<Props> = ({
  events,
  onOpenCreateQuote,
  onOpenWebhookSimulator,
  onOpenReceiptReview,
  onOpenImportCsv,
}) => {
  const { user } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bookedEvents = events.filter(
    e => e.status === 'da_chot' || e.status === 'da_tra_file' || e.status === 'hoan_thanh'
  );
  const pendingEvents = events.filter(e => e.status === 'cho_coc');
  const pendingReceipts = events.filter(e => e.status === 'cho_xac_nhan_coc');

  // Logic Tài chính
  const totalRevenue = events.reduce((sum, e) => sum + (Number(e.packagePrice) || 0), 0);
  const totalDepositCollected = events.reduce((sum, e) => sum + (Number(e.depositAmount) || 0), 0);
  const totalGrossCollected = events.reduce(
    (sum, e) => sum + (Number(e.paidAmount) || Number(e.depositAmount) || 0),
    0
  );
  const totalExpenses = events.reduce((sum, e) => sum + (Number(e.expenses) || 0), 0);
  const totalNetProfit = totalGrossCollected - totalExpenses;
  const netMargin = totalGrossCollected > 0 ? Math.round((totalNetProfit / totalGrossCollected) * 100) : 0;

  // Logic Cấp bậc Studio
  const currentYear = new Date().getFullYear();
  const ytdRevenue = calculateYtdRevenue(events, currentYear);
  const { currentTier } = getTierProgress(ytdRevenue, currentYear);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* ==================================================================== */}
      {/* THẺ STUDIO: Minimalist Glassmorphism (Ẩn bớt badge vụn vặt, CTA duy nhất) */}
      {/* ==================================================================== */}
      <motion.div
        variants={cardVariants}
        className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300"
      >
        {/* Studio Info: Logo + Tên Studio + Cấp bậc */}
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 bg-black shadow-lg flex-shrink-0">
            <img
              src="/mirmia-logo.png"
              alt="Mirmia Studio & Academy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                MIRMIA STUDIO & ACADEMY
              </h2>
              {/* Biểu tượng Huy chương Cấp bậc */}
              <TierBadge tier={currentTier} size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
              {user ? (
                <span>Tài khoản: <strong className="text-slate-700 dark:text-zinc-200 font-mono">{user.email}</strong></span>
              ) : (
                'Hệ thống quản lý lịch trình & nhận show nhiếp ảnh chuyên nghiệp'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: Duy nhất 1 CTA "Tạo Báo Giá Mới" + Icon ... (More Options) */}
        <div className="flex items-center gap-3">
          {/* CTA Duy Nhất: Nút Tạo Báo Giá với gradient mượt mà & glow viền */}
          {onOpenCreateQuote && (
            <button
              type="button"
              onClick={onOpenCreateQuote}
              className="relative overflow-hidden px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/50 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              {/* Subtle shimmer sweep overlay */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 pointer-events-none animate-shimmer-sweep" />
              <Camera className="w-4 h-4 relative z-10" />
              <span className="relative z-10">+ Tạo Báo Giá Mới</span>
            </button>
          )}

          {/* Nút "Import CSV" (kèm icon Tải lên) đặt cạnh nút "Tạo Báo Giá Mới" trên thanh hành động */}
          {onOpenImportCsv && (
            <button
              type="button"
              onClick={onOpenImportCsv}
              className="px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/15 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Nhập danh sách lịch chụp từ file CSV/Excel"
            >
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Import CSV</span>
            </button>
          )}

          {/* More Options Dropdown: Gom các nút Test Cọc, Cài đặt PWA, Duyệt bill */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(prev => !prev)}
              className="p-2.5 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              title="Tùy chọn mở rộng"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 animate-scaleUp text-xs space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Công Cụ Nhanh
                </div>

                {/* Import CSV trong Menu */}
                {onOpenImportCsv && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenImportCsv();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors cursor-pointer text-left"
                  >
                    <Upload className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>📥 Nhập Lịch Chụp (CSV)</span>
                  </button>
                )}

                {/* Test Cọc (SePAY) */}
                {onOpenWebhookSimulator && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenWebhookSimulator();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition-colors cursor-pointer text-left"
                  >
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>⚡ Giả lập Cọc (SePAY)</span>
                  </button>
                )}

                {/* Duyệt biên lai nếu có */}
                {pendingReceipts.length > 0 && onOpenReceiptReview && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenReceiptReview(pendingReceipts[0]);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-medium transition-colors cursor-pointer text-left"
                  >
                    <Bell className="w-4 h-4 flex-shrink-0" />
                    <span>Duyệt {pendingReceipts.length} Biên Lai Cọc</span>
                  </button>
                )}

                {/* Cài đặt App PWA */}
                <div className="px-1 py-1" onClick={() => setIsMoreMenuOpen(false)}>
                  <InstallPwaButton />
                </div>

                {/* Thống kê nhanh: Đã thu cọc */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] flex items-center justify-between font-mono">
                  <span className="text-slate-500 dark:text-zinc-400 font-sans">Đã thu cọc:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {totalDepositCollected.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ==================================================================== */}
      {/* 4 THẺ TỔNG QUAN TÀI CHÍNH: Font-light thanh mảnh, kích thước lớn, tương phản cao */}
      {/* ==================================================================== */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
      >
        {/* Card 1: Số Lượng Show */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-white/50">Show Đã Chốt</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-white/90 font-mono tracking-tight">
            <CountUp start={0} end={bookedEvents.length} duration={1.2} />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 flex items-center justify-between pt-1">
            <span>+{pendingEvents.length} đang chờ cọc</span>
            <span className="text-amber-500 font-medium font-mono">
              {Math.round((bookedEvents.length / (events.length || 1)) * 100)}% chốt
            </span>
          </div>
        </motion.div>

        {/* Card 2: Tổng Doanh Thu (Gross) */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-white/50">Tổng Doanh Thu (Gross)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white/90 font-mono tracking-tight">
            <CountUp start={0} end={totalGrossCollected} duration={1.5} separator="." suffix=" đ" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 truncate pt-1">
            Hợp đồng: {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
        </motion.div>

        {/* Card 3: Tổng Chi Phí (Job Expenses) */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-white/50">Tổng Chi Phí (Expenses)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-rose-500 dark:text-rose-400 font-mono tracking-tight">
            -<CountUp start={0} end={totalExpenses} duration={1.5} separator="." suffix=" đ" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 pt-1">
            Studio, makeup, thiết bị...
          </div>
        </motion.div>

        {/* Card 4: LỢI NHUẬN RÒNG (Net Profit) - Hero Highlight Card */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/70 to-emerald-500/5 dark:from-emerald-950/30 dark:via-white/5 dark:to-transparent backdrop-blur-xl backdrop-blur-2xl border border-emerald-400/40 dark:border-emerald-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>Lợi Nhuận Ròng (Net)</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-emerald-600 dark:text-emerald-300 font-mono tracking-tight">
            <CountUp start={0} end={totalNetProfit} duration={1.5} separator="." suffix=" đ" />
          </div>
          <div className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80 font-medium flex items-center justify-between pt-1">
            <span>Tiền thật bỏ túi</span>
            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/20">
              Lãi: {netMargin}%
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHeader;
