import React from 'react';
import { CreditCard, CheckCircle2, Shield, ArrowRight, Calendar, Download } from 'lucide-react';
import { QuoteData } from '../../types';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../lib/calendarIntegration';

interface Props {
  quote: QuoteData;
  onOpenDepositModal: () => void;
}

export const QuotePriceSummary: React.FC<Props> = ({ quote, onOpenDepositModal }) => {
  const isConfirmed = quote.status === 'da_chot' || quote.status === 'hoan_thanh';

  // Tính toán số tiền chuẩn xác
  const pkgPrice = Number(quote.packagePrice || 0);
  const depPercentage = Number(quote.depositPercentage || 30);
  const depAmount = Number(quote.depositAmount || Math.round((pkgPrice * depPercentage) / 100));
  const remainingAmount = Math.max(0, pkgPrice - depAmount);

  const handleOpenGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl({
      title: `[Lensy] Lịch Chụp ${quote.sessionType} - ${quote.clientName}`,
      clientName: quote.clientName,
      sessionType: quote.sessionType,
      eventDate: quote.eventDate,
      startTime: quote.startTime || '08:00',
      endTime: quote.endTime || '12:00',
      location: quote.location || 'Tại Studio',
      quoteToken: quote.quoteToken,
      quoteUrl: window.location.href,
      photographerName: quote.photographerName,
      photographerPhone: quote.photographerPhone,
    });
    window.open(url, '_blank');
  };

  const handleDownloadIcs = () => {
    downloadIcsFile({
      title: `[Lensy] Lịch Chụp ${quote.sessionType} - ${quote.clientName}`,
      clientName: quote.clientName,
      sessionType: quote.sessionType,
      eventDate: quote.eventDate,
      startTime: quote.startTime || '08:00',
      endTime: quote.endTime || '12:00',
      location: quote.location || 'Tại Studio',
      quoteToken: quote.quoteToken,
      quoteUrl: window.location.href,
      photographerName: quote.photographerName,
      photographerPhone: quote.photographerPhone,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-2 flex flex-col justify-between h-full break-inside-avoid print:break-inside-avoid print:m-0">
      {/* Tiêu đề Bảng Quyết Toán */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 print:pb-1">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
            Bảng Quyết Toán Tài Chính
          </span>
          <h3 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide print:text-xs">
            Quyết Toán Hợp Đồng
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider print:text-[9px]">
          Đơn vị: VNĐ
        </span>
      </div>

      {/* Sắp xếp 2 cột rõ ràng */}
      <div className="space-y-1.5 text-xs print:text-[11px] flex-1 flex flex-col justify-around">
        {/* Hàng 1: Tổng Chi Phí Trọn Gói */}
        <div className="flex items-center justify-between p-2 print:p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-slate-700 font-semibold">Tổng Chi Phí Trọn Gói:</span>
          <span className="text-slate-900 font-bold text-sm print:text-xs font-sans">
            {pkgPrice.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-500 font-normal">VNĐ</span>
          </span>
        </div>

        {/* Hàng 2: Tiền Đặt Cọc (30%) - Nền bg-orange-50 */}
        <div className="flex items-center justify-between p-2 print:p-1.5 rounded-lg bg-orange-50 border border-orange-100">
          <div>
            <span className="text-orange-900 font-bold block text-xs print:text-[11px]">
              Tiền Đặt Cọc ({depPercentage}%):
            </span>
            <span className="text-[10px] text-orange-700/80 block print:hidden">Khóa lịch & thiết bị</span>
          </div>
          <span className="text-orange-600 font-extrabold text-base sm:text-lg print:text-sm font-sans">
            {depAmount.toLocaleString('vi-VN')} <span className="text-xs font-bold">đ</span>
          </span>
        </div>

        {/* Hàng 3: Khoản Còn Lại */}
        <div className="flex items-center justify-between p-2 print:p-1.5 rounded-lg bg-slate-50 border border-slate-100">
          <div>
            <span className="text-slate-700 font-semibold block text-xs print:text-[11px]">
              Khoản Còn Lại ({100 - depPercentage}%):
            </span>
            <span className="text-[10px] text-slate-500 block print:hidden">Quyết toán khi nhận đủ file ảnh</span>
          </div>
          <span className="text-slate-900 font-bold text-sm print:text-xs font-sans">
            {remainingAmount.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-500 font-normal">đ</span>
          </span>
        </div>
      </div>

      {/* Điều khoản hiệu lực: Tích hợp trực tiếp vào bên dưới Bảng Quyết Toán, KHÔNG tách khối riêng */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] print:text-[10px] text-slate-500 leading-tight">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-orange-500 flex-shrink-0" />
          <span>Báo giá có hiệu lực đến hết ngày <strong className="text-slate-800">{quote.validUntil || '15 ngày kể từ ngày lập'}</strong>.</span>
        </span>
        <span className="text-[10px] text-orange-600 font-semibold print:hidden">Khóa ekip sớm</span>
      </div>

      {/* Nút Kêu Gọi Hành Động (CTA Button) - ẨN HOÀN TOÀN KHI IN */}
      <div className="no-print print:hidden pt-1">
        {isConfirmed ? (
          <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Lịch Chụp Đã Được Chốt Thành Công!
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              <button
                type="button"
                onClick={handleOpenGoogleCalendar}
                className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold flex items-center justify-center gap-1 hover:border-orange-500 shadow-sm"
              >
                <Calendar className="w-3 h-3 text-orange-500" />
                <span>Google Cal</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold flex items-center justify-center gap-1 hover:border-orange-500 shadow-sm"
              >
                <Download className="w-3 h-3 text-orange-500" />
                <span>Lịch iPhone</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenDepositModal}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 text-white text-sm font-bold transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <CreditCard className="w-4 h-4" />
            <span>Xác Nhận & Cọc Tiền</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
