import React from 'react';
import { QuoteData } from '../../types';
import { CheckCircle2, Camera, Sparkles, Download, Clock } from 'lucide-react';

interface Props {
  quote: QuoteData;
}

export const ClientProjectJourney: React.FC<Props> = ({ quote }) => {
  // Xác định bước hiện tại dựa trên trạng thái booking
  // 1: Chốt cọc | 2: Đã chụp | 3: Đang hậu kỳ | 4: Đã bàn giao
  const status = quote.status;
  const hasDeliveryLink = Boolean(quote.drive_delivery_link);

  let currentStep = 1;
  if (status === 'da_tra_file' || status === 'done' || status === 'hoan_thanh' || hasDeliveryLink) {
    currentStep = 4;
  } else if (status === 'editing') {
    currentStep = 3;
  } else if (status === 'shot') {
    currentStep = 2;
  } else if (status === 'da_chot' || status === 'deposited') {
    currentStep = 1;
  } else {
    // lead / cho_coc / cho_xac_nhan_coc
    currentStep = 0;
  }

  const steps = [
    {
      index: 1,
      title: 'Chốt Lịch & Cọc',
      subtitle: currentStep >= 1 ? 'Đã kích hoạt hợp đồng' : 'Chờ xác nhận cọc',
      icon: CheckCircle2,
      activeColor: 'from-emerald-500 to-teal-500',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      index: 2,
      title: 'Ngày Bấm Máy',
      subtitle: currentStep >= 2 ? 'Đã hoàn thành buổi chụp' : `${quote.eventDate || 'Theo lịch'}`,
      icon: Camera,
      activeColor: 'from-amber-500 to-orange-500',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      index: 3,
      title: 'Hậu Kỳ & Chỉnh Màu',
      subtitle: currentStep >= 4 ? 'Đã hoàn thiện màu' : currentStep === 3 ? 'Đang blend màu & retouch' : 'Dự kiến 3 - 5 ngày',
      icon: Sparkles,
      activeColor: 'from-purple-500 to-indigo-500',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
    {
      index: 4,
      title: 'Bàn Giao & Tải Ảnh',
      subtitle: currentStep >= 4 ? 'Sẵn sàng tải file' : 'Sau khi hoàn tất hậu kỳ',
      icon: Download,
      activeColor: 'from-rose-500 to-pink-500',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
  ];

  return (
    <div className="rounded-3xl p-5 sm:p-7 bg-[#1c1917]/80 backdrop-blur-xl border border-amber-500/20 shadow-2xl space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Hành Trình Dự Án (Project Journey)</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Tiến Độ Thực Hiện Show Chụp
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-stone-400 block">Trạng thái hiện tại:</span>
          <span className="text-sm font-bold text-amber-400">
            {currentStep >= 4
              ? '🎁 Đã bàn giao ảnh hoàn tất'
              : currentStep === 3
              ? '🎨 Đang hậu kỳ & blend màu'
              : currentStep === 2
              ? '📸 Đã chụp, chờ chuyển file'
              : currentStep === 1
              ? '✨ Đã chốt lịch chụp'
              : '⏳ Chờ chốt cọc'}
          </span>
        </div>
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:grid grid-cols-4 gap-3 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isPassed = currentStep > s.index;
          const isCurrent = currentStep === s.index;
          const isPending = currentStep < s.index;

          return (
            <div
              key={s.index}
              className={`relative rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between ${
                isCurrent
                  ? 'bg-stone-800/90 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : isPassed
                  ? 'bg-stone-900/60 border-stone-800 text-stone-300'
                  : 'bg-stone-950/40 border-stone-800/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/30'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {isPassed ? '✓' : s.index}
                </span>

                <div
                  className={`p-2 rounded-xl ${
                    isCurrent
                      ? 'bg-amber-500/20 text-amber-400'
                      : isPassed
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-stone-800/50 text-stone-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  {s.title}
                </h4>
                <p className="text-[11px] text-stone-400 leading-snug truncate">
                  {s.subtitle}
                </p>
              </div>

              {isCurrent && (
                <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center gap-1.5 text-[10px] font-bold text-amber-400 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Đang thực hiện</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stacked Stepper */}
      <div className="sm:hidden space-y-2.5">
        {steps.map(s => {
          const Icon = s.icon;
          const isPassed = currentStep > s.index;
          const isCurrent = currentStep === s.index;

          return (
            <div
              key={s.index}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                isCurrent
                  ? 'bg-stone-800/95 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                  : isPassed
                  ? 'bg-stone-900/60 border-stone-800'
                  : 'bg-stone-950/40 border-stone-800/40 opacity-60'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isPassed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-amber-500 text-stone-950 font-black'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {isPassed ? '✓' : s.index}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                      Hiện tại
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 truncate">{s.subtitle}</p>
              </div>
              <Icon className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-amber-400' : isPassed ? 'text-emerald-400' : 'text-stone-600'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
