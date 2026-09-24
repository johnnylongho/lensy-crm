import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight, MessageSquareQuote, Camera } from 'lucide-react';
import { CalendarEvent, BookingStatus } from '../../types';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { BookingFinancialCard } from './BookingFinancialCard';
import { generateGoogleCalendarUrl } from '../../lib/calendarIntegration';

interface Props {
  events: CalendarEvent[];
  onSelectEventDate: (dateStr: string) => void;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onOpenReceiptReview?: (booking: CalendarEvent) => void;
}

export const UpcomingShootsList: React.FC<Props> = ({
  events,
  onSelectEventDate,
  onSelectBooking,
  onStatusChange,
  onOpenDebtReminder,
  onOpenReceiptReview,
}) => {
  const sorted = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  return (
    <div className="w-full max-w-7xl mx-auto rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-5 sm:p-7 space-y-5 transition-all duration-300">
      <div className="flex items-center justify-between pb-4 border-b border-white/40 dark:border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 block mb-0.5">
            Dòng Chảy Lịch Trình & Quản Lý Trạng Thái
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Toàn Bộ Lịch Chụp Sắp Tới</h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-white/50 font-mono px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10">
          {events.length} sự kiện
        </span>
      </div>

      <div className="space-y-4">
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

          const isDeposit30 =
            ev.packagePrice > 0 && Math.abs(effectiveDeposit - ev.packagePrice * 0.3) < 1000;

          return (
            <div
              key={ev.id}
              className={`rounded-2xl border transition-all duration-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full p-5 text-xs ${statusTheme.cardBg} ${statusTheme.cardBorder}`}
            >
              {/* Cột 1 (Ngày tháng): flex-shrink-0 w-16 */}
              <div className="flex-shrink-0 w-16">
                <button
                  type="button"
                  onClick={() => onSelectEventDate(ev.eventDate)}
                  className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col items-center justify-center font-mono text-center hover:border-amber-400 transition-colors shadow-sm"
                  title="Nhấn để xem trên Lịch ngày này"
                >
                  <span className="text-[11px] text-slate-400 uppercase leading-none font-semibold">
                    Th{ev.eventDate.split('-')[1]}
                  </span>
                  <span className="text-lg font-bold text-white leading-tight mt-0.5">
                    {ev.eventDate.split('-')[2]}
                  </span>
                </button>
              </div>

              {/* Cột 2 (Thông tin Khách hàng & Giờ giấc): flex-1 min-w-[200px] */}
              <div className="flex-1 min-w-[200px] min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectBooking && onSelectBooking(ev)}
                    className="font-bold text-white text-base truncate hover:text-amber-400 hover:underline text-left transition-colors max-w-full"
                    title="Nhấn để xem chi tiết & Gắn thiết bị"
                  >
                    {ev.clientName}
                  </button>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase border bg-slate-900/90 border-slate-700 text-amber-300 flex-shrink-0">
                    {ev.sessionType}
                  </span>
                  {ev.assignedGears && ev.assignedGears.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold border bg-sky-950/80 border-sky-500/40 text-sky-300 flex items-center gap-1 flex-shrink-0">
                      <Camera className="w-3 h-3" />
                      <span>{ev.assignedGears.length} máy/lens</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-slate-300 text-xs">
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.startTime} - {ev.endTime}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0" title={ev.location}>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </span>
                </div>

                {/* Nút "Duyệt Biên Lai Cọc" nổi bật khi khách đã nộp bill */}
                {ev.status === 'cho_xac_nhan_coc' && onOpenReceiptReview && (
                  <div className="pt-1.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenReceiptReview(ev)}
                      className="py-1 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>🔎 Xem & Duyệt Bill Cọc ({ev.depositAmount.toLocaleString('vi-VN')} đ)</span>
                    </button>
                  </div>
                )}

                {/* USP 1: Nút "Nhắc thanh toán" nổi bật khi Đã trả file & còn nợ */}
                {isDebtReminderEligible && onOpenDebtReminder && (
                  <div className="pt-1.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenDebtReminder(ev)}
                      className="py-1 px-3 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      <span>Nhắc thanh toán ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Cột 3 (Tài chính tĩnh): flex-shrink-0 w-64 bg-white/5 p-3 rounded-lg */}
              <div className="flex-shrink-0 w-64 bg-white/5 dark:bg-white/5 p-3 rounded-lg border border-white/10 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-gray-400 text-xs font-sans">Tổng gói:</span>
                  <span className="font-bold text-white text-right">
                    {ev.packagePrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="text-gray-400 text-xs font-sans">Đã cọc:</span>
                  <span className="font-bold text-right flex items-center justify-end gap-1">
                    <span>{effectiveDeposit.toLocaleString('vi-VN')} đ</span>
                    {isDeposit30 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-sans">
                        30%
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-sans">Nợ đọng:</span>
                  <span className={`font-bold text-right ${remainingDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {remainingDebt === 0 ? '0 đ' : `${remainingDebt.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
              </div>

              {/* Cột 4 (Thao tác): flex-shrink-0 flex items-center gap-3 */}
              <div className="flex-shrink-0 flex items-center gap-3">
                {onSelectBooking && (
                  <button
                    type="button"
                    onClick={() => onSelectBooking(ev)}
                    className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    title="Xem chi tiết & Quản lý thiết bị cho show này"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gắn Thiết Bị</span>
                  </button>
                )}
                {onStatusChange && (
                  <BookingStatusSelect
                    status={ev.status}
                    onChange={newStatus => onStatusChange(ev.id, newStatus)}
                    size="md"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    const url = generateGoogleCalendarUrl({
                      title: `[Mirmia] Show Chụp ${ev.sessionType} - ${ev.clientName}`,
                      clientName: ev.clientName,
                      sessionType: ev.sessionType,
                      eventDate: ev.eventDate,
                      startTime: ev.startTime,
                      endTime: ev.endTime,
                      location: ev.location,
                      notes: ev.notes,
                      quoteToken: ev.quoteToken,
                      quoteUrl: `${window.location.origin}/quote/${ev.quoteToken || ''}`,
                    });
                    window.open(url, '_blank');
                  }}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors flex-shrink-0"
                  title="Đồng bộ show này lên Google Calendar"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectEventDate(ev.eventDate)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0"
                  title="Xem lịch chi tiết ngày này"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
