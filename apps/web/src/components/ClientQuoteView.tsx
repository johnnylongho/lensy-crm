import React, { useState } from 'react';
import { Booking } from '@lensflow/shared';
import { Calendar, Clock, MapPin, CheckCircle, ShieldCheck, Sparkles, QrCode } from 'lucide-react';

interface Props {
  booking: Booking;
  onDepositConfirmed?: (bookingId: string) => void;
}

export const ClientQuoteView: React.FC<Props> = ({ booking, onDepositConfirmed }) => {
  const [showQR, setShowQR] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid');

  const handleConfirm = () => {
    setIsConfirmed(true);
    if (onDepositConfirmed) {
      onDepositConfirmed(booking.id);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 text-slate-100">
      {/* Brand Header */}
      <div className="text-center space-y-2 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          LensFlow Photography Experience
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Thư Báo Giá & Xác Nhận Lịch Chụp
        </h1>
        <p className="text-xs text-slate-400">
          Kính gửi quý khách: <strong className="text-slate-200">{booking.clientName}</strong>
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">GÓI DỊCH VỤ</span>
            <span className="font-bold text-sm text-indigo-300 capitalize">{booking.sessionType} Photography</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1">TRẠNG THÁI</span>
            {isConfirmed ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> Đã chốt cọc
              </span>
            ) : (
              <span className="text-amber-400 font-bold">Đang chờ xác nhận cọc</span>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Ngày thực hiện: <strong className="text-white">{booking.eventDate}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Thời gian: <strong>{booking.startTime} - {booking.endTime}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>Địa điểm: <strong>{booking.location}</strong></span>
          </div>
        </div>
      </div>

      {/* Equipment Guarantee Banner */}
      <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-indigo-400 flex-shrink-0" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block">Cam Kết Thiết Bị Chuyên Nghiệp:</span>
          Toàn bộ máy ảnh Full-frame Sony/Canon cùng hệ thống ống kính khẩu lớn và đèn chiếu sáng cao cấp đã được lên lịch riêng cho buổi chụp của bạn.
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chi Tiết Quyết Toán</h4>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Tổng chi phí trọn gói:</span>
          <span className="font-bold font-mono text-white text-base">
            {booking.packagePrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-indigo-300 pb-2 border-b border-slate-900">
          <span>Tiền đặt cọc giữ lịch (30%):</span>
          <span className="font-bold font-mono">
            {booking.depositAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Khoản còn lại (thanh toán khi bàn giao file ảnh):</span>
          <span className="font-mono text-slate-300">
            {(booking.packagePrice - booking.depositAmount).toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* Action Button */}
      {!isConfirmed ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Xác Nhận Chốt Lịch & Chuyển Khoản Cọc ({booking.depositAmount.toLocaleString('vi-VN')} đ)
          </button>

          {showQR && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3 animate-fadeIn">
              <p className="text-xs text-slate-300">
                Quét mã VietQR hoặc chuyển khoản với nội dung bên dưới:
              </p>
              <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-md">
                <img
                  src={`https://api.vietqr.io/image/970422-0901234567-compact.png?amount=${booking.depositAmount}&addInfo=COC%20${booking.quoteToken}`}
                  alt="VietQR Chuyển Khoản Cọc"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs space-y-1 text-slate-400">
                <p>Ngân Hàng: <strong className="text-white">MB Bank (Quân Đội)</strong></p>
                <p>STK: <strong className="text-white font-mono">0901234567</strong></p>
                <p>Tên: <strong className="text-white">NGUYEN VAN THO (LENSFLOW STUDIO)</strong></p>
                <p>Nội dung: <strong className="text-indigo-400 font-mono">COC {booking.quoteToken}</strong></p>
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
              >
                Tôi Đã Chuyển Khoản Thành Công
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-1 text-emerald-300">
          <CheckCircle className="w-7 h-7 mx-auto text-emerald-400" />
          <h4 className="font-bold text-sm text-white">Lịch Chụp Đã Được Khóa Thành Công!</h4>
          <p className="text-xs">Nhiếp ảnh gia sẽ liên hệ trực tiếp với bạn trước ngày chụp 24h để thống nhất concept.</p>
        </div>
      )}
    </div>
  );
};
