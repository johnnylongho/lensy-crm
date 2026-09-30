import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import { CalendarEvent, GearItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  calculateYtdRevenue,
  getTierProgress,
  TierProgress,
} from '../../utils/tierSystem';
import { TierBadge } from './TierBadge';
import { TierCelebrationModal } from './TierCelebrationModal';
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Gem,
  Camera,
  ChevronRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  className?: string;
  defaultCollapsed?: boolean;
}

export const GrowthProgressBar: React.FC<Props> = ({ events, className = '', defaultCollapsed = false }) => {
  const { user } = useAuth();
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [viewTab, setViewTab] = useState<'tier' | 'roi'>('tier');
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // 1. Tính toán Doanh thu Năm Hiện Tại (YTD Revenue) & Tiến trình Cấp bậc
  const currentYear = new Date().getFullYear();
  const ytdRevenue = calculateYtdRevenue(events, currentYear);
  const tierProgress: TierProgress = getTierProgress(ytdRevenue, currentYear);
  const { currentTier, nextTier, nextMilestone, progressPercent, remainingAmount, gamificationHook } = tierProgress;

  // 2. Fetch danh sách thiết bị cho tab ROI
  useEffect(() => {
    const fetchStudioGears = async () => {
      try {
        if (isSupabaseConfigured) {
          let query = supabase.from('gears').select('id, name, type, status, purchase_price');
          if (user) query = query.eq('photographer_id', user.id);
          const { data } = await query;
          if (data && data.length > 0) {
            setGears(data);
            return;
          }
        }
        setGears([
          { id: 'g1', name: 'Body Sony Alpha 7 IV', type: 'camera', status: 'active', purchase_price: 48000000 },
          { id: 'g2', name: 'Lens Sony 24-70mm GM II', type: 'lens', status: 'active', purchase_price: 49000000 },
        ]);
      } catch (e) {}
    };
    fetchStudioGears();
  }, [user]);

  const totalInvestment = gears.reduce((sum, g) => sum + (Number(g.purchase_price) || 0), 0);
  const totalCollected = events.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  const totalExpenses = events.reduce((sum, e) => sum + (Number(e.expenses) || 0), 0);
  const totalNetProfit = totalCollected - totalExpenses;
  const roiPercentage = totalInvestment > 0 ? (totalNetProfit / totalInvestment) * 100 : 0;

  // Animation mượt mà thanh tiến độ
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercent(progressPercent);
    }, 150);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
        className={`relative overflow-hidden rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-md ${
          isCollapsed ? 'p-4 sm:p-5' : 'p-6 sm:p-8'
        } ${className}`}
      >
        {/* Background Ambient Glow */}
        <div
          className={`absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000 bg-gradient-to-br ${currentTier.gradient}`}
        />

        <div className={`relative ${isCollapsed ? 'space-y-0' : 'space-y-6'}`}>
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Hành Trình Thăng Hạng (Growth Progress)
                </h3>
                {isCollapsed && <TierBadge tier={currentTier} size="xs" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                Doanh thu YTD {currentYear}: <strong className="text-slate-800 dark:text-zinc-200">{ytdRevenue.toLocaleString('vi-VN')} đ</strong>
                {isCollapsed && (
                  <span className="ml-2 text-amber-500 font-bold">• {progressPercent}% tiến độ</span>
                )}
              </p>
            </div>

            {/* Quick Switch Tabs & Toggle Button */}
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <>
                  <div className="flex items-center p-1 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-md text-xs">
                    <button
                      type="button"
                      onClick={() => setViewTab('tier')}
                      className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                        viewTab === 'tier'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Cấp Bậc ({currentTier.name})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTab('roi')}
                      className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                        viewTab === 'roi'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ROI Thiết Bị
                    </button>
                  </div>

                  <Link
                    to="/dashboard/gears"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
                    title="Quản lý kho thiết bị"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kho Máy</span>
                  </Link>
                </>
              )}

              {/* Nút Toggle Thu gọn / Mở rộng */}
              <button
                type="button"
                onClick={() => setIsCollapsed(prev => !prev)}
                className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-zinc-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                title={isCollapsed ? 'Mở rộng hành trình thăng hạng' : 'Thu gọn hành trình thăng hạng'}
                aria-label={isCollapsed ? 'Mở rộng thẻ tiến độ' : 'Thu gọn thẻ tiến độ'}
              >
                <span className="text-[11px] hidden sm:inline">{isCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="growth-progress-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden space-y-6 pt-1"
              >
                {/* TAB 1: CẤP BẬC - NGHỆ THUẬT VỚI BIỂU TƯỢNG PHÓNG TO VÀ THANH PROGRESS BAR LỚN */}
                {viewTab === 'tier' ? (
                  <div className="space-y-5">
              {/* Điểm nhấn Nghệ thuật: Biểu tượng Cấp bậc Phóng to + Tỷ lệ % khổng lồ */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                {/* Biểu tượng Badge lớn phóng to */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-white/10 transition-transform hover:scale-105 bg-gradient-to-br ${currentTier.gradient} text-white flex-shrink-0`}
                  >
                    {currentTier.iconName === 'Trophy' ? (
                      <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300" />
                    ) : currentTier.iconName === 'Crown' ? (
                      <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-200" />
                    ) : currentTier.iconName === 'Gem' ? (
                      <Gem className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-200 animate-spin" style={{ animationDuration: '10s' }} />
                    ) : currentTier.iconName === 'Award' ? (
                      <Award className="w-7 h-7 sm:w-8 sm:h-8 text-slate-100" />
                    ) : (
                      <Medal className="w-7 h-7 sm:w-8 sm:h-8 text-amber-200" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {currentTier.name}
                      </span>
                      <TierBadge tier={currentTier} size="xs" />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      {nextMilestone && nextTier ? (
                        <span>
                          Mục tiêu: <strong className="text-amber-500 font-semibold">{nextTier.name} ({nextMilestone / 1_000_000}M đ)</strong> • Còn thiếu <strong className="text-slate-800 dark:text-zinc-200 font-semibold">{remainingAmount.toLocaleString('vi-VN')} đ</strong>
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold">🏆 Đã đạt cấp Kim Cương tối đa!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phần trăm tiến độ khổng lồ, font-light thanh mảnh */}
                <div className="sm:text-right font-mono font-light text-4xl sm:text-5xl text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                  <CountUp start={0} end={progressPercent} decimals={1} duration={1.2} />
                  <span className="text-2xl sm:text-3xl text-amber-500 font-normal">%</span>
                </div>
              </div>

              {/* Thanh Progress Bar phóng to (h-7 sm:h-8) sang trọng với gradient & shimmer */}
              <div className="space-y-2">
                <div className="relative w-full h-7 sm:h-8 rounded-full bg-slate-900/90 dark:bg-black/80 border border-slate-800 dark:border-white/10 p-1 overflow-hidden shadow-inner">
                  {/* Thanh tiến độ chính */}
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${currentTier.barGradient} transition-all duration-1000 ease-out relative`}
                    style={{ width: `${Math.min(100, Math.max(4, animatedPercent))}%` }}
                  >
                    {/* Hiệu ứng sọc ánh sáng lướt qua */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />

                    {/* Tag nhỏ nổi trên thanh nếu đủ rộng */}
                    {animatedPercent >= 15 && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-950 px-2 py-0.5 rounded-full bg-white/95 shadow-sm leading-none">
                        {progressPercent}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Mốc chỉ số trực quan */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-zinc-500 px-1 font-medium">
                  <span>{currentTier.name} ({currentTier.minRevenue / 1_000_000}M)</span>
                  <span className="text-amber-500/80">50% Chặng</span>
                  <span className="text-emerald-500 dark:text-emerald-400">
                    {nextTier ? `${nextTier.name} (${nextMilestone! / 1_000_000}M)` : 'Đỉnh cao Kim Cương'}
                  </span>
                </div>
              </div>

              {/* Gamification Hook tinh tế, gọn gàng */}
              <div className="pt-1 flex items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>
                    <strong className="text-amber-600 dark:text-amber-400 font-semibold mr-1">Đặc quyền tiếp theo:</strong>
                    {gamificationHook}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCelebrationModal(true)}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex-shrink-0 cursor-pointer"
                >
                  <span>Chi tiết cấp</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: ROI THIẾT BỊ */
            <div className="p-5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span>Vốn thiết bị: <strong className="font-mono text-slate-900 dark:text-white font-bold">{totalInvestment.toLocaleString('vi-VN')} đ</strong></span>
                <span>•</span>
                <span>Đã thu: <strong className="text-sky-500 font-mono font-bold">{totalCollected.toLocaleString('vi-VN')} đ</strong></span>
                <span>•</span>
                <span>Lãi ròng: <strong className="text-emerald-500 font-mono font-bold">{totalNetProfit.toLocaleString('vi-VN')} đ</strong></span>
              </div>
              <div className="font-mono font-bold text-sm text-amber-500">
                ROI: {Math.round(roiPercentage * 10) / 10}%
              </div>
            </div>
          )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Modal Chúc Mừng Hoành Tráng khi vượt mốc cấp bậc mới */}
      <TierCelebrationModal
        isOpen={showCelebrationModal}
        tier={currentTier}
        ytdRevenue={ytdRevenue}
        onClose={() => setShowCelebrationModal(false)}
      />
    </>
  );
};

export default GrowthProgressBar;
