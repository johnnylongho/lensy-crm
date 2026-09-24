import React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Eye, MessageSquareQuote } from 'lucide-react';
import { CalendarEvent, BookingStatus } from '../../types';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { BookingFinancialCard } from './BookingFinancialCard';
import { generateGoogleCalendarUrl } from '../../lib/calendarIntegration';

interface Props {
  selectedDate: Date;
  events: CalendarEvent[];
  onViewQuote?: (eventId: string) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
}

export const DayShootsModal: React.FC<Props> = ({
  selectedDate,
  events,
  onViewQuote,
  onStatusChange,
  onSelectBooking,
  onOpenDebtReminder,
}) => {
  const dayEvents = events.filter(e => isSameDay(parseISO(e.eventDate), selectedDate));
  const formattedDate = format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi });

  return (
    <div className="rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-5 sm:p-6 space-y-4 transition-all duration-300">
      <div className="flex items-center justify-between pb-3 border-b border-white/40 dark:border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 block mb-0.5">
            Lịch Chi Tiết Theo Ngày
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white capitalize">
            {formattedDate}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 text-xs font-mono font-bold text-slate-700 dark:text-white/80">
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
            const statusTheme = STATUS_CONFIG[item.status] || STATUS_CONFIG.cho_coc;

            const effectiveDeposit =
              item.status === 'da_chot' && (!item.depositAmount || item.depositAmount === 0)
                ? Math.round(item.packagePrice * 0.3)
                : item.depositAmount;
            const effectivePaid =
              item.status === 'hoan_thanh'
                ? item.packagePrice
                : item.paidAmount && item.paidAmount > 0
                ? item.paidAmount
                : effectiveDeposit;
            const remainingDebt = Math.max(0, item.packagePrice - effectivePaid);

            const isDebtReminderEligible =
              item.status === 'da_tra_file' && remainingDebt > 0;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all duration-200 shadow-md space-y-3 ${statusTheme.cardBg} ${statusTheme.cardBorder}`}
              >
                {/* Header with Client Name & Status Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectBooking && onSelectBooking(item)}
                      className="font-bold text-white text-sm hover:text-amber-400 hover:underline text-left transition-colors"
                      title="Xem chi tiết & Gán thiết bị"
                    >
                      {item.clientName}
                    </button>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
                        {item.sessionType} Photography
                      </span>
                      {item.assignedGears && item.assignedGears.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold border bg-sky-950/80 border-sky-500/40 text-sky-300">
                          {item.assignedGears.length} thiết bị
                        </span>
                      )}
                    </div>
                  </div>

                  {onStatusChange && (
                    <BookingStatusSelect
                      status={item.status}
                      onChange={newStatus => onStatusChange(item.id, newStatus)}
                      size="sm"
                    />
                  )}
                </div>

                {/* Date & Location */}
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Thời gian: <strong>{item.startTime} - {item.endTime}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="truncate">Địa điểm: {item.location}</span>
                  </div>
                </div>

                {/* 3 Financial Metrics */}
                <BookingFinancialCard
                  packagePrice={item.packagePrice}
                  depositAmount={item.depositAmount}
                  status={item.status}
                  paidAmount={item.paidAmount}
                  compact={false}
                />

                {/* USP 1: Nút "Nhắc thanh toán" */}
                {isDebtReminderEligible && onOpenDebtReminder && (
                  <button
                    type="button"
                    onClick={() => onOpenDebtReminder(item)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquareQuote className="w-4 h-4" />
                    <span>Nhắc thanh toán ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
                  </button>
                )}

                {/* Action Buttons: View Quote & Google Calendar Sync */}
                <div className="pt-1 grid grid-cols-2 gap-2">
                  {onViewQuote && (
                    <button
                      type="button"
                      onClick={() => onViewQuote(item.id)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> Báo Giá
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateGoogleCalendarUrl({
                        title: `[Mirmia] Show Chụp ${item.sessionType} - ${item.clientName}`,
                        clientName: item.clientName,
                        sessionType: item.sessionType,
                        eventDate: item.eventDate,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        location: item.location,
                        notes: item.notes,
                        quoteToken: item.quoteToken,
                        quoteUrl: `${window.location.origin}/quote/${item.quoteToken || ''}`,
                      });
                      window.open(url, '_blank');
                    }}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    title="Đồng bộ vào Google Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> G-Calendar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
