import React from 'react';
import {
  Printer,
  Camera,
  Gift,
  Check,
  FileCheck,
  Shield,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Sparkles,
} from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
  onOpenDepositModal?: () => void;
  showPrintButton?: boolean;
}

export const QuoteTemplate: React.FC<Props> = ({
  quote,
  onOpenDepositModal,
  showPrintButton = true,
}) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isConfirmed = quote.status === 'da_chot' || quote.status === 'hoan_thanh';

  return (
    <div className="quote-template-root w-full max-w-full sm:max-w-4xl mx-auto overflow-x-hidden font-sans space-y-6">
      {/* Print-specific style sheet for PDF export & Paper Printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #090a0f !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            color: #0f172a !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #64748b !important;
          }
          .print-border {
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Header Actions: Print / PDF Bar (Ẩn khi in) */}
      {showPrintButton && (
        <div className="no-print flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              Báo Giá Dịch Vụ Nhiếp Ảnh
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              #{quote.quoteToken}
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="h-11 min-h-[44px] px-4 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-orange-600/20 cursor-pointer"
            title="In ra giấy hoặc lưu thành file PDF chuẩn A4"
          >
            <Printer className="w-4 h-4" />
            <span>In Báo Giá / Xuất PDF</span>
          </button>
        </div>
      )}

      {/* Studio Banner & Quote Document Header */}
      <div className="print-card rounded-3xl p-6 sm:p-8 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
              Thư Báo Giá & Hợp Đồng Dịch Vụ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 print-text-dark tracking-tight">
              {quote.studioName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 print-text-muted">
              Nhiếp ảnh gia chính: <strong className="text-slate-800 dark:text-zinc-200 print-text-dark">{quote.photographerName}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <span className="text-[11px] text-slate-400 print-text-muted block font-mono">
              Mã báo giá: {quote.quoteToken}
            </span>
            <span className="text-[11px] text-slate-500 print-text-muted block">
              Ngày lập: {quote.eventDate || new Date().toISOString().split('T')[0]}
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
              {quote.sessionTitle || `Gói ${quote.sessionType}`}
            </span>
          </div>
        </div>

        {/* Thông tin khách hàng & buổi chụp (2 Cột tinh gọn) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-white/5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              Khách Hàng / Đối Tác
            </span>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <strong className="text-slate-900 dark:text-zinc-100 print-text-dark text-sm">
                {quote.clientName}
              </strong>
            </div>
            {quote.clientPhone && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{quote.clientPhone}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-white/5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
              Thời Gian & Địa Điểm
            </span>
            <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>Ngày chụp: <strong className="text-slate-900 dark:text-zinc-100">{quote.eventDate}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Khung giờ: {quote.startTime || '08:00'} - {quote.endTime || '12:00'}</span>
            </div>
            {quote.location && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{quote.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout: 1 Cột trên Mobile, 2 Cột Rõ Ràng trên Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cột 1: Quyền Lợi, Sản Phẩm & Thiết Bị */}
        <div className="space-y-6">
          {/* Khối Quyền Lợi */}
          <div className="print-card rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100 print-text-dark">
                Quyền Lợi Gói Dịch Vụ
              </h3>
            </div>

            <div className="space-y-3">
              {(quote.inclusions || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-white/5 space-y-1"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm leading-none mt-0.5">
                      +
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100 print-text-dark">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 print-text-muted leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Khối Sản Phẩm & File Bàn Giao */}
          <div className="print-card rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100 print-text-dark">
                Sản Phẩm & File Bàn Giao
              </h3>
            </div>

            <div className="space-y-2">
              {(quote.deliverables || []).map((deliv, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300 print-text-dark py-1 border-b border-slate-200/50 dark:border-white/5 last:border-0"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>{deliv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Khối Cam Kết Thiết Bị */}
          {quote.equipmentList && quote.equipmentList.length > 0 && (
            <div className="print-card rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100 print-text-dark">
                  Hệ Thống Thiết Bị Chuyên Nghiệp
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {quote.equipmentList.map((eq, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-zinc-300"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cột 2: Bảng Quyết Toán Tài Chính & Chốt Cọc */}
        <div className="space-y-6">
          <div className="print-card rounded-3xl p-6 sm:p-7 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  Bảng Quyết Toán Tài Chính
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 print-text-dark">
                  Tổng Chi Phí Trọn Gói
                </h3>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400 font-mono">
                  {quote.packagePrice.toLocaleString('vi-VN')} <span className="text-xs font-normal">VNĐ</span>
                </span>
              </div>
            </div>

            {/* Chi Tiết Cọc & Còn Lại */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <div>
                  <span className="font-bold text-orange-600 dark:text-orange-400 block text-xs sm:text-sm">
                    Tiền Đặt Cọc Giữ Lịch ({quote.depositPercentage}%)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Khóa lịch thợ & thiết bị ngay khi hoàn tất
                  </span>
                </div>
                <div className="text-right font-mono font-bold text-orange-600 dark:text-orange-400 text-base sm:text-lg">
                  {quote.depositAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-white/5">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 block text-xs">
                    Khoản Còn Lại ({100 - quote.depositPercentage}%)
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Quyết toán sau khi nghiệm thu và bàn giao file ảnh
                  </span>
                </div>
                <div className="text-right font-mono text-slate-600 dark:text-zinc-400 text-sm">
                  {quote.remainingAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>

            {/* Điều khoản hiệu lực */}
            <div className="flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-zinc-400 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-white/5">
              <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <span>
                Báo giá có hiệu lực đến hết ngày <strong className="text-slate-800 dark:text-zinc-200">{quote.validUntil || '15 ngày kể từ ngày lập'}</strong>. Quý khách vui lòng xác nhận và đặt cọc sớm để giữ trọn vẹn ekip ưng ý.
              </span>
            </div>

            {/* Action CTA (Ẩn khi in) */}
            {onOpenDepositModal && (
              <div className="no-print pt-2">
                {isConfirmed ? (
                  <div className="w-full p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center font-bold text-xs flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Lịch chụp đã được xác nhận & khóa cọc thành công</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenDepositModal}
                    className="w-full h-12 min-h-[44px] px-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/25 active:scale-98 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Đặt Cọc Ngay Bằng VietQR 1-Chạm</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplate;

