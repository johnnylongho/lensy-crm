import React from 'react';
import { QuoteData } from '../../types';
import { Check, Clock } from 'lucide-react';

interface Props {
  quote: QuoteData;
}

export const ClientProjectJourney: React.FC<Props> = ({ quote }) => {
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
    currentStep = 0;
  }

  const steps = [
    { index: 1, title: 'Chốt Lịch & Cọc' },
    { index: 2, title: 'Ngày Bấm Máy' },
    { index: 3, title: 'Hậu Kỳ Màu' },
    { index: 4, title: 'Bàn Giao Ảnh' },
  ];

  const statusLabel =
    currentStep >= 4
      ? 'Đã bàn giao hoàn tất'
      : currentStep === 3
      ? 'Đang hậu kỳ & blend màu'
      : currentStep === 2
      ? 'Đã hoàn thành buổi chụp'
      : currentStep === 1
      ? 'Đã chốt lịch chụp'
      : 'Chờ khách xác nhận cọc';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-sm print:p-1.5 print:m-0 print:border-slate-100 space-y-1.5 break-inside-avoid print:break-inside-avoid">
      {/* Header thanh mảnh */}
      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1 print:pb-0.5">
        <div className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-600 text-[11px] print:text-[10px]">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span>Tiến Độ Thực Hiện</span>
        </div>
        <span className="text-[11px] print:text-[10px] font-semibold text-orange-600">
          {statusLabel}
        </span>
      </div>

      {/* Thanh tiến trình ngang thanh mảnh (Horizontal Stepper) */}
      <div className="grid grid-cols-4 gap-2 items-center relative py-1 print:py-0.5">
        {steps.map((s, idx) => {
          const isPassed = currentStep > s.index;
          const isCurrent = currentStep === s.index;

          return (
            <div key={s.index} className="flex flex-col items-center text-center relative">
              {/* Connector Line giữa các bước */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-2.5 left-1/2 w-full h-[2px] -z-0 ${
                    currentStep > s.index ? 'bg-orange-500' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Node Circle */}
              <div
                className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isPassed
                    ? 'bg-orange-500 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-orange-600 text-white ring-2 ring-orange-200'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.index}
              </div>

              {/* Step Label */}
              <span
                className={`text-[11px] print:text-[10px] mt-0.5 font-medium leading-tight truncate w-full ${
                  isCurrent
                    ? 'text-orange-600 font-bold'
                    : isPassed
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
