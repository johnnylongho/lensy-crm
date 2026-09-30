import { CalendarEvent } from '../types';
import confetti from 'canvas-confetti';

// ====================================================================
// 1. HẰNG SỐ MỐC DOANH THU MỤC TIÊU (MILESTONES)
// ====================================================================
export const MILESTONES = [
  10_000_000,  // 10tr: Đồng (Bronze)
  20_000_000,  // 20tr: Bạc (Silver)
  50_000_000,  // 50tr: Vàng (Gold)
  100_000_000, // 100tr: Bạch Kim (Platinum)
  200_000_000, // 200tr: Kim Cương (Diamond)
] as const;

export type TierId = 'rookie' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierConfig {
  id: TierId;
  name: string;
  minRevenue: number;
  nextMilestone: number | null;
  medalTitle: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeGlow: string;
  gradient: string;
  barGradient: string;
  iconName: 'Shield' | 'Medal' | 'Award' | 'Trophy' | 'Crown' | 'Gem';
  gamificationHook: string;
}

export const TIER_CONFIGS: Record<TierId, TierConfig> = {
  rookie: {
    id: 'rookie',
    name: 'Tân Binh',
    minRevenue: 0,
    nextMilestone: 10_000_000,
    medalTitle: 'Tân Binh Khởi Động',
    badgeBg: 'bg-slate-500/15 dark:bg-slate-500/20',
    badgeBorder: 'border-slate-400/30 dark:border-slate-500/30',
    badgeText: 'text-slate-600 dark:text-slate-300',
    badgeGlow: 'shadow-[0_0_12px_rgba(148,163,184,0.3)]',
    gradient: 'from-slate-400 to-zinc-500',
    barGradient: 'from-slate-400 via-zinc-400 to-slate-500',
    iconName: 'Shield',
    gamificationHook: 'Đạt hạng Đồng (10tr) để mở khóa Huy hiệu Uy tín & Tùy biến link đặt lịch',
  },
  bronze: {
    id: 'bronze',
    name: 'Hạng Đồng',
    minRevenue: 10_000_000,
    nextMilestone: 20_000_000,
    medalTitle: 'Huy Chương Đồng',
    badgeBg: 'bg-amber-600/15 dark:bg-amber-700/25',
    badgeBorder: 'border-amber-600/40 dark:border-amber-500/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeGlow: 'shadow-[0_0_15px_rgba(217,119,6,0.4)]',
    gradient: 'from-amber-600 via-amber-700 to-amber-800',
    barGradient: 'from-amber-600 via-amber-500 to-yellow-600',
    iconName: 'Medal',
    gamificationHook: 'Đạt hạng Bạc (20tr) để mở khóa Quản lý Hợp đồng & Thông báo tự động Zalo',
  },
  silver: {
    id: 'silver',
    name: 'Hạng Bạc',
    minRevenue: 20_000_000,
    nextMilestone: 50_000_000,
    medalTitle: 'Huy Chương Bạc',
    badgeBg: 'bg-slate-200/40 dark:bg-slate-400/20',
    badgeBorder: 'border-slate-300/50 dark:border-slate-400/40',
    badgeText: 'text-slate-800 dark:text-slate-200',
    badgeGlow: 'shadow-[0_0_15px_rgba(203,213,225,0.45)]',
    gradient: 'from-slate-300 via-gray-100 to-slate-400',
    barGradient: 'from-slate-400 via-slate-300 to-zinc-200',
    iconName: 'Award',
    gamificationHook: 'Đạt hạng Vàng (50tr) để mở khóa tính năng Báo cáo chuyên sâu & Phân tích ROI nâng cao',
  },
  gold: {
    id: 'gold',
    name: 'Hạng Vàng',
    minRevenue: 50_000_000,
    nextMilestone: 100_000_000,
    medalTitle: 'Cúp Vàng Xuất Sắc',
    badgeBg: 'bg-yellow-500/20 dark:bg-yellow-500/25',
    badgeBorder: 'border-yellow-500/50 dark:border-yellow-400/40',
    badgeText: 'text-yellow-700 dark:text-yellow-400',
    badgeGlow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]',
    gradient: 'from-yellow-400 via-amber-400 to-yellow-600',
    barGradient: 'from-amber-500 via-yellow-400 to-amber-300',
    iconName: 'Trophy',
    gamificationHook: 'Đạt hạng Bạch Kim (100tr) để mở khóa Phân quyền Đa chi nhánh & Quản lý Ekip không giới hạn',
  },
  platinum: {
    id: 'platinum',
    name: 'Bạch Kim',
    minRevenue: 100_000_000,
    nextMilestone: 200_000_000,
    medalTitle: 'Vương Miện Bạch Kim',
    badgeBg: 'bg-cyan-500/20 dark:bg-cyan-500/25',
    badgeBorder: 'border-cyan-500/50 dark:border-cyan-400/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    gradient: 'from-cyan-400 via-teal-400 to-indigo-500',
    barGradient: 'from-cyan-500 via-teal-400 to-indigo-400',
    iconName: 'Crown',
    gamificationHook: 'Đạt hạng Kim Cương (200tr) để vinh danh Studio Xuất sắc & Hỗ trợ kỹ thuật 1-1 riêng biệt',
  },
  diamond: {
    id: 'diamond',
    name: 'Kim Cương',
    minRevenue: 200_000_000,
    nextMilestone: null,
    medalTitle: 'Kim Cương Thượng Hạng',
    badgeBg: 'bg-indigo-500/25 dark:bg-purple-500/25',
    badgeBorder: 'border-indigo-500/50 dark:border-purple-400/50',
    badgeText: 'text-indigo-700 dark:text-purple-300',
    badgeGlow: 'shadow-[0_0_25px_rgba(147,51,234,0.6)]',
    gradient: 'from-sky-400 via-indigo-400 to-purple-500',
    barGradient: 'from-sky-400 via-indigo-500 to-purple-500',
    iconName: 'Gem',
    gamificationHook: '🎉 Bạn đã đạt Cấp bậc Đỉnh cao! Mở khóa toàn bộ đặc quyền Studio Hạng Nhất',
  },
};

