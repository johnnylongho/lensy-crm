import React from 'react';
import { Check, Gift, Camera, FileCheck } from 'lucide-react';
import { PackageInclusion } from '../../types';

interface Props {
  inclusions: PackageInclusion[];
  deliverables: string[];
}

export const QuoteInclusions: React.FC<Props> = ({ inclusions, deliverables }) => {
  return (
    <div className="space-y-4">
      {/* Services Inclusions */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-400" /> Quyền Lợi Gói Dịch Vụ
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {inclusions.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-1"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables / Sản phẩm bàn giao */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-400" /> Sản Phẩm & File Bàn Giao
        </h3>

        <div className="space-y-2">
          {deliverables.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs text-slate-300 py-1 border-b border-slate-800/40 last:border-0">
              <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
