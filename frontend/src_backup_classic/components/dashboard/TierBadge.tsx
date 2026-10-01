import React from 'react';
import { TierConfig, TIER_CONFIGS, TierId } from '../../utils/tierSystem';
import { Shield, Medal, Award, Trophy, Crown, Gem, Sparkles } from 'lucide-react';

interface Props {
  tier?: TierConfig | TierId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const TierBadge: React.FC<Props> = ({
  tier = 'rookie',
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  const currentTier: TierConfig = typeof tier === 'string' ? TIER_CONFIGS[tier] || TIER_CONFIGS.rookie : tier;

  // Icon biểu tượng Huy chương tương ứng từng cấp bậc
  const renderMedalIcon = () => {
    const iconSizeClass = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    }[size];

    switch (currentTier.iconName) {
      case 'Medal':
        return <Medal className={`${iconSizeClass} text-amber-500 flex-shrink-0 animate-pulse`} />;
      case 'Award':
        return <Award className={`${iconSizeClass} text-slate-300 dark:text-slate-200 flex-shrink-0`} />;
      case 'Trophy':
        return <Trophy className={`${iconSizeClass} text-yellow-500 dark:text-yellow-400 flex-shrink-0 animate-bounce`} style={{ animationDuration: '3s' }} />;
      case 'Crown':
        return <Crown className={`${iconSizeClass} text-cyan-500 dark:text-cyan-300 flex-shrink-0`} />;
      case 'Gem':
        return <Gem className={`${iconSizeClass} text-indigo-500 dark:text-purple-300 flex-shrink-0 animate-spin`} style={{ animationDuration: '8s' }} />;
      case 'Shield':
      default:
        return <Shield className={`${iconSizeClass} text-slate-400 flex-shrink-0`} />;
    }
  };

  const containerSizes = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  }[size];

  return (
    <div
      className={`inline-flex items-center font-black uppercase tracking-wider rounded-full border backdrop-blur-md transition-all duration-300 select-none shadow-sm hover:scale-105 ${currentTier.badgeBg} ${currentTier.badgeBorder} ${currentTier.badgeText} ${currentTier.badgeGlow} ${containerSizes} ${className}`}
      title={`${currentTier.medalTitle}: ${currentTier.name} (Tối thiểu ${(currentTier.minRevenue / 1_000_000).toLocaleString('vi-VN')}M đ)`}
    >
      <div className="relative flex items-center justify-center">
        {renderMedalIcon()}
      </div>
      {showLabel && (
        <span className="font-extrabold whitespace-nowrap">
          {currentTier.name}
        </span>
      )}
    </div>
  );
};
