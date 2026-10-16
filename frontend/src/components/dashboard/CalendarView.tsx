import React, { useState, useMemo } from 'react';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '../../types';

interface Props {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenCreateQuote?: () => void;
}

// 4 bảng màu pastel nhẹ nhàng chuẩn theo thiết kế hình mẫu
const PASTEL_THEMES = [
  {
    bg: 'bg-[#eaf4fd] dark:bg-sky-950/40',
    border: 'border-l-[3.5px] border-[#0284c7]',
    title: 'text-[#0369a1] dark:text-sky-200',
    time: 'text-[#0284c7]/80 dark:text-sky-300/70',
  },
  {
    bg: 'bg-[#fef4e6] dark:bg-amber-950/40',
    border: 'border-l-[3.5px] border-[#d97706]',
    title: 'text-[#b45309] dark:text-amber-200',
    time: 'text-[#d97706]/80 dark:text-amber-300/70',
  },
  {
    bg: 'bg-[#ebf8ee] dark:bg-emerald-950/40',
    border: 'border-l-[3.5px] border-[#16a34a]',
    title: 'text-[#15803d] dark:text-emerald-200',
    time: 'text-[#16a34a]/80 dark:text-emerald-300/70',
  },
  {
    bg: 'bg-[#f5eeff] dark:bg-purple-950/40',
    border: 'border-l-[3.5px] border-[#9333ea]',
    title: 'text-[#7e22ce] dark:text-purple-200',
    time: 'text-[#9333ea]/80 dark:text-purple-300/70',
  },
];

// Trục thời gian từ 07:00 đến 18:00
const START_HOUR = 7;
const END_HOUR = 18;
const HOUR_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const HOUR_HEIGHT = 64; // Chiều cao mỗi khung giờ (px)

