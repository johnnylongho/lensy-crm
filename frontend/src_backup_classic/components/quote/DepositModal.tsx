import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Calendar,
  Download,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { QuoteData } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../lib/calendarIntegration';
import { generateDepositReceiptMessage, openZaloChat } from '../../lib/zaloMessenger';

interface Props {
  quote: QuoteData;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeposit: () => void;
}

export const DepositModal: React.FC<Props> = ({ quote, isOpen, onClose, onConfirmDeposit }) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Lắng nghe Realtime từ Supabase: Khi thợ ảnh duyệt cọc (chuyển sang 'da_chot'), màn hình khách tự động chuyển sang Chúc Mừng
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured || !quote.quoteToken) return;

    const channel = supabase
      .channel(`deposit-client-watch-${quote.quoteToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `quote_token=eq.${quote.quoteToken}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status === 'da_chot') {
            setIsPendingReview(false);
            setIsSuccess(true);
            onConfirmDeposit();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, quote.quoteToken]);

  if (!isOpen) return null;

  const transferContent = `COC ${quote.quoteToken}`;
  const qrUrl = `https://api.vietqr.io/image/970422-${quote.bankInfo.accountNumber}-compact.png?amount=${quote.depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(quote.bankInfo.accountName)}`;

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Chọn ảnh biên lai từ album hoặc chụp camera điện thoại
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có dung lượng nhỏ hơn 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Khách gửi ảnh biên lai lên Studio
  const handleSubmitReceipt = async () => {
    setIsUploading(true);
    try {
      if (receiptImage && quote.quoteToken) {
        try {
          localStorage.setItem(`receipt_${quote.quoteToken}`, receiptImage);
        } catch (e) {
          console.warn('Không thể lưu ảnh vào localStorage:', e);
        }
      }

      if (isSupabaseConfigured) {
        // Cập nhật booking với tag [BILL_PENDING] trong notes (không đổi status để tránh vi phạm PostgreSQL check constraint)
        const currentNotes = quote.specialNotes || '';
        await supabase
          .from('bookings')
          .update({
            notes: `[BILL_PENDING] Khách hàng ${quote.clientName} đã tải ảnh bill chuyển cọc ${quote.depositAmount.toLocaleString('vi-VN')}đ. ${currentNotes}`.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('quote_token', quote.quoteToken);
      }

      setIsPendingReview(true);
    } catch (e: any) {
      alert(`Lỗi khi gửi biên lai: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Chuẩn bị thông tin tích hợp
  const calendarEventData = {
    title: `[Mirmia] Show Chụp ${quote.sessionType} - ${quote.clientName}`,
    clientName: quote.clientName,
    sessionType: quote.sessionType,
    eventDate: quote.eventDate,
    startTime: quote.startTime || '08:00',
    endTime: quote.endTime || '12:00',
    location: quote.location || 'Tại Studio Mirmia',
    quoteToken: quote.quoteToken,
    quoteUrl: window.location.href,
    photographerName: quote.photographerName,
    photographerPhone: quote.photographerPhone,
  };

  const receiptData = {
    clientName: quote.clientName,
    clientPhone: quote.photographerPhone,
    sessionType: quote.sessionType,
    eventDate: quote.eventDate,
    startTime: quote.startTime,
    endTime: quote.endTime,
    location: quote.location,
    packagePrice: quote.packagePrice,
    depositAmount: quote.depositAmount,
    remainingAmount: Math.max(0, quote.packagePrice - quote.depositAmount),
    quoteToken: quote.quoteToken,
    quoteUrl: window.location.href,
  };

  const handleOpenGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(calendarEventData);
    window.open(url, '_blank');
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(calendarEventData);
  };

  const handleSendZalo = () => {
    const msg = `Chào Studio Mirmia, mình là ${quote.clientName}. Mình vừa chuyển khoản cọc ${quote.depositAmount.toLocaleString('vi-VN')}đ cho show chụp ngày ${quote.eventDate}. Mình gửi ảnh biên lai chuyển tiền tại đây, nhờ Studio kiểm tra và khóa lịch giúp mình nhé!`;
    openZaloChat(quote.photographerPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. MÀN HÌNH ĐÃ ĐƯỢC DUYỆT THÀNH CÔNG (Live Realtime từ Studio) */}
        {isSuccess ? (
          <div className="py-6 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Studio Đã Duyệt & Khóa Lịch
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Đặt Cọc Giữ Lịch Thành Công!
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Studio Mirmia đã xác nhận nhận đủ tiền cọc{' '}
                <strong className="text-amber-400">
                  {quote.depositAmount.toLocaleString('vi-VN')} đ
                </strong>{' '}
                và khóa ngày chụp <strong className="text-amber-400">{quote.eventDate}</strong>.
              </p>
            </div>

            {/* Đồng Bộ Lịch Cho Khách Hàng */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Lưu Lịch Chụp Vào Điện Thoại:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenGoogleCalendar}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Google Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Lịch iPhone (.ics)</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 text-xs transition-all"
            >
              Hoàn Tất & Xem Hợp Đồng Chi Tiết
            </button>
          </div>
        ) : isPendingReview ? (
          /* 2. MÀN HÌNH ĐANG CHỜ STUDIO ĐỐI SOÁT BILL */
          <div className="py-6 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Clock className="w-9 h-9 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-[11px] font-bold border border-orange-500/30 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Đã Gửi Biên Lai - Đang Chờ Duyệt
              </span>
              <h3 className="text-lg font-bold text-white">
                Studio Đang Đối Soát Chuyển Khoản
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Biên lai cọc của bạn đã được chuyển tới quản lý Studio. Ngay khi đối soát tài khoản hoàn tất, lịch chụp sẽ được khóa ngay lập tức!
              </p>
            </div>

            {/* Xem lại ảnh bill đã gửi */}
            {receiptImage && (
              <div className="w-36 h-48 mx-auto rounded-2xl overflow-hidden border border-slate-700 bg-black/60 p-1">
                <img
                  src={receiptImage}
                  alt="Biên lai của bạn"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            )}

            {/* Nút gửi bill nhanh qua Zalo */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSendZalo}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Gửi Bill Nhanh Qua Zalo Cho Studio</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Đóng Cửa Sổ Này
              </button>
            </div>
          </div>
        ) : (
          /* 3. MÀN HÌNH CHÍNH: QUÉT VIETQR & TẢI ẢNH BIÊN LAI */
          <>
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5" />
                Cổng Chuyển Khoản & Xác Nhận Cọc
              </div>
              <h3 className="text-lg font-bold text-white">Đặt Cọc Giữ Lịch Chụp</h3>
              <p className="text-xs text-slate-400">
                Quét mã VietQR và gửi ảnh biên lai để Studio khóa lịch ngay
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl w-48 h-48 mx-auto shadow-lg flex items-center justify-center relative">
              <img
                src={qrUrl}
                alt="VietQR Chuyển Khoản Cọc"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bank details copy helper */}
            <div className="space-y-2 text-xs bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Ngân Hàng:
                </span>
                <span className="font-bold text-white">{quote.bankInfo.bankName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {quote.bankInfo.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(quote.bankInfo.accountNumber, setCopiedAccount)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy STK"
                  >
                    {copiedAccount ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-slate-200 uppercase">
                  {quote.bankInfo.accountName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Số tiền cọc (30%):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {quote.depositAmount.toLocaleString('vi-VN')} đ
                  </span>
                  <button
                    onClick={() => handleCopy(String(quote.depositAmount), setCopiedAmount)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy số tiền"
                  >
                    {copiedAmount ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400 text-xs">
                    {transferContent}
                  </span>
                  <button
                    onClick={() => handleCopy(transferContent, setCopiedContent)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy nội dung"
                  >
                    {copiedContent ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Ô TẢI ẢNH BIÊN LAI CHUYỂN KHOẢN */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Ảnh Chụp Màn Hình Chuyển Khoản:</span>
                {receiptImage && (
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Chọn ảnh khác
                  </button>
                )}
              </span>

              {receiptImage ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-emerald-500/40">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-slate-700">
                    <img
                      src={receiptImage}
                      alt="Ảnh biên lai"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã chọn ảnh biên lai</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Sẵn sàng gửi tới Studio để đối soát
                    </p>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/80">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-200 block">
                      Tải lên ảnh Bill chuyển khoản
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Chọn ảnh chụp màn hình app ngân hàng (JPG, PNG)
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleSubmitReceipt}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm disabled:opacity-60 hover:scale-[1.01]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi biên lai tới Studio...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {receiptImage
                        ? 'Gửi Biên Lai Cọc & Chờ Khóa Lịch'
                        : 'Tôi Đã Chuyển Khoản (Gửi Sau)'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Để Tôi Chuyển Khoản Sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
