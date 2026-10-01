import React from 'react';
import { CalendarEvent } from '../../types';
import { Trash2, AlertTriangle, Calendar, User, DollarSign, X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  booking: CalendarEvent | null;
  onClose: () => void;
  onConfirm: (bookingId: string) => Promise<void> | void;
  isDeleting?: boolean;
}

export const DeleteBookingConfirmationModal: React.FC<Props> = ({
  isOpen,
  booking,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-all transform scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with red warning styling */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 shadow-inner">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="delete-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Xác nhận xóa / hủy lịch chụp
            </h3>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              Bạn có chắc chắn muốn xóa/hủy lịch chụp này không? Hành động này không thể hoàn tác.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Snapshot Preview Card */}
        <div className="px-6 py-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="truncate">{booking.clientName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50">
                {booking.sessionType}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{booking.eventDate}</span>
              <span className="text-slate-400">|</span>
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Tổng gói:</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {booking.packagePrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        {/* Warning note */}
        <div className="px-6 py-2">
          <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
            <span>Show chụp sẽ được chuyển sang trạng thái đã hủy và ẩn khỏi bảng lịch trình.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-4 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => onConfirm(booking.id)}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
