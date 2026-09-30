import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CalendarEvent, GearItem } from '../../types';
import {
  calculateYtdRevenue,
  getTierProgress,
  TierProgress,
} from '../../utils/tierSystem';
import { TierBadge } from './TierBadge';
import { TierCelebrationModal } from './TierCelebrationModal';
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
  Trophy,
  Award,
  Medal,
  Crown,
  Gem,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  className?: string;
  defaultCollapsed?: boolean;
}

export const RoiProgressBar: React.FC<Props> = ({ events, className = '', defaultCollapsed = false }) => {
  const { user } = useAuth();
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tier' | 'roi'>('tier');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const hasCelebratedRoi = useRef(false);

  // 1. Tính toán Doanh thu Năm Hiện Tại (YTD Revenue) & Cấp bậc Studio
  const currentYear = new Date().getFullYear();
  const ytdRevenue = calculateYtdRevenue(events, currentYear);
  const tierProgress: TierProgress = getTierProgress(ytdRevenue, currentYear);
  const { currentTier, nextTier, nextMilestone, progressPercent, remainingAmount, gamificationHook } = tierProgress;

  // 2. Fetch toàn bộ thiết bị của studio để tính "Tổng Đầu Tư"
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

  // 3. Logic tính toán ROI chuẩn SaaS (Dựa trên Lợi Nhuận Ròng thực tế):
  // - Tổng Đầu Tư: Toàn bộ giá mua các thiết bị trong kho
  const totalInvestment = gears.reduce((sum, g) => sum + (Number(g.purchase_price) || 0), 0);

  // - Tổng Doanh Thu Đã Thu (Gross Collected): Toàn bộ số tiền ĐÃ THU từ các Booking
  const totalCollected = events.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);

  // - Tổng Chi Phí Show (Expenses): Toàn bộ các khoản chi phí phát sinh
  const totalExpenses = events.reduce((sum, e) => sum + (Number(e.expenses) || 0), 0);

  // - Tổng LỢI NHUẬN RÒNG (Net Profit) = Tổng Doanh Thu Đã Thu - Tổng Chi Phí
  const totalNetProfit = totalCollected - totalExpenses;

  // - Công thức % Hoàn vốn = (Tổng Lợi Nhuận Ròng / Tổng Đầu Tư) * 100
  const roiPercentage = totalInvestment > 0 ? (totalNetProfit / totalInvestment) * 100 : 0;
  const roundedPercent = Math.round(roiPercentage * 10) / 10;

  // Chuyển màu thông minh theo 3 tầng cho ROI:
  const isOver100 = roiPercentage >= 100;
  const isOver50 = roiPercentage >= 50 && roiPercentage < 100;

  // Animation % hiển thị
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
        className={`relative overflow-hidden rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-md ${
          isCollapsed ? 'p-4 sm:p-5' : 'p-6 sm:p-7'
        } ${className}`}
      >
        {/* Background Ambient Glow */}
        <div
          className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-1000 bg-gradient-to-br ${currentTier.gradient}`}
        />

        <div className={`relative ${isCollapsed ? 'space-y-0' : 'space-y-5'}`}>
          {/* Top Header: Badge, Title & Switch Tab */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-md transition-colors bg-gradient-to-br ${currentTier.gradient} text-white flex-shrink-0`}
              >
                {currentTier.iconName === 'Trophy' ? (
                  <Trophy className="w-5 h-5 text-yellow-300" />
                ) : currentTier.iconName === 'Crown' ? (
                  <Crown className="w-5 h-5 text-cyan-200" />
                ) : currentTier.iconName === 'Gem' ? (
                  <Gem className="w-5 h-5 text-indigo-200 animate-spin" style={{ animationDuration: '10s' }} />
                ) : currentTier.iconName === 'Award' ? (
                  <Award className="w-5 h-5 text-slate-100" />
                ) : (
                  <Medal className="w-5 h-5 text-amber-200" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white/95 tracking-tight flex items-center gap-1.5">
                    Hành Trình Thăng Hạng (Growth Progress)
                  </h3>

                  <TierBadge tier={currentTier} size="sm" />
                </div>

                <p className="text-xs text-slate-500 dark:text-white/50">
                  Doanh thu YTD {currentYear}: <strong className="text-slate-800 dark:text-white/90 font-mono font-bold">{(ytdRevenue).toLocaleString('vi-VN')} đ</strong>
                  {isCollapsed ? (
                    <span className="ml-2 text-amber-500 font-bold">• {progressPercent}% tiến độ</span>
                  ) : nextMilestone ? (
                    <span> • Mục tiêu: <span className="font-mono text-amber-500 font-bold">{(nextMilestone).toLocaleString('vi-VN')} đ</span> ({nextTier?.name})</span>
                  ) : null}
                </p>
              </div>
            </div>

            {/* Quick Switch Tabs & Toggle Button */}
            <div className="flex items-center gap-2">
              {!isCollapsed && (
                <>
                  <div className="flex items-center p-1 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tier')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'tier'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      Cấp Bậc ({currentTier.name})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('roi')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'roi'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      ROI Thiết Bị
                    </button>
                  </div>

                  <Link
                    to="/dashboard/gears"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/20 dark:bg-white/5 hover:bg-white/30 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-white/80 text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
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
                key="roi-progress-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden space-y-5 pt-1"
              >
                {/* TAB 1: HÀNH TRÌNH THĂNG HẠNG (GROWTH PROGRESS) */}
                {activeTab === 'tier' ? (
                  <div className="space-y-4">
              {/* Stat Bar: Chi tiết quãng đường từ Cấp Hiện Tại lên Cấp Kế Tiếp */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-medium text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-white/50">Cấp hiện tại:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {currentTier.name} ({(currentTier.minRevenue / 1_000_000)}M đ)
                    </strong>
                  </div>

                  {nextMilestone && nextTier && (
                    <>
                      <span className="text-slate-400 dark:text-white/30 font-bold hidden sm:inline">➔</span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-white/50">Mục tiêu:</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-bold">
                          {nextTier.name} ({(nextMilestone / 1_000_000)}M đ)
                        </strong>
                      </div>
                    </>
                  )}

                  <span className="text-slate-400 dark:text-white/30 font-bold hidden sm:inline">•</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-white/50">Tiến độ chặng:</span>
                    <strong className="font-mono font-black text-sm text-amber-500 dark:text-amber-400">
                      <CountUp start={0} end={progressPercent} decimals={1} duration={1.2} suffix="%" />
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-slate-500 dark:text-white/60">
                  {nextMilestone ? (
                    <span>
                      Còn thiếu <strong className="text-amber-500 font-mono font-bold">{(remainingAmount).toLocaleString('vi-VN')} đ</strong> để thăng hạng
                    </span>
                  ) : (
                    <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                      🏆 Đã đạt cấp Kim Cương tối đa!
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Container: Hiển thị số % tiến tới Cấp bậc tiếp theo */}
              <div className="space-y-1.5">
                <div className="relative w-full h-5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden shadow-inner">
                  {/* Thanh tiến độ chính với Gradient cấp bậc */}
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${currentTier.barGradient} transition-all duration-1000 ease-out relative`}
                    style={{ width: `${Math.min(100, Math.max(3, animatedPercent))}%` }}
                  >
                    {/* Hiệu ứng sọc ánh sáng lướt qua (Shimmer Effect) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />

                    {/* Con trỏ hiển thị tỷ lệ phần trăm */}
                    {animatedPercent >= 10 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-950 px-1.5 py-0.5 rounded-full bg-white/95 shadow-sm leading-none">
                        {progressPercent}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Mốc chỉ số trực quan các cấp bậc */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1 font-bold">
                  <span className="hover:text-slate-300 transition-colors">
                    {currentTier.name} ({(currentTier.minRevenue / 1_000_000)}M)
                  </span>
                  <span className="text-amber-500/80 hover:text-amber-400 transition-colors">
                    50% Chặng
                  </span>
                  <span className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-300 transition-colors">
                    {nextTier ? `${nextTier.name} (${(nextMilestone! / 1_000_000)}M)` : 'Đỉnh cao Kim Cương'}
                  </span>
                </div>
              </div>

              {/* Tính năng Tương lai: Dòng Gamification Hook động kích thích thăng hạng */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-300 mr-1.5">
                      Đặc quyền tiếp theo:
                    </span>
                    <span className="text-slate-700 dark:text-white/80 font-medium">
                      {gamificationHook}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCelebrationModal(true)}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex-shrink-0"
                >
                  <span>Chi tiết cấp</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: THÔNG TIN ROI HOÀN VỐN THIẾT BỊ */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Vốn thiết bị: <strong className="font-mono">{totalInvestment.toLocaleString('vi-VN')} đ</strong></span>
                  <span>•</span>
                  <span>Đã thu: <strong className="text-sky-500 font-mono">{totalCollected.toLocaleString('vi-VN')} đ</strong></span>
                  <span>•</span>
                  <span>Lãi ròng: <strong className="text-emerald-500 font-mono">{totalNetProfit.toLocaleString('vi-VN')} đ</strong></span>
                </div>
                <div className="font-bold text-amber-500">
                  % Hoàn vốn (ROI): <CountUp start={0} end={roundedPercent} decimals={1} duration={1.2} suffix="%" />
                </div>
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

export const GrowthProgressBar = RoiProgressBar;
export default RoiProgressBar;
