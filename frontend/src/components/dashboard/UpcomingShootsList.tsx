import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { CalendarEvent, BookingStatus } from '../../types';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { BookingFinancialCard } from './BookingFinancialCard';

interface Props {
  events: CalendarEvent[];
  onSelectEventDate: (dateStr: string) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
}

export const UpcomingShootsList: React.FC<Props> = ({
  events,
  onSelectEventDate,
  onStatusChange,
  onOpenDebtReminder,
}) => {
  const sorted = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Dòng Chảy Lịch Trình & Quản Lý Trạng Thái
          </span>
          <h3 className="text-base font-bold text-white">Toàn Bộ Lịch Chụp Sắp Tới</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">{events.length} sự kiện</span>
      </div>

      <div className="space-y-3">
        {sorted.map(ev => {
          const statusTheme = STATUS_CONFIG[ev.status] || STATUS_CONFIG.cho_coc;

          // Remaining debt calculation
          const effectiveDeposit =
            ev.status === 'da_chot' && (!ev.depositAmount || ev.depositAmount === 0)
              ? Math.round(ev.packagePrice * 0.3)
              : ev.depositAmount;
          const effectivePaid =
            ev.status === 'hoan_thanh'
              ? ev.packagePrice
              : ev.paidAmount && ev.paidAmount > 0
              ? ev.paidAmount
              : effectiveDeposit;
          const remainingDebt = Math.max(0, ev.packagePrice - effectivePaid);

          const isDebtReminderEligible =
            ev.status === 'da_tra_file' && remainingDebt > 0;

          return (
            <div
              key={ev.id}
              className={`p-4 rounded-2xl border transition-all duration-200 shadow-md flex flex-col gap-3 text-xs ${statusTheme.cardBg} ${statusTheme.cardBorder}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left column: Date block + Client info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectEventDate(ev.eventDate)}
                    className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center justify-center font-mono text-center flex-shrink-0 hover:border-amber-400 transition-colors"
                    title="Nhấn để xem trên Lịch ngày này"
                  >
                    <span className="text-[10px] text-slate-400 uppercase leading-none">
                      Th{ev.eventDate.split('-')[1]}
                    </span>
                    <span className="text-sm font-bold text-white leading-tight">
                      {ev.eventDate.split('-')[2]}
                    </span>
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-sm truncate">{ev.clientName}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border bg-slate-900/90 border-slate-700 text-amber-300">
                        {ev.sessionType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {ev.startTime} - {ev.endTime}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[240px]">
                        <MapPin className="w-3 h-3 text-slate-400" /> {ev.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle column: Financial figures */}
                <div className="min-w-[220px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <BookingFinancialCard
                    packagePrice={ev.packagePrice}
                    depositAmount={ev.depositAmount}
                    status={ev.status}
                    paidAmount={ev.paidAmount}
                    compact={true}
                  />
                </div>

                {/* Right column: Status Selector Dropdown */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {onStatusChange && (
                    <BookingStatusSelect
                      status={ev.status}
                      onChange={newStatus => onStatusChange(ev.id, newStatus)}
                      size="md"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectEventDate(ev.eventDate)}
                    className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Xem lịch chi tiết ngày này"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* USP 1: Nút "Nhắc thanh toán" nổi bật khi Đã trả file & còn nợ */}
              {isDebtReminderEligible && onOpenDebtReminder && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-amber-300/80 font-medium">
                    Show đã trả file xong và còn nợ {remainingDebt.toLocaleString('vi-VN')} đ:
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenDebtReminder(ev)}
                    className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/60 hover:shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquareQuote className="w-4 h-4" />
                    <span>Nhắc thanh toán ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
