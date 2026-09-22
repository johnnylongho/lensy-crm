import React from 'react';
import { CalendarEvent, BookingStatus } from '../../types';
import { Calendar, ArrowRight, MapPin, Sparkles, MessageSquareQuote } from 'lucide-react';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { BookingFinancialCard } from './BookingFinancialCard';

interface Props {
  events: CalendarEvent[];
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
}

const COLUMNS: { status: BookingStatus; title: string; color: string; badge: string }[] = [
  {
    status: 'cho_coc',
    title: 'Chờ Cọc (Pending)',
    color: 'border-amber-700/40 bg-amber-950/10 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    status: 'da_chot',
    title: 'Đã Nhận Cọc (Confirmed)',
    color: 'border-emerald-700/40 bg-emerald-950/10 text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    status: 'da_tra_file',
    title: 'Đã Trả File (Delivered)',
    color: 'border-sky-700/40 bg-sky-950/10 text-sky-300',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  {
    status: 'hoan_thanh',
    title: 'Hoàn Thành (Completed)',
    color: 'border-purple-700/40 bg-purple-950/10 text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
];

const NEXT_STATUS_MAP: Partial<Record<BookingStatus, BookingStatus>> = {
  cho_coc: 'da_chot',
  da_chot: 'da_tra_file',
  da_tra_file: 'hoan_thanh',
};

export const KanbanView: React.FC<Props> = ({
  events,
  onStatusChange,
  onOpenDebtReminder,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
            Quy Trình Quản Lý Show & Dòng Tiền
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Bảng Kanban Tiến Độ Công Việc
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Realtime Supabase Sync</span>
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const colEvents = events.filter(e => e.status === col.status);
          const colTotalRevenue = colEvents.reduce((acc, e) => acc + e.packagePrice, 0);

          return (
            <div
              key={col.status}
              className={`rounded-2xl border p-3.5 flex flex-col h-full min-w-[260px] ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-900 border border-slate-700 text-slate-200">
                    {colEvents.length}
                  </span>
                </div>
              </div>

              {/* Subtotal of column */}
              <div className="mb-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>Tổng giá trị cột:</span>
                <span className="font-bold text-slate-300">
                  {colTotalRevenue.toLocaleString('vi-VN')} đ
                </span>
              </div>

              {/* Event Cards */}
              <div className="space-y-3 flex-1">
                {colEvents.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-slate-600">
                    Không có lịch chụp ở giai đoạn này
                  </div>
                ) : (
                  colEvents.map(item => {
                    const nextStatus = NEXT_STATUS_MAP[item.status];
                    const statusTheme = STATUS_CONFIG[item.status] || STATUS_CONFIG.cho_coc;

                    // Remaining Debt calculation
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

                    // Requirement 1: Điều kiện kích hoạt nút "Nhắc thanh toán":
                    // Trạng thái "Đã trả file" (da_tra_file) VÀ Số tiền nợ > 0
                    const isDebtReminderEligible =
                      item.status === 'da_tra_file' && remainingDebt > 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 shadow-lg space-y-3 text-xs ${statusTheme.cardBg} ${statusTheme.cardBorder}`}
                      >
                        {/* Card Header: Client Name & Session Tag */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <h4 className="font-bold text-white text-sm leading-snug">
                              {item.clientName}
                            </h4>
                            <span className="text-[10px] uppercase font-bold text-amber-400">
                              {item.sessionType}
                            </span>
                          </div>

                          {/* Quick Status Dropdown */}
                          {onStatusChange && (
                            <BookingStatusSelect
                              status={item.status}
                              onChange={newStatus => onStatusChange(item.id, newStatus)}
                              size="sm"
                            />
                          )}
                        </div>

                        {/* Date & Location */}
                        <div className="space-y-1 text-slate-300 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>
                              {item.eventDate} ({item.startTime} - {item.endTime})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>

                        {/* 3 Financial Metrics (Package Price, Deposit 30%, Remaining Debt) */}
                        <BookingFinancialCard
                          packagePrice={item.packagePrice}
                          depositAmount={item.depositAmount}
                          status={item.status}
                          paidAmount={item.paidAmount}
                          compact={true}
                        />

                        {/* USP 1: Nút "Nhắc thanh toán" nổi bật khi Đã trả file & còn nợ */}
                        {isDebtReminderEligible && onOpenDebtReminder && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => onOpenDebtReminder(item)}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 hover:shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <MessageSquareQuote className="w-4 h-4" />
                              <span>Nhắc thanh toán ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
                            </button>
                          </div>
                        )}

                        {/* Quick 1-click Forward Step Button */}
                        {nextStatus && onStatusChange && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">Bước tiếp theo:</span>
                            <button
                              type="button"
                              onClick={() => onStatusChange(item.id, nextStatus)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span>{STATUS_CONFIG[nextStatus].label}</span>
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
