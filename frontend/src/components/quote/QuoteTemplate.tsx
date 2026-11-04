import React from 'react';
import {
  Printer,
  Camera,
  Gift,
  Check,
  Shield,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
  onOpenDepositModal?: () => void;
  showPrintButton?: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Tính toán số tiền chuẩn xác
  const pkgPrice = Number(quote.packagePrice || 0);
  const depPercentage = Number(quote.depositPercentage || 30);
  const depAmount = Number(quote.depositAmount || Math.round((pkgPrice * depPercentage) / 100));
  const remainingAmount = Math.max(0, pkgPrice - depAmount);

  // Lọc sạch UUID trong equipmentList
  const cleanEquipmentList = (quote.equipmentList || [])
    .filter(item => typeof item === 'string' && item.trim().length > 0 && !UUID_REGEX.test(item.trim()));

  const finalEquipment = cleanEquipmentList.length > 0 ? cleanEquipmentList : [
    'Body Canon EOS R (Full-Frame)',
    'Ống kính Canon RF 85mm f/2 Macro',
    'Đèn Studio Godox V860iii & Trigger',
    'Softbox & Chân đèn tản sáng',
  ];

  const hasDynamicFeatures = Array.isArray(quote.features) && quote.features.length > 0;
  const logoSrc = quote.studioAvatarUrl || '/mirmia-logo.png';
  const rawTitle = quote.sessionTitle?.trim();
  const displayTitle = rawTitle
    ? `THƯ ĐỀ XUẤT DỊCH VỤ: ${rawTitle.toUpperCase()}`
    : 'THƯ ĐỀ XUẤT DỊCH VỤ NHIẾP ẢNH';

  return (
    <div className="min-h-screen bg-slate-100/70 print:bg-white text-slate-800 font-sans selection:bg-orange-500/20 py-4 sm:py-6 print:py-0 print:p-0">
      {/* Print-specific style sheet for PDF export & Paper Printing - Tối ưu 1 trang A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 6mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          .no-print, .print\\:hidden {
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
        }
      `}</style>

      {/* Container A4 Chuẩn Mực */}
      <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none border border-slate-200/80 print:border-none p-3 sm:p-5 print:p-0 print:m-0 space-y-2.5 print:space-y-1.5 flex flex-col justify-between break-inside-avoid print:break-inside-avoid">
        {/* Header Actions: Print / PDF Bar (Ẩn khi in) */}
        {showPrintButton && (
          <div className="no-print print:hidden flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-900">
                Báo Giá Dịch Vụ Nhiếp Ảnh
              </span>
              <span className="text-[11px] text-slate-400">
                #{quote.quoteToken}
              </span>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="In ra giấy hoặc lưu thành file PDF chuẩn A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Báo Giá / Xuất PDF (A4)</span>
            </button>
          </div>
        )}

        {/* 1. Header Báo Giá (Logo vuông nguyên bản, Tiêu Đề Động, Lời Chào) */}
        <div className="print-card bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2.5 shadow-sm text-center break-inside-avoid print:break-inside-avoid">
          <div className="flex justify-center mb-1.5 print:mb-1">
            <img
              src={logoSrc}
              alt={quote.studioName}
              className="w-16 h-16 sm:w-20 sm:h-20 print:w-16 print:h-16 object-contain rounded-none border-none mx-auto"
              onError={e => {
                (e.target as HTMLImageElement).src = '/mirmia-logo.png';
              }}
            />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-500 font-extrabold print:text-[10px]">
              {quote.studioName || 'MIRMIA STUDIO & ACADEMY'}
            </h3>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-wide text-center mt-1 print:text-sm print:mt-0.5">
              {displayTitle}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 text-center mt-1.5 print:mt-1 print:text-[11px] max-w-2xl mx-auto leading-relaxed">
            Kính gửi <strong>{quote.clientName || 'Quý khách'}</strong>, {quote.studioName || 'MIRMIA Studio'} hân hạnh gửi đến Quý khách thông tin chi tiết về gói dịch vụ.
          </p>
        </div>

        {/* 2. MASTER GRID LAYOUT: 2 Cột Tổng (Chi tiết, Bảng giá, Quyền lợi, Thiết bị) */}
        {/* Đảm bảo "Quyền lợi" và "Thiết bị" nằm song song chung 1 row ở hàng 2, không rớt dòng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-3 sm:gap-4 print:gap-2 items-start">
          {/* Row 1, Col 1: Chi Tiết Lịch Trình */}
          <div className="print-card bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-2 flex flex-col justify-between break-inside-avoid print:break-inside-avoid print:m-0">
            <div className="border-b border-slate-100 pb-1.5 print:pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
                Chi Tiết Lịch Trình
              </span>
              <h2 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide print:text-xs">
                {quote.sessionTitle || `Gói Chụp ${quote.sessionType}`}
              </h2>
            </div>

            <div className="space-y-1.5 text-xs print:text-[11px] flex-1 flex flex-col justify-around">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <Calendar className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Ngày Chụp:</span>
                  <span className="font-bold text-slate-900">{quote.eventDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Khung Giờ:</span>
                  <span className="font-bold text-slate-900">{quote.startTime || '08:00'} - {quote.endTime || '12:00'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium flex-shrink-0 mr-1.5">Địa Điểm:</span>
                  <span className="font-bold text-slate-900 truncate block text-right" title={quote.location || 'Tại Studio'}>
                    {quote.location || 'Tại Studio'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 1, Col 2: Bảng Quyết Toán Tài Chính */}
          <div className="print-card bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-2 flex flex-col justify-between break-inside-avoid print:break-inside-avoid print:m-0">
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

            <div className="space-y-1.5 text-xs print:text-[11px] flex-1 flex flex-col justify-around">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-semibold">Tổng Chi Phí Trọn Gói:</span>
                <span className="text-slate-900 font-bold text-sm print:text-xs font-sans">
                  {pkgPrice.toLocaleString('vi-VN')} <span className="text-[10px] text-slate-500 font-normal">VNĐ</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-orange-50 border border-orange-100">
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

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
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

            {/* Điều khoản hiệu lực: Tích hợp trực tiếp, KHÔNG tạo khối riêng */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] print:text-[10px] text-slate-500 leading-tight">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-orange-500 flex-shrink-0" />
                <span>Hiệu lực đến hết ngày <strong className="text-slate-800">{quote.validUntil || '15 ngày kể từ ngày lập'}</strong>.</span>
              </span>
            </div>

            {/* Action Button - Ẩn khi in */}
            {onOpenDepositModal && (
              <div className="no-print print:hidden pt-1">
                {isConfirmed ? (
                  <div className="w-full p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Lịch chụp đã được xác nhận & khóa cọc</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenDepositModal}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 shadow-md shadow-orange-500/20 text-white text-xs font-bold transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Xác Nhận & Cọc Tiền</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Row 2, Col 1: Quyền Lợi & Bàn Giao */}
          <div className="print-card bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-1.5 flex flex-col justify-between break-inside-avoid print:break-inside-avoid print:m-0">
            <div className="border-b border-slate-100 pb-1.5 print:pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
                Quyền Lợi & Bàn Giao
              </span>
              <h3 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide flex items-center gap-1.5 print:text-xs">
                <Camera className="w-4 h-4 text-orange-500" />
                <span>Quyền Lợi Gói Dịch Vụ</span>
              </h3>
            </div>

            <div className="space-y-1.5 text-xs print:text-[11px] flex-1">
              {hasDynamicFeatures ? (
                quote.features!.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800 print:text-[10px] leading-tight"
                  >
                    <div className="w-3.5 h-3.5 rounded bg-orange-100/70 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-orange-600 stroke-[3]" />
                    </div>
                    <span className="font-medium">{feat}</span>
                  </div>
                ))
              ) : (
                <>
                  {(quote.inclusions || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-1 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="w-3.5 h-3.5 rounded bg-orange-100/70 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs print:text-[10px] text-slate-900">{item.title}</h4>
                          <p className="text-[11px] print:text-[9px] text-slate-500 leading-snug">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(quote.deliverables || []).map((deliv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] print:text-[9px] text-slate-800"
                    >
                      <Gift className="w-3 h-3 text-orange-500 flex-shrink-0" />
                      <span className="font-medium truncate">{deliv}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Row 2, Col 2: Cam Kết Thiết Bị - NẰM SONG SONG VỚI QUYỀN LỢI */}
          <div className="print-card bg-white border border-slate-200 rounded-xl p-3 sm:p-4 print:p-2 shadow-sm space-y-1.5 flex flex-col justify-between break-inside-avoid print:break-inside-avoid print:m-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 print:pb-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block print:text-[9px]">
                  Tiêu Chuẩn Thiết Bị
                </span>
                <h3 className="text-slate-900 font-bold text-sm sm:text-base uppercase tracking-wide flex items-center gap-1.5 print:text-xs">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span>Cam Kết Thiết Bị</span>
                </h3>
              </div>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wider print:text-[9px]">
                Đã Khóa Thiết Bị
              </span>
            </div>

            <p className="text-xs print:text-[10px] text-slate-500 leading-tight">
              Studio cam kết mang đầy đủ thân máy chính & phụ cùng ống kính khẩu độ lớn cao cấp nhất:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-0.5 flex-1 items-start">
              {finalEquipment.map((eq, idx) => (
                <span
                  key={idx}
                  className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 print:text-[10px] print:py-0.5 print:px-2"
                >
                  <Camera className="w-3 h-3 text-orange-500 shrink-0" />
                  <span>{eq}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplate;