export interface TierProgress {
  ytdRevenue: number;
  currentYear: number;
  currentTier: TierConfig;
  nextTier: TierConfig | null;
  nextMilestone: number | null;
  progressPercent: number; // Tỷ lệ % từ mốc hiện tại lên mốc kế tiếp (0 - 100)
  remainingAmount: number; // Số tiền còn thiếu để đạt mốc tiếp theo
  gamificationHook: string;
}

// ====================================================================
// 2. TÍNH TOÁN DOANH THU TRONG NĂM HIỆN TẠI (YTD REVENUE)
// ====================================================================
export const calculateYtdRevenue = (events: CalendarEvent[], targetYear?: number): number => {
  const currentYear = targetYear || new Date().getFullYear();
  return events.reduce((sum, e) => {
    if (!e.eventDate) return sum;
    // Kiểm tra booking nằm trong năm hiện tại
    const d = new Date(e.eventDate);
    const eventYear = !isNaN(d.getFullYear()) ? d.getFullYear() : parseInt(e.eventDate.substring(0, 4), 10);
    if (eventYear !== currentYear) return sum;

    // Xét các booking đã hoàn tất / đã chốt
    const s = (e.status || '').toLowerCase();
    const isCompleted = s === 'hoan_thanh' || s === 'da_tra_file' || s === 'da_chot' || s === 'completed' || s === 'done';
    if (!isCompleted) return sum;

    // Doanh thu từ booking: giá trị gói hoặc số tiền đã thu
    const revenue = Number(e.packagePrice) || Number(e.paidAmount) || 0;
    return sum + revenue;
  }, 0);
};

