import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonPadding = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-xs',
    lg: 'p-2.5 text-sm',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-200 border shadow-sm select-none group
        bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80
        dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 dark:text-zinc-200 dark:border-zinc-700/70
        hover:shadow-md active:scale-95 ${buttonPadding[size]} ${className}`}
      title={isDark ? 'Chuyển sang Chế độ Sáng (Light Mode)' : 'Chuyển sang Chế độ Tối (Dark Mode)'}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        {/* Sun Icon (Hiện khi Dark mode để bấm chuyển sang Light) */}
        <Sun
          className={`${iconSizes[size]} text-amber-500 absolute transition-all duration-500 ease-in-out transform ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50 pointer-events-none'
          }`}
        />
        {/* Moon Icon (Hiện khi Light mode để bấm chuyển sang Dark) */}
        <Moon
          className={`${iconSizes[size]} text-indigo-500 absolute transition-all duration-500 ease-in-out transform ${
            !isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-50 pointer-events-none'
          }`}
        />
      </div>

      {showLabel && (
        <span className="transition-opacity duration-200 text-[11px] font-semibold">
          {isDark ? 'Chế độ Sáng' : 'Chế độ Tối'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
