import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
}

export const QuoteSessionInfo: React.FC<Props> = ({ quote }) => {
  const isConfirmed = quote.status === 'da_chot' || quote.status === 'hoan_thanh';

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
      {/* Session Title & Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 block mb-1">
            Chi Tiết Gói Chụp
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {quote.sessionTitle}
          </h2>
        </div>

        <div>
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã Khóa Lịch
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> Chờ Khách Xác Nhận Cọc
            </span>
          )}
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Ngày Chụp</span>
            <span className="font-bold text-slate-100 text-sm">{quote.eventDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Khung Giờ</span>
            <span className="font-bold text-slate-100 text-sm">
              {quote.startTime} - {quote.endTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 block uppercase">Địa Điểm</span>
            <span className="font-bold text-slate-100 text-xs truncate block" title={quote.location}>
              {quote.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
