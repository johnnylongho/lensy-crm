import React, { useState } from 'react';
import { X, Zap, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, DollarSign } from 'lucide-react';
import { CalendarEvent } from '../../types';
import { simulateDepositPayment, WebhookProcessResult } from '../../lib/paymentWebhook';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pendingBookings: CalendarEvent[];
  onSuccess: (result: WebhookProcessResult) => void;
}

export const WebhookSimulatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  pendingBookings,
  onSuccess,
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    pendingBookings[0]?.id || ''
  );
  const [customAmount, setCustomAmount] = useState<string>(
    pendingBookings[0] ? String(pendingBookings[0].depositAmount) : '5400000'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<WebhookProcessResult | null>(null);

  if (!isOpen) return null;

  const currentBooking = pendingBookings.find((b) => b.id === selectedBookingId);

  const handleBookingChange = (id: string) => {
    setSelectedBookingId(id);
    const b = pendingBookings.find((item) => item.id === id);
    if (b) {
      setCustomAmount(String(b.depositAmount));
    }
  };

  const handleSimulate = async () => {
    if (!currentBooking) return;
    setIsProcessing(true);
    setResultMessage(null);

    try {
      const amount = Number(customAmount) || currentBooking.depositAmount;
      const res = await simulateDepositPayment(
        currentBooking.id,
        amount,
        currentBooking.clientName,
        currentBooking.quoteToken
      );

      setResultMessage(res);
      if (res.success) {
        onSuccess(res);
      }
    } catch (e: any) {
      setResultMessage({
        success: false,
        message: e.message || 'Lỗi khi kích hoạt webhook giả lập.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Bộ Giả Lập Biến Động Số Dư (SePAY / VietQR)
              </h3>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                Giai Đoạn 2
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mô phỏng tức thì biến động số dư ngân hàng để kiểm tra tự động chốt cọc và ghi nhận dòng tiền
            </p>
          </div>
        </div>

        {/* Main Content */}
        {pendingBookings.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">
              Hiện không có lịch chụp nào đang ở trạng thái "Chờ Cọc"!
            </p>
            <p className="text-xs text-slate-400">
              Tất cả các lịch chụp hiện tại đều đã chốt hoặc đã hoàn thành. Hãy tạo một báo giá mới để thử nghiệm tính năng tự động nhận cọc.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Select Target Booking */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                1. Chọn Khách Hàng / Lịch Chờ Cọc Cần Giả Lập:
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => handleBookingChange(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {pendingBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.clientName} - {b.eventDate} ({b.depositAmount.toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
            </div>

            {/* Simulated Content & Amount */}
            {currentBooking && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Số tiền cọc thực tế:</span>
                  <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="bg-transparent border-b border-emerald-500/50 text-right w-32 focus:outline-none"
                    />
                    <span>đ</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[11px]">
                    Nội dung tin nhắn ngân hàng (Bank SMS/Notification):
                  </span>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60 font-mono text-[11px] text-amber-300 break-all">
                    LENSY COC {currentBooking.quoteToken || currentBooking.id.substring(0, 8)}{' '}
                    {currentBooking.clientName.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Mã cổng:</span>
                  <span className="font-mono text-slate-200 font-semibold">MB Bank (SePAY Webhook)</span>
                  <span className="ml-auto text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sẵn sàng
                  </span>
                </div>
              </div>
            )}

            {/* Result Message Box */}
            {resultMessage && (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-2.5 animate-fadeIn ${
                  resultMessage.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {resultMessage.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{resultMessage.success ? 'Thành Công!' : 'Thất Bại'}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{resultMessage.message}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors text-center"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isProcessing || !currentBooking}
                onClick={handleSimulate}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý Webhook...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Bắn Webhook Nhận Cọc 3 Giây</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
