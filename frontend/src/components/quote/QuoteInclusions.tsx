import React from 'react';
import { Check, Gift, Camera } from 'lucide-react';
import { PackageInclusion } from '../../types';

interface Props {
  inclusions?: PackageInclusion[];
  deliverables?: string[];
  features?: string[];
}

export const QuoteInclusions: React.FC<Props> = ({
  inclusions = [],
  deliverables = [],
  features = [],
}) => {
  const hasDynamicFeatures = Array.isArray(features) && features.length > 0;

  if (hasDynamicFeatures) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-1.5 flex flex-col justify-between h-full break-inside-avoid print:break-inside-avoid print:m-0">
        <div className="border-b border-slate-100 pb-1.5 print:pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
            Quyền Lợi & Bàn Giao
          </span>
          <h3 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide flex items-center gap-1.5 print:text-xs">
            <Camera className="w-4 h-4 text-orange-500" />
            <span>Quyền Lợi Gói Dịch Vụ</span>
          </h3>
        </div>

        <div className="space-y-1.5 text-xs print:text-[11px] flex-1">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-800 text-xs print:p-1 print:text-[10px] leading-tight"
            >
              <div className="w-3.5 h-3.5 rounded bg-orange-100/70 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-orange-600 stroke-[3]" />
              </div>
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-2 flex flex-col justify-between h-full break-inside-avoid print:break-inside-avoid print:m-0">
      {/* Services Inclusions */}
      {inclusions.length > 0 && (
        <div className="space-y-1">
          <div className="border-b border-slate-100 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
              Dịch Vụ Cung Cấp
            </span>
            <h3 className="text-slate-900 font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 print:text-xs">
              <Camera className="w-3.5 h-3.5 text-orange-500" />
              <span>Quyền Lợi Buổi Chụp</span>
            </h3>
          </div>

          <div className="space-y-1">
            {inclusions.map(item => (
              <div
                key={item.id}
                className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5 print:p-1"
              >
                <div className="flex items-start gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-orange-100/70 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs print:text-[10px] text-slate-900">{item.title}</h4>
                    <p className="text-[11px] print:text-[9px] text-slate-500 leading-snug">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverables / Sản phẩm bàn giao */}
      {deliverables.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-100">
          <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 print:text-[10px]">
            <Gift className="w-3 h-3 text-orange-500" />
            <span>Sản Phẩm Bàn Giao</span>
          </h3>

          <div className="space-y-1">
            {deliverables.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] print:text-[9px] text-slate-800"
              >
                <Check className="w-3 h-3 text-orange-500 flex-shrink-0 stroke-[2.5]" />
                <span className="font-medium truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
