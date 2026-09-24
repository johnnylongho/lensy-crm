import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Tag } from 'lucide-react';
import { CalendarEvent } from '../../types';

interface Props {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarView: React.FC<Props> = ({ events, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-09-21')); // Default aligned with mock data

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Compute days matrix
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayEvents = (day: Date) => {
    return events.filter(e => isSameDay(parseISO(e.eventDate), day));
  };

  const getSessionBadgeColor = (type: string, status: string) => {
    if (status === 'cho_coc') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (status === 'da_tra_file') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    switch (type) {
      case 'wedding':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'lookbook':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'prewedding':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  const weekDayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-5 sm:p-7 space-y-5 transition-all duration-300">
      {/* Month Switcher Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: vi })}
            </h3>
            <span className="text-xs text-slate-500 dark:text-white/50">
              Nhấn vào ngày để xem chi tiết lịch chụp & trang thiết bị
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-white/80 transition-all active:scale-95 shadow-sm"
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-white/80 text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-white/80 transition-all active:scale-95 shadow-sm"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 dark:text-white/50 py-1 border-b border-white/40 dark:border-white/10">
        {weekDayNames.map(name => (
          <div key={name} className="py-1">{name}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, idx) => {
          const dayEvents = getDayEvents(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasShows = dayEvents.length > 0;

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                !isCurrentMonth
                  ? 'opacity-25 border-transparent bg-slate-900/5 dark:bg-white/[0.01]'
                  : 'bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm'
              } ${
                isSelected
                  ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-amber-500/10'
                  : hasShows
                  ? 'border-white/60 dark:border-white/15 hover:border-amber-400/50'
                  : 'border-white/30 dark:border-white/5 hover:border-white/50 dark:hover:border-white/10'
              }`}
            >
              {/* Day Number + Dots */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : hasShows
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {hasShows && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>

              {/* Show Labels on the Day */}
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 2).map(ev => (
                  <div
                    key={ev.id}
                    className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-lg border font-semibold truncate leading-tight ${getSessionBadgeColor(
                      ev.sessionType,
                      ev.status
                    )}`}
                    title={`${ev.clientName} (${ev.startTime} - ${ev.location})`}
                  >
                    {ev.clientName}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] text-slate-400 font-bold pl-1">
                    +{dayEvents.length - 2} show nữa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">Chú thích:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Wedding (Cưới)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Lookbook</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Pre-wedding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Chờ cọc</span>
        </div>
      </div>
    </div>
  );
};
