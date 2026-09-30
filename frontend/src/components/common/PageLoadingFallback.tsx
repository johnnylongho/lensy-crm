import React from 'react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-500/15 to-transparent blur-[90px] pointer-events-none" />

      {/* Main Loading Card */}
      <div className="relative z-10 flex flex-col items-center gap-5 p-8 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] animate-pulse">
        {/* Logo or Brand Icon with spinning ring */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 animate-spin opacity-75 blur-sm" />
          <div className="relative w-14 h-14 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center overflow-hidden shadow-inner">
            <img
              src="/lensy-logo.png"
              alt="Lensy CRM"
              className="w-10 h-10 object-contain drop-shadow"
              onError={e => {
                // Fallback to text if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Lensy CRM
          </span>
          <span className="text-xs text-slate-500 dark:text-white/50 font-medium animate-pulse">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>
    </div>
  );
};
