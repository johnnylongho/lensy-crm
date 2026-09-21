import React from 'react';
import { CalendarEvent, BookingStatus } from '../../types';
import { Calendar, DollarSign, ArrowRight, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
}

const COLUMNS: { status: BookingStatus; title: string; color: string; badge: string }[] = [
  {
    status: 'cho_coc',
    title: 'Chờ Cọc (Pending)',
    color: 'border-amber-700/40 bg-amber-950/10 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    status: 'da_chot',
    title: 'Đã Chốt (Confirmed)',
    color: 'border-indigo-700/40 bg-indigo-950/10 text-indigo-300',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  {
    status: 'da_tra_file',
    title: 'Đã Trả File (Delivered)',
    color: 'border-rose-700/40 bg-rose-950/10 text-rose-300',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  },
  {
    status: 'hoan_thanh',
    title: 'Hoàn Thành (Completed)',
    color: 'border-emerald-700/40 bg-emerald-950/10 text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  }
];

const NEXT_STATUS_MAP: Partial<Record<BookingStatus, BookingStatus>> = {
  cho_coc: 'da_chot',
  da_chot: 'da_tra_file',
  da_tra_file: 'hoan_thanh',
};

export const KanbanView: React.FC<Props> = ({ events, onStatusChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
            Quy Trình Quản Lý Show
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Bảng Kanban Tiến Độ Công Việc
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Realtime Supabase Sync</span>
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const colEvents = events.filter(e => e.status === col.status);

          return (
            <div
              key={col.status}
              className={`rounded-2xl border p-3.5 flex flex-col h-full min-w-[240px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-800 text-slate-300">
                  {colEvents.length}
                </span>
              </div>

              {/* Event Cards */}
              <div className="space-y-2.5 flex-1">
                {colEvents.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-slate-600">
                    Không có lịch chụp ở giai đoạn này
                  </div>
                ) : (
                  colEvents.map(item => {
                    const nextStatus = NEXT_STATUS_MAP[item.status];

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow space-y-2 text-xs transition-all"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-white text-xs leading-snug">{item.clientName}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${col.badge}`}>
                            {item.sessionType}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-400 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.eventDate} ({item.startTime})</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono">
                            <span>Giá: {item.packagePrice.toLocaleString('vi-VN')} đ</span>
                            <span className="text-amber-300 font-bold">
                              Cọc: {item.depositAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </div>

                        {nextStatus && onStatusChange && (
                          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onStatusChange(item.id, nextStatus)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              <span>Chuyển tiếp</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
