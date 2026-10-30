import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DayAvailability, ShiftType } from '../../lib/availabilityService';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  selectedShift: ShiftType;
  onSelectShift: (shift: ShiftType) => void;
  availabilityMap: Map<string, DayAvailability>;
  isLoading?: boolean;
  minDate?: string;
  studioName?: string;
}

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export const InteractiveAvailabilityCalendar: React.FC<Props> = ({
  selectedDate,
  onSelectDate,
  selectedShift,
  onSelectShift,
  availabilityMap,
  isLoading = false,
  minDate,
  studioName,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const effectiveMinDate = minDate || todayStr;

  // Khởi tạo tháng xem: ưu tiên tháng của ngày đã chọn hoặc tháng hiện tại
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Chuyển sang tháng trước
  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (prev >= minMonth) {
      setCurrentMonth(prev);
    }
  };

  // Chuyển sang tháng tiếp theo
  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Kiểm tra nút lùi tháng có bị vô hiệu hoá không (không cho xem tháng quá khứ)
  const isPrevDisabled = useMemo(() => {
    const currentView = new Date(year, month, 1);
    const currentActual = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentView <= currentActual;
  }, [year, month, today]);

  // Tính toán lưới các ô ngày trong tháng (theo chuẩn Thứ 2 đầu tuần)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    let startDay = firstDayOfMonth.getDay() - 1; // 0: Thứ 2 ... 6: Chủ Nhật
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      availability?: DayAvailability;
    }> = [];

    // Padding ô trống đầu tháng
    for (let i = 0; i < startDay; i++) {
      cells.push({
        dateStr: `pad-prev-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
      });
    }

    // Các ngày thực tế trong tháng
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateStr < effectiveMinDate;
      const isToday = dateStr === todayStr;
      const availability = availabilityMap.get(dateStr);

      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isPast,
        isToday,
        availability,
      });
    }

    return cells;
  }, [year, month, effectiveMinDate, todayStr, availabilityMap]);

  // Thông tin ngày đang chọn
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    return availabilityMap.get(selectedDate);
  }, [selectedDate, availabilityMap]);

  // Định dạng ngày đã chọn hiển thị thân thiện (VD: Thứ Bảy, 15/11/2026)
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const parts = selectedDate.split('-');
      if (parts.length !== 3) return selectedDate;
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = dayNames[d.getDay()];
      return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 p-4 sm:p-5 transition-colors">
      {/* Calendar Header: Month Navigator & Status Indicator */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            {MONTH_NAMES[month]} {year}
          </h4>
          {isLoading && (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 animate-pulse">
              (Đang đồng bộ lịch...)
            </span>
          )}
        </div>

        {/* Previous / Next Month Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className={`p-1.5 rounded-lg border transition-all ${
              isPrevDisabled
                ? 'opacity-30 cursor-not-allowed border-transparent text-slate-400'
                : 'border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
            }`}
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div
            key={day}
            className={`text-[11px] font-semibold py-1 ${
              idx >= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return <div key={cell.dateStr || idx} className="h-10 sm:h-11" />;
          }

          const isSelected = selectedDate === cell.dateStr;
          const isFullDayBlocked = cell.availability?.isFullDayBlocked;
          const hasPartialBooking =
            cell.availability &&
            !isFullDayBlocked &&
            (!cell.availability.morningAvailable || !cell.availability.afternoonAvailable);

          const isDisabled = cell.isPast || isFullDayBlocked;

          let cellClasses =
            'h-10 sm:h-11 relative rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-150 select-none';

          if (isDisabled) {
            if (cell.isPast) {
              cellClasses += ' opacity-30 cursor-not-allowed text-slate-400 dark:text-zinc-600';
            } else {
              // Kín lịch
              cellClasses +=
                ' opacity-50 cursor-not-allowed bg-rose-500/10 text-rose-500 dark:text-rose-400 line-through';
            }
          } else if (isSelected) {
            cellClasses +=
              ' bg-orange-600 text-white font-bold ring-2 ring-orange-500/50 shadow-md shadow-orange-600/30 scale-105 z-10';
          } else {
            // Còn trống hoặc còn ca
            cellClasses +=
              ' bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/5 hover:border-orange-500/60 hover:bg-orange-500/5 cursor-pointer text-slate-800 dark:text-zinc-200';
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  onSelectDate(cell.dateStr);
                }
              }}
              className={cellClasses}
              title={
                cell.isPast
                  ? 'Ngày trong quá khứ'
                  : isFullDayBlocked
                  ? 'Đã kín lịch chụp (Có khách đã cọc)'
                  : hasPartialBooking
                  ? 'Còn 1 ca chụp (Sáng hoặc Chiều)'
                  : 'Còn trống lịch'
              }
            >
              <span>{cell.dayNum}</span>

              {/* Status indicator dot / badge */}
              {!cell.isPast && (
                <div className="absolute bottom-1 flex items-center justify-center gap-0.5">
                  {isFullDayBlocked ? (
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                  ) : hasPartialBooking ? (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-amber-400'
                      }`}
                    />
                  ) : (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-500/80'
                      }`}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend (Chú thích màu) */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>Còn ca (Sáng/Chiều)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>Đã kín lịch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-600 inline-block" />
          <span>Ngày bạn chọn</span>
        </div>
      </div>

      {/* Shift / Ca Chụp Selector (Xuất hiện khi khách đã chọn ngày) */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Chọn Ca Chụp:</span>
            </span>
            <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
              {formattedSelectedDate}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Ca Sáng */}
            {(() => {
              const isMorningDisabled = selectedDayInfo?.morningAvailable === false;
              const isSelected = selectedShift === 'morning';
              return (
                <button
                  type="button"
                  disabled={isMorningDisabled}
                  onClick={() => onSelectShift('morning')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isMorningDisabled
                      ? 'opacity-40 cursor-not-allowed bg-rose-500/5 border-rose-500/20 text-slate-400 dark:text-zinc-600'
                      : isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 hover:border-orange-500/50 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">Buổi Sáng</span>
                    {isMorningDisabled ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">
                        Đã có khách
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        Sẵn sàng
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 ${
                      isSelected ? 'text-orange-100' : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    08:00 - 12:00
                  </span>
                </button>
              );
            })()}

            {/* Ca Chiều */}
            {(() => {
              const isAfternoonDisabled = selectedDayInfo?.afternoonAvailable === false;
              const isSelected = selectedShift === 'afternoon';
              return (
                <button
                  type="button"
                  disabled={isAfternoonDisabled}
                  onClick={() => onSelectShift('afternoon')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isAfternoonDisabled
                      ? 'opacity-40 cursor-not-allowed bg-rose-500/5 border-rose-500/20 text-slate-400 dark:text-zinc-600'
                      : isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 hover:border-orange-500/50 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">Buổi Chiều</span>
                    {isAfternoonDisabled ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">
                        Đã có khách
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        Sẵn sàng
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 ${
                      isSelected ? 'text-orange-100' : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    13:30 - 17:30
                  </span>
                </button>
              );
            })()}

            {/* Cả Ngày */}
            {(() => {
              const isFullDayDisabled =
                selectedDayInfo?.morningAvailable === false ||
                selectedDayInfo?.afternoonAvailable === false;
              const isSelected = selectedShift === 'full_day';
              return (
                <button
                  type="button"
                  disabled={isFullDayDisabled}
                  onClick={() => onSelectShift('full_day')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isFullDayDisabled
                      ? 'opacity-40 cursor-not-allowed bg-rose-500/5 border-rose-500/20 text-slate-400 dark:text-zinc-600'
                      : isSelected
                      ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 hover:border-orange-500/50 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">Cả Ngày</span>
                    {isFullDayDisabled ? (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500 font-semibold">
                        Vướng 1 ca
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        Trọn vẹn
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 ${
                      isSelected ? 'text-orange-100' : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    08:00 - 17:00
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

