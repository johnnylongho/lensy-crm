import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Phone,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ZoomIn,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { openZaloChat } from '../../lib/zaloMessenger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  booking: CalendarEvent | null;
  onConfirmSuccess: (updatedBookingId: string) => void;
  onRejectRequest: (bookingId: string) => void;
}

export const ReceiptReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  booking,
  onConfirmSuccess,
  onRejectRequest,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !booking) return null;

  // Xử lý Duyệt Cọc 1-Chạm
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      if (isSupabaseConfigured) {
        // 1. Cập nhật booking sang 'da_chot' và làm sạch tag notes
        // Lưu ý: Không gửi remaining_amount vì đây là cột GENERATED ALWAYS AS (package_price - paid_amount)
        const cleanNotes = (booking.notes || '').replace('[BILL_PENDING]', '[BILL_APPROVED]');
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'da_chot',
            paid_amount: booking.depositAmount,
            notes: cleanNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (updateError) throw updateError;

        // 2. Ghi nhận dòng tiền vào bảng transactions
        const photographerId = (booking as any).photographer_id || (booking as any).photographerId || null;
        await supabase.from('transactions').insert([
          {
            booking_id: booking.id,
            photographer_id: photographerId,
            type: 'deposit',
            amount: booking.depositAmount,
            payment_method: 'bank_transfer',
            status: 'completed',
            notes: `Thợ ảnh đã duyệt ảnh biên lai chuyển khoản của khách hàng ${booking.clientName}`,
            transaction_date: new Date().toISOString(),
          },
        ]);
      }

      onConfirmSuccess(booking.id);
      onClose();
    } catch (err: any) {
      alert(`Lỗi khi duyệt cọc: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Xử lý Yêu Cầu Chụp Lại Bill
  const handleReject = async () => {
    setIsRejecting(true);
    try {
      if (isSupabaseConfigured) {
        const cleanNotes = (booking.notes || '').replace('[BILL_PENDING]', '');
        await supabase
          .from('bookings')
          .update({
            status: 'cho_coc',
            notes: cleanNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);
      }
      onRejectRequest(booking.id);
      onClose();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenZalo = () => {
    // Trích xuất số điện thoại từ notes nếu có hoặc hotline mặc định
    openZaloChat(
      '0901234567',
      `Chào bạn ${booking.clientName}, Studio Mirmia đã nhận được thông tin cọc của bạn cho ngày ${booking.eventDate}. Chúng tôi đang đối soát và sẽ phản hồi ngay!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-500/40 p-5 sm:p-7 shadow-2xl space-y-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Đối Soát & Duyệt Biên Lai Cọc Khách Hàng
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-300 rounded border border-orange-500/30 animate-pulse">
                Chờ Duyệt
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kiểm tra thông tin chuyển khoản và ảnh biên lai trước khi khóa lịch chụp cho khách
            </p>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Receipt Image */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Ảnh Chụp Màn Hình Biên Lai Chuyển Khoản:
            </span>
            <div
              onClick={() => setIsZoomed(!isZoomed)}
              className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer group aspect-[3/4] flex items-center justify-center"
            >
              {booking.receiptUrl ? (
                <img
                  src={booking.receiptUrl}
                  alt="Biên lai chuyển khoản"
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    isZoomed ? 'scale-125' : 'group-hover:scale-105'
                  }`}
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                    <FileText className="w-7 h-7 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">
                      Biên Lai VietQR (Đã Xác Nhận Qua Web)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Khách hàng xác nhận đã hoàn tất giao dịch ngân hàng
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-slate-300 font-mono flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3 h-3" />
                <span>Nhấn để phóng to</span>
              </div>
            </div>
          </div>

          {/* Right Column: Verification Data */}
          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Thông Tin Đối Soát:
              </span>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Khách hàng:
                </span>
                <span className="font-bold text-white text-sm">{booking.clientName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Ngày & Khung giờ:
                </span>
                <span className="font-mono text-slate-200 font-medium">
                  {booking.eventDate} ({booking.startTime} - {booking.endTime})
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Gói chụp:</span>
                <span className="font-bold text-amber-300 uppercase">{booking.sessionType}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Tổng giá trị hợp đồng:</span>
                <span className="font-mono font-bold text-slate-300">
                  {booking.packagePrice.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 font-semibold">Tiền cọc cần đối soát (30%):</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">
                  {booking.depositAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Khi bấm <strong>"Xác Nhận Đã Nhận Tiền"</strong>, hệ thống sẽ tự động khóa lịch ngày{' '}
                {booking.eventDate}, ghi sổ kế toán và cập nhật màn hình khách hàng theo thời gian thực.
              </span>
            </div>

            {/* Chat Zalo Button */}
            <button
              type="button"
              onClick={handleOpenZalo}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span>Nhắn Zalo Với Khách Hàng</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            disabled={isRejecting || isApproving}
            onClick={handleReject}
            className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isRejecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>Yêu Cầu Gửi Lại</span>
          </button>

          <button
            type="button"
            disabled={isApproving || isRejecting}
            onClick={handleApprove}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
          >
            {isApproving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang Ghi Nhận Dòng Tiền & Khóa Lịch...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Đã Nhận Đủ Tiền (Chốt Lịch)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