// ====================================================================
// 3. XÁC ĐỊNH CẤP BẬC HIỆN TẠI & TIẾN TRÌNH LÊN CẤP TIẾP THEO
// ====================================================================
export const getTierProgress = (ytdRevenue: number, targetYear?: number): TierProgress => {
  const currentYear = targetYear || new Date().getFullYear();
  const safeRevenue = Math.max(0, ytdRevenue);

  let currentTier: TierConfig = TIER_CONFIGS.rookie;
  let nextTier: TierConfig | null = TIER_CONFIGS.bronze;

  if (safeRevenue >= 200_000_000) {
    currentTier = TIER_CONFIGS.diamond;
    nextTier = null;
  } else if (safeRevenue >= 100_000_000) {
    currentTier = TIER_CONFIGS.platinum;
    nextTier = TIER_CONFIGS.diamond;
  } else if (safeRevenue >= 50_000_000) {
    currentTier = TIER_CONFIGS.gold;
    nextTier = TIER_CONFIGS.platinum;
  } else if (safeRevenue >= 20_000_000) {
    currentTier = TIER_CONFIGS.silver;
    nextTier = TIER_CONFIGS.gold;
  } else if (safeRevenue >= 10_000_000) {
    currentTier = TIER_CONFIGS.bronze;
    nextTier = TIER_CONFIGS.silver;
  } else {
    currentTier = TIER_CONFIGS.rookie;
    nextTier = TIER_CONFIGS.bronze;
  }

  const nextMilestone = currentTier.nextMilestone;
  let progressPercent = 0;
  let remainingAmount = 0;

  if (!nextMilestone) {
    // Đã đạt cấp Kim Cương (Cấp tối đa)
    progressPercent = 100;
    remainingAmount = 0;
  } else {
    // Tính % hoàn thành từ mốc hiện tại lên mốc tiếp theo
    // Ví dụ: Doanh thu 15tr -> min 10tr (Đồng), next 20tr (Bạc)
    // Quãng đường: 20tr - 10tr = 10tr; Đã chạy: 15tr - 10tr = 5tr -> 50%
    const baseRevenue = currentTier.minRevenue;
    const milestoneSpan = nextMilestone - baseRevenue;
    const progressInTier = safeRevenue - baseRevenue;

    const rawPercent = milestoneSpan > 0 ? (progressInTier / milestoneSpan) * 100 : 0;
    progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent * 10) / 10));
    remainingAmount = Math.max(0, nextMilestone - safeRevenue);
  }

  return {
    ytdRevenue: safeRevenue,
    currentYear,
    currentTier,
    nextTier,
    nextMilestone,
    progressPercent,
    remainingAmount,
    gamificationHook: currentTier.gamificationHook,
  };
};

// ====================================================================
// 4. SMART CONFETTI VALIDATION (TRÁNH BẮN LẠI KHI RELOAD TRANG)
// ====================================================================
export const getTierCelebrationKey = (tierId: TierId): string => {
  return `lensy_celebrated_tier_${tierId}`;
};

export const hasCelebratedTier = (tierId: TierId): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem(getTierCelebrationKey(tierId)) === 'true';
};

export const markTierCelebrated = (tierId: TierId): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(getTierCelebrationKey(tierId), 'true');
};

export const triggerCelebrationConfetti = (): void => {
  try {
    // Đợt 1: Pháo hoa bùng nổ trung tâm
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#818cf8', '#ec4899'],
    });

    // Đợt 2: Pháo sáng bắn chéo từ 2 góc màn hình
    setTimeout(() => {
      confetti({
        particleCount: 75,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.65 },
        colors: ['#eab308', '#f59e0b', '#38bdf8'],
      });
      confetti({
        particleCount: 75,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.65 },
        colors: ['#eab308', '#f59e0b', '#38bdf8'],
      });
    }, 280);

    // Đợt 3: Mưa sao lấp lánh nhẹ nhàng
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.4 },
        shapes: ['circle'],
        scalar: 1.2,
        colors: ['#fbbf24', '#ffffff', '#38bdf8'],
      });
    }, 550);
  } catch (err) {
    console.warn('[TierConfetti] Error triggering confetti:', err);
  }
};
