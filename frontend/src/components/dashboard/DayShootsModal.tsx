import React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Eye, MessageSquareQuote } from 'lucide-react';
import { CalendarEvent, BookingStatus } from '../../types';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { BookingFinancialCard } from './BookingFinancialCard';

interface Props {
  selectedDate: Date;
  events: CalendarEvent[];
  onViewQuote?: (eventId: string) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
}

export const DayShootsModal: React.FC<Props> = ({
  selectedDate,
  events,
  onViewQuote,
  onStatusChange,
  onOpenDebtReminder,
}) => {
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
                  <div>
                    <h4 className="font-bold text-white text-sm">{item.clientName}</h4>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
                      {item.sessionType} Photography
                    </span>
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

                {/* View Quote Link Button */}
                {onViewQuote && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onViewQuote(item.id)}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> Xem Thư Báo Giá (Quote Link)
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
