import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CalendarEvent, GearItem } from '../../types';
import {
  TrendingUp,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Camera,
} from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  className?: string;
}

export const RoiProgressBar: React.FC<Props> = ({ events, className = '' }) => {
  const { user } = useAuth();
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const hasCelebratedRoi = useRef(false);

  // 1. Fetch toàn bộ thiết bị của studio để tính "Tổng Đầu Tư"
  const fetchStudioGears = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('gears')
          .select('id, name, type, status, purchase_price');

        if (user) {
          query = query.eq('photographer_id', user.id);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[ROI] Lỗi truy vấn bảng gears:', error.message);
        } else if (data && data.length > 0) {
          setGears(data);
          return;
        }
      }

      // Fallback mock gears với giá mua thực tế để trải nghiệm trực quan ngay cả khi chưa kết nối
      setGears([
        { id: 'g1', name: 'Body Sony Alpha 7 IV #1', type: 'camera', status: 'active', purchase_price: 48000000 },
        { id: 'g2', name: 'Lens Sony FE 24-70mm F2.8 GM II', type: 'lens', status: 'active', purchase_price: 49000000 },
        { id: 'g3', name: 'Đèn Flash Godox V1 Sony', type: 'lighting', status: 'active', purchase_price: 6500000 },
        { id: 'g4', name: 'Đèn Godox AD200 Pro', type: 'lighting', status: 'active', purchase_price: 8500000 },
      ]);
    } catch (err) {
      console.error('[ROI] Lỗi fetch thiết bị:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioGears();

    // Lắng nghe thay đổi bảng gears theo Realtime nếu Supabase có cấu hình
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('realtime:gears_roi')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gears' },
          () => {
            fetchStudioGears();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // 2. Logic tính toán ROI chuẩn SaaS (Dựa trên Lợi Nhuận Ròng thực tế):
  // - Tổng Đầu Tư: Toàn bộ giá mua các thiết bị trong kho
  const totalInvestment = gears.reduce((sum, g) => sum + (Number(g.purchase_price) || 0), 0);

  // - Tổng Doanh Thu Đã Thu (Gross Collected): Toàn bộ số tiền ĐÃ THU từ các Booking
  const totalCollected = events.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);

  // - Tổng Chi Phí Show (Expenses): Toàn bộ các khoản chi phí phát sinh
  const totalExpenses = events.reduce((sum, e) => sum + (Number(e.expenses) || 0), 0);

  // - Tổng LỢI NHUẬN RÒNG (Net Profit) = Tổng Doanh Thu Đã Thu - Tổng Chi Phí
  const totalNetProfit = totalCollected - totalExpenses;

  // - Công thức MỚI ĐỀ BÀI: % Hoàn vốn = (Tổng LỢI NHUẬN RÒNG / Tổng Đầu Tư) * 100
  // Xử lý trường hợp Tổng Đầu Tư = 0 để tránh lỗi chia cho 0
  const roiPercentage = totalInvestment > 0 ? (totalNetProfit / totalInvestment) * 100 : 0;
  const roundedPercent = Math.round(roiPercentage * 10) / 10; // 1 chữ số thập phân

  // Hiệu ứng Animation mượt mà khi load số: tăng từ 0% lên % mục tiêu (chặn dưới 0% cho thanh bar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(Math.min(100, Math.max(0, roiPercentage)));
    }, 150);
    return () => clearTimeout(timer);
  }, [roiPercentage]);

  // Hiệu ứng Cảm xúc - Ăn mừng (Gamification Scenario 2):
  // Bắn pháo hoa giấy toàn màn hình khi Tiến độ Hoàn vốn (ROI) chạm hoặc vượt mốc 100%
  useEffect(() => {
    if (roiPercentage >= 100 && !hasCelebratedRoi.current && !isLoading) {
      hasCelebratedRoi.current = true;
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10b981', '#fbbf24', '#38bdf8'],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#10b981', '#fbbf24', '#38bdf8'],
          });
        }, 280);
      } catch (err) {
        console.warn('Confetti trigger error:', err);
      }
    }
  }, [roiPercentage, isLoading]);

  // 3. Hệ thống phân tầng màu thông minh:
  // - Dưới 50%: Màu Cam (Thu hồi giai đoạn đầu)
  // - 50% đến 99%: Màu Xanh dương (Sắp hoàn vốn)
  // - Từ 100% trở lên: Màu Xanh lá cây (Đã hoàn vốn - Bắt đầu sinh lời ròng)
  const isOver100 = roiPercentage >= 100;
  const isOver50 = roiPercentage >= 50 && roiPercentage < 100;

  const colorConfig = isOver100
    ? {
        label: 'ĐÃ HOÀN VỐN 100% • BẮT ĐẦU SINH LỜI RÒNG',
        tagBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-emerald-900/30',
        barGradient: 'from-emerald-500 via-teal-400 to-green-400',
        textColor: 'text-emerald-400',
        glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.45)]',
        badgeIcon: <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />,
        subtext: `Lợi nhuận ròng vượt vốn thiết bị: +${(totalNetProfit - totalInvestment).toLocaleString('vi-VN')} đ`,
      }
    : isOver50
    ? {
        label: 'TIẾN ĐỘ TỐT • LỢI NHUẬN RÒNG ĐÃ VƯỢT 50% VỐN',
        tagBg: 'bg-sky-950/80 border-sky-500/40 text-sky-300 shadow-sky-900/30',
        barGradient: 'from-sky-500 via-blue-500 to-indigo-500',
        textColor: 'text-sky-400',
        glowColor: 'shadow-[0_0_15px_rgba(14,165,233,0.35)]',
        badgeIcon: <TrendingUp className="w-3.5 h-3.5 text-sky-400" />,
        subtext: `Còn thiếu ${(totalInvestment - totalNetProfit).toLocaleString('vi-VN')} đ lợi nhuận ròng để cán mốc hòa vốn`,
      }
    : {
        label: 'GIAI ĐOẠN ĐẦU • ĐANG THU HỒI VỐN BẰNG LÃI RÒNG',
        tagBg: 'bg-amber-950/80 border-amber-500/40 text-amber-300 shadow-amber-900/30',
        barGradient: 'from-amber-500 via-orange-500 to-yellow-500',
        textColor: 'text-amber-400',
        glowColor: 'shadow-[0_0_15px_rgba(245,158,11,0.35)]',
        badgeIcon: <Coins className="w-3.5 h-3.5 text-amber-400" />,
        subtext: `Còn thiếu ${(totalInvestment - totalNetProfit).toLocaleString('vi-VN')} đ lợi nhuận ròng để cán mốc hòa vốn`,
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
      className={`relative overflow-hidden rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 sm:p-7 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000 ${
          isOver100 ? 'bg-emerald-500' : isOver50 ? 'bg-sky-500' : 'bg-amber-500'
        }`}
      />

      <div className="relative space-y-5">
        {/* Top Header: Badge, Title & Link to Gears */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md transition-colors ${
                isOver100
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isOver50
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white/95 tracking-tight flex items-center gap-1.5">
                  Tiến Độ Hoàn Vốn Đầu Tư (ROI - Net Profit Based)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-sm inline-flex items-center gap-1 tracking-wide ${colorConfig.tagBg}`}
                >
                  {colorConfig.badgeIcon}
                  <span>{colorConfig.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50">
                % Hoàn vốn = (Tổng Lợi Nhuận Ròng / Tổng Đầu Tư) × 100
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/gears"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-white/80 hover:text-slate-950 dark:hover:text-white text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            <span>Quản Lý Kho ({gears.length} Thiết Bị)</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* Text trực quan: Tách rõ Doanh thu Gross, Chi phí và Lợi nhuận ròng thu hồi vốn */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-medium text-slate-700 dark:text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-white/50">Vốn thiết bị:</span>
              <strong className="text-slate-900 dark:text-white font-mono font-bold text-sm">
                {totalInvestment.toLocaleString('vi-VN')} đ
              </strong>
            </div>

            <span className="text-slate-400 dark:text-white/30 font-bold hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-white/50">Doanh thu đã thu:</span>
              <strong className="text-sky-600 dark:text-sky-300 font-mono font-semibold text-xs sm:text-sm">
                {totalCollected.toLocaleString('vi-VN')} đ
              </strong>
            </div>

            <span className="text-slate-400 dark:text-white/30 font-bold hidden sm:inline">-</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-white/50">Chi phí:</span>
              <strong className="text-rose-500 dark:text-rose-400 font-mono font-semibold text-xs sm:text-sm">
                {totalExpenses.toLocaleString('vi-VN')} đ
              </strong>
            </div>

            <span className="text-slate-400 dark:text-white/30 font-bold hidden sm:inline">=</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 dark:text-white/80 font-bold">Lợi Nhuận Ròng:</span>
              <strong className={`font-mono font-black text-sm sm:text-base ${colorConfig.textColor}`}>
                {totalNetProfit.toLocaleString('vi-VN')} đ
              </strong>
            </div>

            <span className={`font-mono font-black text-sm sm:text-base px-2.5 py-0.5 rounded-xl border ml-1 ${colorConfig.tagBg}`}>
              (<CountUp start={0} end={roundedPercent} decimals={1} duration={1.5} suffix="%" />)
            </span>
          </div>

          <div className="text-[11px] font-medium text-slate-500 dark:text-white/50">
            {colorConfig.subtext}
          </div>
        </div>

        {/* Progress Bar Container với Animation mượt mà và chuyển màu thông minh */}
        <div className="space-y-1.5">
          <div className="relative w-full h-4 sm:h-5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden shadow-inner">
            {/* Thanh tiến độ chính */}
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colorConfig.barGradient} ${colorConfig.glowColor} transition-all duration-1000 ease-out relative`}
              style={{ width: `${Math.min(100, Math.max(totalInvestment > 0 ? 3 : 0, animatedPercent))}%` }}
            >
              {/* Hiệu ứng sọc ánh sáng lướt qua (Shimmer Effect) */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

              {/* Con trỏ định vị tỷ lệ phần trăm */}
              {animatedPercent >= 12 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-black font-mono text-slate-950 px-1.5 py-0.2 rounded-full bg-white/90 shadow-sm leading-none">
                  {roundedPercent}%
                </div>
              )}
            </div>
          </div>

          {/* Mốc chỉ số trực quan 0% -> 50% -> 100% */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 font-bold">
            <span className="hover:text-slate-300 transition-colors">0% (Đầu tư)</span>
            <span className="text-amber-500/80 hover:text-amber-400 transition-colors">50% (Hoàn một nửa)</span>
            <span className="text-sky-400/80 hover:text-sky-300 transition-colors">75%</span>
            <span className="text-emerald-400 hover:text-emerald-300 transition-colors">
              100% (Hòa vốn & Lãi ròng)
            </span>
          </div>
        </div>

        {/* Cảnh báo thân thiện nếu Studio chưa khai báo giá thiết bị */}
        {totalInvestment === 0 && !isLoading && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>Chưa có giá mua thiết bị nào trong kho. Hãy nhập giá mua để xem tiến độ hoàn vốn!</span>
            </div>
            <Link
              to="/dashboard/gears"
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] whitespace-nowrap transition-colors"
            >
              Nhập giá ngay
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};
