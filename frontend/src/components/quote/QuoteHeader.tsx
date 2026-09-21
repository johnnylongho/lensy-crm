import React from 'react';
import { Sparkles, Camera, Award } from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
}

export const QuoteHeader: React.FC<Props> = ({ quote }) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-6 px-4 text-center border-b border-white/5">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Studio Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-widest uppercase mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Thư Báo Giá Chính Thức</span>
      </div>

      {/* Studio Brand Name */}
      <div className="mb-2">
        <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
          {quote.studioName}
        </h3>
        <h1 className="font-serif text-2xl sm:text-3xl text-white font-medium italic mt-1 tracking-tight">
          Proposal for Your Cherished Moments
        </h1>
      </div>

      {/* Personalized Greeting */}
      <div className="max-w-md mx-auto mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300">
        Kính gửi <span className="font-bold text-amber-200">{quote.clientName}</span>, cảm ơn hai bạn đã lựa chọn trao gửi khoảnh khắc quan trọng nhất cuộc đời cho chúng tôi.
      </div>
    </div>
  );
};
