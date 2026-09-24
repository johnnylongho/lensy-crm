import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { parseISO } from 'date-fns';
import { DashboardHeader } from './DashboardHeader';
import { CalendarView } from './CalendarView';
import { DayShootsModal } from './DayShootsModal';
import { UpcomingShootsList } from './UpcomingShootsList';
import { KanbanView } from './KanbanView';
import { DebtReminderModal } from './DebtReminderModal';
import { CreateQuoteModal } from './CreateQuoteModal';
import { WebhookSimulatorModal } from './WebhookSimulatorModal';
import { ReceiptReviewModal } from './ReceiptReviewModal';
import { BookingDetailModal } from './BookingDetailModal';
import { RoiProgressBar } from './RoiProgressBar';
import { ProfitTrendChart } from './ProfitTrendChart';
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
  const [activeReviewBooking, setActiveReviewBooking] =
    useState<CalendarEvent | null>(null);
  const [activeDetailBooking, setActiveDetailBooking] =
    useState<CalendarEvent | null>(null);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [isWebhookSimulatorOpen, setIsWebhookSimulatorOpen] = useState(false);
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

            const isBillPending =
              b.status === 'cho_xac_nhan_coc' ||
              (b.status === 'cho_coc' && b.notes && b.notes.includes('[BILL_PENDING]'));
            const status: BookingStatus = isBillPending ? 'cho_xac_nhan_coc' : (b.status as BookingStatus);
            let receiptImg: string | undefined = undefined;
            if (b.quote_token) {
              try {
                const stored = localStorage.getItem(`receipt_${b.quote_token}`);
                if (stored) receiptImg = stored;
              } catch (e) {}
            }

            return {
              id: b.id,
              clientName: b.client_name,
              clientPhone: b.client_phone || '',
              sessionType: b.session_type,
              eventDate: b.event_date,
              startTime: b.start_time?.substring(0, 5) || '08:00',
              endTime: b.end_time?.substring(0, 5) || '12:00',
              location: b.location || 'Tại Studio',
              status: status,
              packagePrice: pkgPrice,
              depositAmount: depAmount,
              paidAmount: paid,
              remainingAmount: rem,
              quoteToken: b.quote_token,
              notes: b.notes,
              receiptUrl: receiptImg,
              assignedGears: b.assigned_gears || [],
              expenses: Number(b.expenses || 0),
              expenseDetails: b.expense_details || [],
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

  // Cập nhật trạng thái show (đổi từ Mới hỏi -> Đã cọc -> Đã chụp -> Đang sửa ảnh -> Hoàn tất)
  // Đồng thời tự động cập nhật dòng tiền (30% cọc khi chuyển sang Đã cọc, tất toán khi Hoàn tất)
  const handleStatusChange = async (eventId: string, newStatus: BookingStatus) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    let updatedDeposit = targetEvent.depositAmount;
    let updatedPaid = targetEvent.paidAmount ?? 0;

    // Tự động tính 30% khi chuyển sang trạng thái "Đã cọc" (deposited / da_chot)
    if (newStatus === 'da_chot' || newStatus === 'deposited') {
      const deposit30 = Math.round(targetEvent.packagePrice * 0.3);
      updatedDeposit = targetEvent.depositAmount > 0 ? targetEvent.depositAmount : deposit30;
      updatedPaid = updatedDeposit;
    } else if (newStatus === 'hoan_thanh' || newStatus === 'done') {
      updatedPaid = targetEvent.packagePrice;
      if (updatedDeposit === 0) {
        updatedDeposit = Math.round(targetEvent.packagePrice * 0.3);
      }
    } else if (newStatus === 'cho_coc' || newStatus === 'lead') {
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
      message: `Đã chuyển sang trạng thái ${statusInfo.label}`,
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

  const handleOpenQuote = (eventId: string) => {
    const target = events.find(e => e.id === eventId);
    if (target?.quoteToken) {
      window.open(`/quote/${target.quoteToken}`, '_blank');
    } else if (onViewQuote) {
      onViewQuote(eventId);
    } else {
      window.open('/', '_blank');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7 sm:space-y-8 animate-fadeIn">
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

      {/* Modal Nhắc nợ tinh tế (USP 2) */}
      <DebtReminderModal
        isOpen={Boolean(activeDebtReminderBooking)}
        booking={activeDebtReminderBooking}
        onClose={() => setActiveDebtReminderBooking(null)}
        onCopied={msg => setToastNotification({ type: 'success', message: msg })}
      />

      {/* Modal Chi Tiết Booking & Gắn Thiết Bị / Quét Trùng Lặp (USP 2) */}
      <BookingDetailModal
        isOpen={Boolean(activeDetailBooking)}
        booking={activeDetailBooking}
        allBookings={events}
        onClose={() => setActiveDetailBooking(null)}
        onBookingUpdated={updated => {
          setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
          setActiveDetailBooking(updated);
        }}
        onOpenDebtReminder={b => {
          setActiveDetailBooking(null);
          setActiveDebtReminderBooking(b);
        }}
      />

      {/* Modal Tạo Báo Giá & Quét Xung Đột Thiết Bị (USP 1) */}
      <CreateQuoteModal
        isOpen={isCreateQuoteOpen}
        onClose={() => setIsCreateQuoteOpen(false)}
        existingEvents={events}
        onQuoteCreated={newEvent => {
          setEvents(prev => [newEvent, ...prev]);
          setToastNotification({
            type: 'success',
            message: `🎉 Đã tạo báo giá cho "${newEvent.clientName}" & cập nhật lịch trình!`,
          });
          fetchBookingsFromSupabase();
        }}
      />

      {/* Modal Giả Lập Webhook Biến Động Số Dư (Giai Đoạn 2) */}
      <WebhookSimulatorModal
        isOpen={isWebhookSimulatorOpen}
        onClose={() => setIsWebhookSimulatorOpen(false)}
        pendingBookings={events.filter(e => e.status === 'cho_coc' || e.status === 'cho_xac_nhan_coc')}
        onSuccess={result => {
          setToastNotification({
            type: 'success',
            message: `⚡ ${result.message}`,
          });
          fetchBookingsFromSupabase();
          if (result.bookingId) {
            setEvents(prev =>
              prev.map(e =>
                e.id === result.bookingId
                  ? {
                      ...e,
                      status: 'da_chot',
                      paidAmount: (e.paidAmount || 0) + (result.amount || 0),
                    }
                  : e
              )
            );
          }
        }}
      />

      {/* Modal Đối Soát & Duyệt Biên Lai Cọc Khách Hàng */}
      <ReceiptReviewModal
        isOpen={Boolean(activeReviewBooking)}
        booking={activeReviewBooking}
        onClose={() => setActiveReviewBooking(null)}
        onConfirmSuccess={updatedId => {
          setToastNotification({
            type: 'success',
            message: `🎉 Đã duyệt cọc thành công và khóa lịch chụp!`,
          });
          setEvents(prev =>
            prev.map(e =>
              e.id === updatedId
                ? {
                    ...e,
                    status: 'da_chot',
                    paidAmount: e.depositAmount,
                    remainingAmount: Math.max(0, e.packagePrice - e.depositAmount),
                  }
                : e
            )
          );
          fetchBookingsFromSupabase();
        }}
        onRejectRequest={rejectedId => {
          setToastNotification({
            type: 'error',
            message: `Đã yêu cầu khách hàng gửi lại ảnh biên lai.`,
          });
          setEvents(prev =>
            prev.map(e =>
              e.id === rejectedId ? { ...e, status: 'cho_coc' } : e
            )
          );
          fetchBookingsFromSupabase();
        }}
      />

      {/* Top Header & Key Metrics */}
      <DashboardHeader
        events={events}
        onOpenCreateQuote={() => setIsCreateQuoteOpen(true)}
        onOpenWebhookSimulator={() => setIsWebhookSimulatorOpen(true)}
        onOpenReceiptReview={booking => setActiveReviewBooking(booking)}
      />

      {/* ROI Progress Bar - Tiến Độ Hoàn Vốn Đầu Tư (Vị trí trên cùng nổi bật) */}
      <RoiProgressBar events={events} />

      {/* Biểu Đồ Xu Hướng Lợi Nhuận Ròng (Ưu tiên hiển thị Net Profit - Tiền thật bỏ túi) */}
      <ProfitTrendChart events={events} />

      {/* Control Bar: View Switcher (Calendar vs Kanban) & Realtime Status (Liquid Glass) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-4 p-3.5 sm:p-4 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300"
      >
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lưới Lịch Tháng (Calendar)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all duration-200 ${
              viewMode === 'kanban'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tiến Độ Công Việc (Kanban)</span>
          </button>
        </div>

        {/* Realtime Connection Indicator & Refresh Button */}
        <div className="flex items-center gap-2.5 text-xs">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Realtime: Đang Kết Nối</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Chế độ Demo Mock Store</span>
            </span>
          )}

          <button
            type="button"
            onClick={fetchBookingsFromSupabase}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all border border-white/40 dark:border-white/10 backdrop-blur-md shadow-sm active:scale-95"
            title="Làm mới dữ liệu từ Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Main Display: Calendar Mode vs Kanban Mode */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.35 }}
      >
        {viewMode === 'calendar' ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CalendarView
                  events={events}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <DayShootsModal
                    selectedDate={selectedDate}
                    events={events}
                    onViewQuote={handleOpenQuote}
                    onStatusChange={handleStatusChange}
                    onSelectBooking={setActiveDetailBooking}
                    onOpenDebtReminder={setActiveDebtReminderBooking}
                  />
                </div>
              </div>
            </div>

            {/* Toàn Bộ Lịch Chụp Sắp Tới: Container w-full max-w-7xl mx-auto dàn trải đều ra giữa màn hình */}
            <div className="w-full max-w-7xl mx-auto">
              <UpcomingShootsList
                events={events}
                onSelectEventDate={handleSelectEventDate}
                onSelectBooking={setActiveDetailBooking}
                onStatusChange={handleStatusChange}
                onOpenDebtReminder={setActiveDebtReminderBooking}
                onOpenReceiptReview={booking => setActiveReviewBooking(booking)}
              />
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <KanbanView
              events={events}
              onStatusChange={handleStatusChange}
              onSelectBooking={setActiveDetailBooking}
              onOpenDebtReminder={setActiveDebtReminderBooking}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};
