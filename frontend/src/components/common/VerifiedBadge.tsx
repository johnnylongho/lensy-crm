import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export const VerifiedBadge: React.FC<Props> = ({
  className = '',
  size = 'sm',
  tooltip = 'Thợ ảnh đã xác thực danh tính qua Facebook & Studio',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center justify-center text-blue-500 fill-blue-500/10 align-middle flex-shrink-0 cursor-help ${className}`}
      title={tooltip}
      aria-label="Verified Photographer"
    >
      <BadgeCheck className={`${sizeClasses[size]} drop-shadow-[0_1px_3px_rgba(59,130,246,0.3)]`} />
    </span>
  );
};

export default VerifiedBadge;
