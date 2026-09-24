import React, { useState, useEffect } from 'react';
import { CalendarEvent, BookingStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export interface ZaloNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: CalendarEvent | null;
  targetStatus: BookingStatus | null;
  studioName?: string;
  onCopied?: (msg?: string) => void;
}

/**
 * Hàm sinh nội dung tin nhắn tự động theo trạng thái
 * - deposited / da_chot: Chào [Tên Khách Hàng], [Tên Studio] đã nhận được cọc và xác nhận giữ lịch chụp cho bạn vào ngày [Ngày Chụp]. Hẹn gặp bạn nhé!
 * - done / hoan_thanh: Chào [Tên Khách Hàng], [Tên Studio] đã hoàn thiện bộ ảnh của bạn. Cảm ơn bạn đã tin tưởng lựa chọn studio. Chúc bạn một ngày vui vẻ!
 */
export function generateZaloMessage(
  booking: CalendarEvent,
  targetStatus: BookingStatus,
  studioName: string = 'MIRMIA STUDIO'
): string {
  const clientName = booking.clientName || 'Quý khách';
  const eventDate = booking.eventDate || '';
  const sName = studioName || 'Studio';

  if (targetStatus === 'deposited' || targetStatus === 'da_chot') {
    return `Chào ${clientName}, ${sName} đã nhận được cọc và xác nhận giữ lịch chụp cho bạn vào ngày ${eventDate}. Hẹn gặp bạn nhé!`;
  }

  if (targetStatus === 'done' || targetStatus === 'hoan_thanh') {
    return `Chào ${clientName}, ${sName} đã hoàn thiện bộ ảnh của bạn. Cảm ơn bạn đã tin tưởng lựa chọn studio. Chúc bạn một ngày vui vẻ!`;
  }

  return `Chào ${clientName}, ${sName} xin gửi thông báo cập nhật về show chụp ngày ${eventDate}. Chúc bạn một ngày vui vẻ!`;
}

export const ZaloNotificationModal: React.FC<ZaloNotificationModalProps> = ({
  isOpen,
  onClose,
  booking,
  targetStatus,
  studioName: propStudioName,
  onCopied,
}) => {
  const { user } = useAuth();
  const [studioName, setStudioName] = useState<string>(
    propStudioName ||
      user?.user_metadata?.studio_name ||
      user?.user_metadata?.full_name ||
      'MIRMIA STUDIO'
  );
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Truy xuất thông tin Studio từ Supabase nếu có
  useEffect(() => {
    if (propStudioName) {
      setStudioName(propStudioName);
      return;
    }

    if (user && isSupabaseConfigured) {
      supabase
        .from('users')
        .select('studio_name, full_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            if (data.studio_name) {
              setStudioName(data.studio_name);
            } else if (data.full_name) {
              setStudioName(data.full_name);
            }
          }
        });
    }
  }, [user, propStudioName]);

  // Sinh nội dung tin nhắn khi mở modal hoặc thay đổi booking/status/studio
  useEffect(() => {
    if (booking && targetStatus) {
      const generated = generateZaloMessage(booking, targetStatus, studioName);
      setMessage(generated);
    }
  }, [booking, targetStatus, studioName, isOpen]);

  // Reset copied state sau 2.5s
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Reset toast state sau 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!isOpen || !booking || !targetStatus) return null;

  const isDeposited = targetStatus === 'deposited' || targetStatus === 'da_chot';
  const isDone = targetStatus === 'done' || targetStatus === 'hoan_thanh';
  const cleanPhone = (booking.clientPhone || '').replace(/\D/g, '');

  // Xử lý Hành động 2: Copy Tin nhắn vào Clipboard
  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setToastMessage('Đã copy!');
      if (onCopied) {
        onCopied('Đã copy!');
      }
    } catch (err) {
      console.error('Không thể copy tin nhắn:', err);
    }
  };

  // Xử lý Hành động 3: Mở Zalo ngay
  const handleOpenZalo = () => {
    if (!cleanPhone) {
      alert('Không tìm thấy số điện thoại của khách hàng để mở Zalo.');
      return;
    }
    const zaloUrl = `https://zalo.me/${cleanPhone}`;
    window.open(zaloUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Toast Notification "Đã copy!" */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
          <div className="px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#0068FF]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Thông báo cho khách hàng qua Zalo?
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isDeposited && (
                  <span className="text-emerald-400 font-medium">
                    ⚡ Show vừa chuyển sang trạng thái: Đã cọc
                  </span>
                )}
                {isDone && (
                  <span className="text-purple-400 font-medium">
                    🎉 Show vừa chuyển sang trạng thái: Hoàn tất
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Booking Summary Box */}
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white">{booking.clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{booking.eventDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-emerald-400">
                {booking.clientPhone || 'Chưa có SĐT'}
              </span>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="zalo-message-input" className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Nội dung tin nhắn tự động sinh:</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {message.length} ký tự
              </span>
            </div>
            <textarea
              id="zalo-message-input"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-slate-100 text-xs sm:text-sm leading-relaxed focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all resize-none shadow-inner"
              placeholder="Nhập nội dung tin nhắn gửi khách..."
            />
            <p className="text-[11px] text-slate-400 italic">
              💡 Bạn có thể chỉnh sửa trực tiếp nội dung tin nhắn trước khi copy hoặc mở Zalo.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
          {/* Nút 1: Bỏ qua */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Bỏ qua
          </button>

          {/* Nút 2: Copy Tin nhắn */}
          <button
            type="button"
            onClick={handleCopyMessage}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Đã copy!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy Tin nhắn</span>
              </>
            )}
          </button>

          {/* Nút 3: Mở Zalo ngay */}
          <button
            type="button"
            onClick={handleOpenZalo}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0068FF] hover:bg-[#0052cc] flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Mở Zalo ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
