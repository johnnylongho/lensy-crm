import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TierConfig } from '../../utils/tierSystem';
import {
  X,
  Sparkles,
  Trophy,
  Medal,
  Award,
  Crown,
  Gem,
  Shield,
  ArrowRight,
  Share2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  tier: TierConfig;
  ytdRevenue: number;
  onClose: () => void;
}

export const TierCelebrationModal: React.FC<Props> = ({
  isOpen,
  tier,
  ytdRevenue,
  onClose,
}) => {
  if (!isOpen) return null;

  const renderBigMedal = () => {
    const iconClass = "w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]";
    switch (tier.iconName) {
      case 'Medal':
        return <Medal className={`${iconClass} text-amber-500`} />;
      case 'Award':
        return <Award className={`${iconClass} text-slate-200`} />;
      case 'Trophy':
        return <Trophy className={`${iconClass} text-yellow-400`} />;
      case 'Crown':
        return <Crown className={`${iconClass} text-cyan-400`} />;
      case 'Gem':
        return <Gem className={`${iconClass} text-indigo-400`} />;
      case 'Shield':
      default:
        return <Shield className={`${iconClass} text-amber-400`} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Mờ Ảo Phong Cách Kính Mờ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
        />

        {/* Modal Hộp Kính Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-3xl bg-slate-900/95 dark:bg-black/90 border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-7 sm:p-9 text-center text-white backdrop-blur-2xl z-10"
        >
          {/* Vầng hào quang ánh sáng xoay sau huy chương */}
          <div
            className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-35 pointer-events-none bg-gradient-to-r ${tier.gradient}`}
          />

          {/* Nút Đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            aria-label="Đóng thông báo"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Biểu tượng Huy chương Lớn với Animation */}
          <div className="relative mx-auto my-3 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="p-5 rounded-3xl bg-white/10 border border-white/20 shadow-2xl relative"
            >
              {renderBigMedal()}
              <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-500 text-slate-950 font-bold shadow-lg">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </motion.div>
          </div>

          {/* Tiêu đề Vinh Danh */}
          <div className="space-y-2 mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vinh Danh Thăng Cấp Bậc</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              CHÚC MỪNG THĂNG HẠNG!
            </h2>

            <div className="text-lg sm:text-xl font-bold text-white/95">
              Studio của bạn chính thức đạt{' '}
              <span className={`px-2.5 py-0.5 rounded-xl border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText}`}>
                {tier.name}
              </span>
            </div>
          </div>

          {/* Khối Thống kê Doanh thu YTD */}
          <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-left space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Doanh thu tích lũy năm (YTD):</span>
              <strong className="text-emerald-400 font-mono font-bold text-sm">
                {ytdRevenue.toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Mốc cấp bậc tối thiểu:</span>
              <span className="font-mono text-white/90">
                {(tier.minRevenue).toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="pt-2 border-t border-white/10">
              <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                🎁 Đặc quyền mở khóa:
              </span>
              <p className="text-xs text-white/90 font-medium leading-relaxed">
                {tier.gamificationHook}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tiếp Tục Bứt Phá Doanh Thu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
