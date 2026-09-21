import React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle2, AlertCircle, Eye, ShieldAlert } from 'lucide-react';
import { CalendarEvent } from '../../types';

interface Props {
  selectedDate: Date;
  events: CalendarEvent[];
  onViewQuote?: (eventId: string) => void;
}

export const DayShootsModal: React.FC<Props> = ({ selectedDate, events, onViewQuote }) => {
  const dayEvents = events.filter(e => isSameDay(parseISO(e.eventDate), selectedDate));
  const formattedDate = format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi });

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Lịch Chi Tiết Theo Ngày
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white capitalize">
            {formattedDate}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-300">
          {dayEvents.length} show
        </span>
      </div>

      {dayEvents.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs space-y-1">
          <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
          <p className="font-semibold text-slate-400">Trống lịch cho ngày này.</p>
          <p className="text-[11px]">Bạn có thể nhận thêm lịch chụp mới hoặc sắp xếp nghỉ ngơi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents.map(item => {
            const isConfirmed = item.status === 'da_chot' || item.status === 'da_tra_file' || item.status === 'hoan_thanh';

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.clientName}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
                      {item.sessionType} Photography
                    </span>
                  </div>

                  <div>
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Đã Khóa Lịch
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" /> Chờ Khách Cọc
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Thời gian: <strong>{item.startTime} - {item.endTime}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="truncate">Địa điểm: {item.location}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-mono text-xs">
                    <span className="text-slate-400">Giá gói:</span>
                    <span className="text-white font-bold">{item.packagePrice.toLocaleString('vi-VN')} đ</span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs text-amber-300">
                    <span className="text-slate-400">Tiền cọc:</span>
                    <span className="font-bold">{item.depositAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                {onViewQuote && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onViewQuote(item.id)}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem Link Báo Giá Của Show Này
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
