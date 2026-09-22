import React, { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { DashboardHeader } from './DashboardHeader';
import { CalendarView } from './CalendarView';
import { DayShootsModal } from './DayShootsModal';
import { UpcomingShootsList } from './UpcomingShootsList';
import { KanbanView } from './KanbanView';
import { DebtReminderModal } from './DebtReminderModal';
import { CalendarEvent, BookingStatus } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { STATUS_CONFIG } from './BookingStatusSelect';
import { Calendar, Kanban, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  onViewQuote: (eventId: string) => void;
  onRefreshEvents?: () => void;
}

export const PhotographerDashboard: React.FC<Props> = ({
  events: initialEvents,
  onViewQuote,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-09-25'));
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDebtReminderBooking, setActiveDebtReminderBooking] =
    useState<CalendarEvent | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto hide toast after 4s
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Hàm fetch danh sách lịch chụp từ Supabase
  const fetchBookingsFromSupabase = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('event_date', { ascending: true });

        if (error) {
          console.warn('Lỗi truy vấn Supabase:', error.message);
          return;
        }

        if (data && data.length > 0) {
          const mappedEvents: CalendarEvent[] = data.map((b: any) => {
            const pkgPrice = Number(b.package_price || 0);
            const depAmount = Number(b.deposit_amount || 0);
            const paid = Number(b.paid_amount || 0);
            const rem = Number(
              b.remaining_amount !== undefined && b.remaining_amount !== null
                ? b.remaining_amount
                : pkgPrice - paid
            );

            return {
              id: b.id,
              clientName: b.client_name,
              sessionType: b.session_type,
              eventDate: b.event_date,
              startTime: b.start_time?.substring(0, 5) || '08:00',
              endTime: b.end_time?.substring(0, 5) || '12:00',
              location: b.location || 'Tại Studio',
              status: b.status as BookingStatus,
              packagePrice: pkgPrice,
              depositAmount: depAmount,
              paidAmount: paid,
              remainingAmount: rem,
            };
          });
          setEvents(mappedEvents);
        }
      }
    } catch (err) {
      console.error('Không thể kết nối Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Thiết lập Supabase Fetch và Realtime Subscription khi component mount
  useEffect(() => {
    fetchBookingsFromSupabase();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('realtime:bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          payload => {
            console.log('[Supabase Realtime] Thay đổi dữ liệu:', payload);
            fetchBookingsFromSupabase();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Cập nhật khi props thay đổi
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Cập nhật trạng thái show (đổi từ Chờ cọc -> Đã chốt -> Đã trả file...)
  // Đồng thời tự động cập nhật dòng tiền (30% cọc khi chuyển sang Đã nhận cọc, nợ đọng)
  const handleStatusChange = async (eventId: string, newStatus: BookingStatus) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    let updatedDeposit = targetEvent.depositAmount;
    let updatedPaid = targetEvent.paidAmount ?? 0;

    // Tự động tính 30% khi chuyển sang trạng thái "Đã nhận cọc"
    if (newStatus === 'da_chot') {
      const deposit30 = Math.round(targetEvent.packagePrice * 0.3);
      updatedDeposit = targetEvent.depositAmount > 0 ? targetEvent.depositAmount : deposit30;
      updatedPaid = updatedDeposit;
    } else if (newStatus === 'hoan_thanh') {
      updatedPaid = targetEvent.packagePrice;
      if (updatedDeposit === 0) {
        updatedDeposit = Math.round(targetEvent.packagePrice * 0.3);
      }
    } else if (newStatus === 'cho_coc') {
      updatedPaid = 0;
    }

    const updatedRemaining = Math.max(0, targetEvent.packagePrice - updatedPaid);

    // 1. Cập nhật UI lạc quan (Optimistic update)
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId
          ? {
              ...e,
              status: newStatus,
              depositAmount: updatedDeposit,
              paidAmount: updatedPaid,
              remainingAmount: updatedRemaining,
            }
          : e
      )
    );

    const statusInfo = STATUS_CONFIG[newStatus] || { label: newStatus };
    setToastNotification({
      type: 'success',
      message: `Đã đổi trạng thái "${targetEvent.clientName}" ➔ ${statusInfo.label} (Cọc: ${updatedDeposit.toLocaleString('vi-VN')} đ | Nợ: ${updatedRemaining.toLocaleString('vi-VN')} đ)`,
    });

    // 2. Viết hàm UPDATE của Supabase: Cập nhật status, deposit_amount, paid_amount
    if (isSupabaseConfigured) {
      try {
        const updatePayload: any = {
          status: newStatus,
          deposit_amount: updatedDeposit,
          paid_amount: updatedPaid,
        };

        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', eventId);

        if (error) throw error;
      } catch (err: any) {
        console.error('Lỗi khi update status trên Supabase:', err);
        setToastNotification({
          type: 'error',
          message: `Lỗi đồng bộ Supabase: ${err.message || 'Kiểm tra lại kết nối mạng'}`,
        });
        // Rollback nếu có lỗi
        fetchBookingsFromSupabase();
      }
    }
  };

  const handleSelectEventDate = (dateStr: string) => {
    setSelectedDate(parseISO(dateStr));
    setViewMode('calendar');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`p-3.5 px-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border backdrop-blur-md ${
              toastNotification.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toastNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{toastNotification.message}</span>
          </div>
        </div>
      )}

      {/* Modal Nhắc nợ tinh tế (USP 1) */}
      <DebtReminderModal
        isOpen={Boolean(activeDebtReminderBooking)}
        booking={activeDebtReminderBooking}
        onClose={() => setActiveDebtReminderBooking(null)}
        onCopied={msg => setToastNotification({ type: 'success', message: msg })}
      />

      {/* Top Header & Key Metrics */}
      <DashboardHeader events={events} />

      {/* Control Bar: View Switcher (Calendar vs Kanban) & Realtime Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lưới Lịch Tháng (Calendar)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tiến Độ Công Việc (Kanban)</span>
          </button>
        </div>

        {/* Realtime Connection Indicator & Refresh Button */}
        <div className="flex items-center gap-2 text-xs">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Realtime: Đang Kết Nối</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Chế độ Demo Mock Store</span>
            </span>
          )}

          <button
            type="button"
            onClick={fetchBookingsFromSupabase}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Làm mới dữ liệu từ Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Display: Calendar Mode vs Kanban Mode */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-2 space-y-6">
            <CalendarView
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <UpcomingShootsList
              events={events}
              onSelectEventDate={handleSelectEventDate}
              onStatusChange={handleStatusChange}
              onOpenDebtReminder={setActiveDebtReminderBooking}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <DayShootsModal
                selectedDate={selectedDate}
                events={events}
                onViewQuote={onViewQuote}
                onStatusChange={handleStatusChange}
                onOpenDebtReminder={setActiveDebtReminderBooking}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <KanbanView
            events={events}
            onStatusChange={handleStatusChange}
            onOpenDebtReminder={setActiveDebtReminderBooking}
          />
        </div>
      )}
    </div>
  );
};
