import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
}

export const QuoteSessionInfo: React.FC<Props> = ({ quote }) => {
  const isConfirmed = quote.status === 'da_chot' || quote.status === 'hoan_thanh';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-2 flex flex-col justify-between h-full break-inside-avoid print:break-inside-avoid print:m-0">
      {/* Session Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5 print:pb-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
            Chi Tiết Lịch Trình
          </span>
          <h2 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide print:text-xs">
            {quote.sessionTitle || `Gói Chụp ${quote.sessionType}`}
          </h2>
        </div>

        <div>
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã Khóa Lịch
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold">
              <AlertCircle className="w-3 h-3 text-orange-600" /> Chờ Khách Xác Nhận Cọc
            </span>
          )}
        </div>
      </div>

      {/* Meta Grid / List */}
      <div className="space-y-1.5 text-xs print:text-[11px] flex-1 flex flex-col justify-around">
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1 rounded-md bg-orange-100/70 text-orange-600 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Ngày Chụp:</span>
            <span className="font-bold text-slate-900">{quote.eventDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1 rounded-md bg-orange-100/70 text-orange-600 flex-shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Khung Giờ:</span>
            <span className="font-bold text-slate-900">
              {quote.startTime || '08:00'} - {quote.endTime || '12:00'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          <div className="p-1 rounded-md bg-orange-100/70 text-orange-600 flex-shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[11px] text-slate-500 font-medium flex-shrink-0 mr-1.5">Địa Điểm:</span>
            <span className="font-bold text-slate-900 truncate block text-right" title={quote.location || 'Tại Studio'}>
              {quote.location || 'Tại Studio'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
