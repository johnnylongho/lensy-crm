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

      {/* Studio Brand Logo & Badge */}
      <div className="flex flex-col items-center justify-center gap-2 mb-3">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-red-500/30 shadow-xl shadow-red-950/40 p-0.5 bg-gradient-to-b from-red-900/60 to-black">
          <img
            src="/mirmia-logo.png"
            alt="Mirmia Studio & Academy"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-[11px] font-medium tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Thư Báo Giá Chính Thức • Powered by Lensy</span>
        </div>
      </div>

      {/* Studio Brand Name */}
      <div className="mb-2">
        <h3 className="text-sm uppercase tracking-[0.25em] text-white font-extrabold">
          {quote.studioName}
        </h3>
        <h1 className="font-serif text-2xl sm:text-3xl text-amber-200/95 font-medium italic mt-1 tracking-tight">
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