export const CalendarView: React.FC<Props> = ({
  events,
  selectedDate,
  onSelectDate,
  onSelectBooking,
  onOpenCreateQuote,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());

  // Điều hướng Tuần
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onSelectDate(today);
  };

  // Thứ trong tuần theo chuẩn tiếng Việt: T2, T3, T4, T5, T6, T7, CN
  const getDayShortLabel = (index: number) => {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return labels[index] || '';
  };

  // Chọn màu pastel dựa trên loại hình hoặc id sự kiện
  const getEventPastelTheme = (ev: CalendarEvent, idx: number) => {
    const cat = (ev.category || ev.sessionType || '').toLowerCase();
    if (cat.includes('wedding') || cat.includes('cưới') || cat.includes('outdoor') || cat.includes('event')) {
      return PASTEL_THEMES[0]; // Sky Blue
    }
    if (cat.includes('makeup') || cat.includes('cà phê') || cat.includes('họp') || cat.includes('sửa')) {
      return PASTEL_THEMES[1]; // Warm Amber
    }
    if (cat.includes('sinh nhật') || cat.includes('kỷ yếu') || cat.includes('gia đình') || cat.includes('bé')) {
      return PASTEL_THEMES[2]; // Soft Emerald
    }
    return PASTEL_THEMES[idx % PASTEL_THEMES.length];
  };

  // Parse thời gian ra tọa độ top & chiều cao
  const calculatePosition = (startTimeStr?: string, endTimeStr?: string) => {
    let startH = 9;
    let startM = 0;
    if (startTimeStr && startTimeStr.includes(':')) {
      const parts = startTimeStr.split(':');
      startH = parseInt(parts[0], 10) || 9;
      startM = parseInt(parts[1], 10) || 0;
    }

    let endH = startH + 1;
    let endM = startM + 30;
    if (endTimeStr && endTimeStr.includes(':')) {
      const parts = endTimeStr.split(':');
      endH = parseInt(parts[0], 10) || (startH + 1);
      endM = parseInt(parts[1], 10) || 0;
    }

    const startTotalMinutes = (startH - START_HOUR) * 60 + startM;
    const endTotalMinutes = (endH - START_HOUR) * 60 + endM;
    const durationMinutes = Math.max(35, endTotalMinutes - startTotalMinutes);

    const top = Math.max(0, (startTotalMinutes / 60) * HOUR_HEIGHT);
    const height = Math.max(40, (durationMinutes / 60) * HOUR_HEIGHT);

    return { top, height };
  };

  // Lọc sự kiện cho 1 ngày cụ thể
  const getDayEvents = (day: Date) => {
    return events.filter(e => {
      try {
        return isSameDay(parseISO(e.eventDate), day);
      } catch {
        return false;
      }
    });
  };

  // Logic chế độ xem Tháng
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const monthCalendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthCalendarStart, end: monthCalendarEnd });

  return (
    <div className="w-full bg-white dark:bg-[#181a20] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden select-none">
      
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (NAVIGATION BAR) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Nút lùi, Hôm nay, Nút tiến */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 h-8 rounded-lg border border-gray-200 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tiêu đề Tuần / Tháng */}
          <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
            {viewMode === 'week' ? (
              `Tuần ${format(weekStart, 'dd/MM')} – ${format(weekEnd, 'dd/MM/yyyy')}`
            ) : (
              format(currentDate, 'MMMM yyyy', { locale: vi })
            )}
          </h2>
        </div>

        {/* Chuyển đổi chế độ Tuần / Tháng */}
        <div className="flex items-center self-end sm:self-auto p-1 rounded-xl bg-gray-100 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tuần
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* 2. CHẾ ĐỘ XEM THỜI KHÓA BIỂU TUẦN (WEEKLY TIMETABLE VIEW) */}
      {viewMode === 'week' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            
            {/* Header các ngày trong tuần */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-100 dark:border-zinc-800">
              {/* Ô trống góc trên bên trái */}
              <div className="p-3 border-r border-gray-100 dark:border-zinc-800" />

              {/* 7 Cột Ngày T2 -> CN */}
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isHighlight = isToday || isSelected;

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectDate(day)}
                    className={`py-2.5 px-1 text-center border-r border-gray-100 dark:border-zinc-800 transition-colors cursor-pointer ${
                      isHighlight
                        ? 'bg-purple-50/40 dark:bg-purple-950/20'
                        : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-gray-400 dark:text-zinc-400 uppercase tracking-wide">
                      {getDayShortLabel(idx)}
                    </div>
                    <div className="mt-1 flex items-center justify-center">
                      <span
                        className={`text-sm font-semibold inline-flex items-center justify-center ${
                          isHighlight
                            ? 'w-7 h-7 rounded-full bg-[#9333ea] text-white shadow-sm font-bold'
                            : 'text-gray-800 dark:text-zinc-200'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lưới Giờ & Thẻ Lịch Chụp */}
            <div className="relative grid grid-cols-[64px_repeat(7,1fr)]">
              
              {/* Cột Trục Giờ Bên Trái */}
              <div className="border-r border-gray-100 dark:border-zinc-800">
                {HOUR_SLOTS.map(hour => (
                  <div
                    key={hour}
                    className="h-16 pr-3 flex items-start justify-end text-[11px] font-mono text-gray-400 dark:text-zinc-500 pt-0.5 border-b border-gray-100 dark:border-zinc-800/80"
                  >
                    {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                  </div>
                ))}
              </div>

              {/* 7 Cột Nội Dung Sự Kiện Ngày */}
              {weekDays.map((day, dayIdx) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isHighlight = isToday || isSelected;
                const dayEvents = getDayEvents(day);

                return (
                  <div
                    key={dayIdx}
                    className={`relative border-r border-gray-100 dark:border-zinc-800 transition-colors ${
                      isHighlight ? 'bg-purple-50/30 dark:bg-purple-950/15' : ''
                    }`}
                    style={{ height: `${HOUR_SLOTS.length * HOUR_HEIGHT}px` }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget && onSelectDate) {
                        onSelectDate(day);
                      }
                    }}
                  >
                    {/* Các đường kẻ ngang phân cách từng giờ */}
                    {HOUR_SLOTS.map(hour => (
                      <div
                        key={hour}
                        className="h-16 border-b border-gray-100 dark:border-zinc-800/80"
                      />
                    ))}

                    {/* Render các thẻ sự kiện lịch chụp */}
                    {dayEvents.map((ev, evIdx) => {
                      const { top, height } = calculatePosition(ev.startTime, ev.endTime);
                      const theme = getEventPastelTheme(ev, evIdx);

                      // Tính toán xếp tầng nếu trùng giờ trong ngày
                      const overlappingBefore = dayEvents.filter((other, oIdx) => {
                        if (oIdx >= evIdx) return false;
                        const otherPos = calculatePosition(other.startTime, other.endTime);
                        return Math.abs(otherPos.top - top) < 40;
                      });

                      const isOffset = overlappingBefore.length > 0;
                      const cardWidth = isOffset ? 'calc(50% - 4px)' : 'calc(100% - 6px)';
                      const cardLeft = isOffset ? 'calc(50% + 2px)' : '3px';

                      const displayTitle = ev.sessionTitle || ev.clientName || ev.category || 'Lịch chụp';
                      const displayTime = `${ev.startTime || '09:00'} – ${ev.endTime || '10:30'}`;

                      return (
                        <div
                          key={ev.id || evIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectBooking) {
                              onSelectBooking(ev);
                            } else {
                              onSelectDate(day);
                            }
                          }}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            width: cardWidth,
                            left: cardLeft,
                          }}
                          className={`absolute z-10 rounded-xl p-2.5 flex flex-col justify-start overflow-hidden cursor-pointer shadow-xs hover:shadow-md hover:brightness-95 transition-all ${theme.bg} ${theme.border}`}
                          title={`${displayTitle} (${displayTime})`}
                        >
                          <div className={`text-xs font-semibold leading-tight truncate ${theme.title}`}>
                            {displayTitle}
                          </div>
                          <div className={`text-[11px] font-mono mt-0.5 leading-none ${theme.time}`}>
                            {displayTime}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 3. CHẾ ĐỘ XEM THÁNG (MONTH CALENDAR GRID) */
        <div className="p-4 sm:p-6 space-y-3">
          {/* Thứ trong tuần */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 dark:text-zinc-500 pb-2 border-b border-gray-100 dark:border-zinc-800">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(name => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* Lưới các ngày trong tháng */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {monthDays.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const hasShows = dayEvents.length > 0;
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectDate(day);
                    setCurrentDate(day);
                  }}
                  className={`min-h-[85px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    !isCurrentMonth
                      ? 'opacity-30 border-transparent bg-gray-50/50 dark:bg-zinc-800/20'
                      : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600'
                  } ${
                    isSelected
                      ? 'ring-2 ring-purple-500 border-transparent bg-purple-50/30 dark:bg-purple-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#9333ea] text-white'
                          : hasShows
                          ? 'bg-slate-800 text-white dark:bg-zinc-700'
                          : 'text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {hasShows && (
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                        {dayEvents.length} show
                      </span>
                    )}
                  </div>

                  {/* Danh sách ca chụp tóm tắt */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev, i) => (
                      <div
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 truncate font-medium"
                      >
                        {ev.startTime ? `${ev.startTime} ` : ''}{ev.clientName}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-gray-400 font-mono">
                        +{dayEvents.length - 2} ca nữa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
