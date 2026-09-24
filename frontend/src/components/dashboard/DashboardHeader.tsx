import React from 'react';
import { motion, type Variants } from 'framer-motion';
import CountUp from 'react-countup';
import {
  DollarSign,
  Camera,
  CheckCircle2,
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
}) => {
  const { user } = useAuth();
  const bookedEvents = events.filter(e => e.status === 'da_chot' || e.status === 'da_tra_file' || e.status === 'hoan_thanh');
  const pendingEvents = events.filter(e => e.status === 'cho_coc');
  const pendingReceipts = events.filter(e => e.status === 'cho_xac_nhan_coc');

  // Logic Tài chính tách rõ Gross và Net Profit
  const totalRevenue = events.reduce((sum, e) => sum + (Number(e.packagePrice) || 0), 0); // Tổng giá trị hợp đồng
  const totalDepositCollected = events.reduce((sum, e) => sum + (Number(e.depositAmount) || 0), 0); // Đã thu cọc
  const totalGrossCollected = events.reduce((sum, e) => sum + (Number(e.paidAmount) || Number(e.depositAmount) || 0), 0); // Tổng Doanh Thu Đã Thu (Gross)
  const totalExpenses = events.reduce((sum, e) => sum + (Number(e.expenses) || 0), 0); // Tổng Chi Phí Show
  const totalNetProfit = totalGrossCollected - totalExpenses; // LỢI NHUẬN RÒNG THỰC TẾ
  const netMargin = totalGrossCollected > 0 ? Math.round((totalNetProfit / totalGrossCollected) * 100) : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Title & Studio Profile Liquid Glass Bar */}
      <motion.div
        variants={cardVariants}
        className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 bg-black shadow-md flex-shrink-0">
            <img
              src="/mirmia-logo.png"
              alt="Mirmia Studio & Academy"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white/95 tracking-tight">
                MIRMIA STUDIO & ACADEMY
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-300 rounded-full">
                Lensy CRM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/50">
              {user ? (
                <span>Tài khoản: <strong className="text-slate-700 dark:text-white/80 font-mono">{user.email}</strong></span>
              ) : (
                'Hệ thống quản lý lịch trình & nhận show nhiếp ảnh chuyên nghiệp'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: Ghost Buttons & Shimmer Accent Primary Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {pendingReceipts.length > 0 && onOpenReceiptReview && (
            <button
              type="button"
              onClick={() => onOpenReceiptReview(pendingReceipts[0])}
              className="px-3.5 py-2 rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-sm"
              title="Có khách hàng vừa gửi ảnh biên lai cọc cần duyệt"
            >
              <span>🔔 {pendingReceipts.length} Biên Lai Cần Duyệt</span>
            </button>
          )}

          {onOpenWebhookSimulator && (
            <button
              type="button"
              onClick={onOpenWebhookSimulator}
              className="px-3.5 py-2 rounded-2xl bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-amber-600 dark:text-amber-400 text-xs font-medium backdrop-blur-md transition-all active:scale-95 shadow-sm ghost-btn"
              title="Mô phỏng nhận tiền cọc qua SePAY/VietQR để test tự động hóa"
            >
              <span>⚡ Test Cọc (SePAY)</span>
            </button>
          )}

          {/* Nút Tạo Báo Giá: Accent Button với hiệu ứng Shimmer Sweep lướt tuần hoàn */}
          {onOpenCreateQuote && (
            <button
              type="button"
              onClick={onOpenCreateQuote}
              className="relative overflow-hidden px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/90 via-amber-400 to-yellow-500/90 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all group"
            >
              {/* Shimmer sweep light overlay */}
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-75 pointer-events-none animate-shimmer-sweep" />
              <Camera className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">+ Tạo Báo Giá Mới</span>
            </button>
          )}

          <InstallPwaButton />

          {/* Pill Đã Thu Cọc (Ghost Style) */}
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-xs backdrop-blur-md ghost-btn">
            <span className="text-slate-500 dark:text-white/50 block text-[10px]">Đã Thu Cọc</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              <CountUp start={0} end={totalDepositCollected} duration={1.5} separator="." suffix=" đ" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* 4 Thẻ Tổng Quan (Summary Cards) - Entrance Animations & Number Ticker */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
      >
        {/* Card 1: Số Lượng Show */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2.5"
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
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
              {Math.round((bookedEvents.length / (events.length || 1)) * 100)}% chốt
            </span>
          </div>
        </motion.div>

        {/* Card 2: Tổng Doanh Thu (Gross) */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-white/50">Tổng Doanh Thu (Gross)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-light text-sky-600 dark:text-sky-300 font-mono tracking-tight">
            <CountUp start={0} end={totalGrossCollected} duration={1.5} separator="." suffix=" đ" />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 truncate pt-1">
            Tổng hợp đồng: {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
        </motion.div>

        {/* Card 3: Tổng Chi Phí (Job Expenses) */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2.5"
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
            Makeup, studio, trợ lý...
          </div>
        </motion.div>

        {/* Card 4: LỢI NHUẬN RÒNG (Net Profit) - Hero Highlight Card (Tiền thật bỏ túi) */}
        <motion.div
          variants={cardVariants}
          className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white/60 to-emerald-500/5 dark:from-emerald-950/40 dark:via-white/5 dark:to-transparent backdrop-blur-xl border border-emerald-400/40 dark:border-emerald-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2.5 relative overflow-hidden"
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
          <div className="text-2xl sm:text-3xl font-light text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
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
