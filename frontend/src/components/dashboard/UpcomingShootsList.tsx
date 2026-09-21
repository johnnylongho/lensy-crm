import React from 'react';
import { Calendar, Clock, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { CalendarEvent } from '../../types';

interface Props {
  events: CalendarEvent[];
  onSelectEventDate: (dateStr: string) => void;
}

export const UpcomingShootsList: React.FC<Props> = ({ events, onSelectEventDate }) => {
  const sorted = [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Dòng Chảy Lịch Trình
          </span>
          <h3 className="text-base font-bold text-white">Toàn Bộ Lịch Chụp Sắp Tới</h3>
        </div>
        <span className="text-xs text-slate-400">{events.length} sự kiện</span>
      </div>

      <div className="space-y-2.5">
        {sorted.map(ev => {
          const isPending = ev.status === 'cho_coc';

          return (
            <div
              key={ev.id}
              onClick={() => onSelectEventDate(ev.eventDate)}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center font-mono text-center flex-shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase leading-none">
                    {ev.eventDate.split('-')[1]}
                  </span>
                  <span className="text-sm font-bold text-white leading-tight">
                    {ev.eventDate.split('-')[2]}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{ev.clientName}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isPending ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {ev.sessionType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {ev.startTime} - {ev.endTime}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-slate-500" /> {ev.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-white">
                    {ev.packagePrice.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Cọc: {ev.depositAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
