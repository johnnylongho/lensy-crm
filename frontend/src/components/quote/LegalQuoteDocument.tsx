import React, { useState } from 'react';
import { QuoteData, Studio } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DepositModal } from './DepositModal';
import { Printer, CreditCard } from 'lucide-react';

interface Props {
  quote: QuoteData;
  studio?: Studio | null;
  onQuoteStatusChange?: (newStatus: QuoteData['status']) => void;
  onBookingSubmit?: (newBooking: any) => void;
}

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatVietnameseDate = (dateString?: string): string => {
  const d = dateString ? new Date(dateString) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  }
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
};

export const LegalQuoteDocument: React.FC<Props> = ({
  quote,
  studio,
  onQuoteStatusChange,
}) => {
  const { currentStudio } = useWorkspace();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDeposit = () => {
    if (onQuoteStatusChange) {
      onQuoteStatusChange('deposited');
    }
    setIsDepositModalOpen(false);
  };

  // 1. ĐỒNG BỘ DỮ LIỆU STUDIO (DYNAMIC STUDIO PROFILE)
  const activeStudio = studio || currentStudio;
  const studioName = activeStudio?.name || quote.studioName || 'Studio Nhiếp Ảnh';
  const studioLogo =
    activeStudio?.logo_url ||
    (quote.studioAvatarUrl && !quote.studioAvatarUrl.includes('lensy-logo.png') ? quote.studioAvatarUrl : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('lensy_current_studio_logo') : null) ||
    '/mirmia-logo.png';
  const studioAddress =
    activeStudio?.address || quote.studioAddress || '';
  const studioTaxCode =
    (activeStudio as any)?.tax_code ||
    (activeStudio as any)?.tax_id ||
    quote.studioTaxCode ||
    '';
  const studioPhone =
    activeStudio?.phone || quote.studioPhone || quote.photographerPhone || '';
  const studioEmail =
    activeStudio?.email || quote.studioEmail || quote.photographerEmail || '';

  // 2. ĐỒNG BỘ SỐ BÁO GIÁ & NỘI DUNG CHUYỂN KHOẢN
  const rawId = quote.quoteToken || quote.id || '2026';
  const cleanId = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  const quoteNo = `BG-${cleanId || '2026'}`;
  const transferMemo = `Thanh toan BG ${cleanId || '2026'}`;

  // Thông tin ngân hàng
  const bankName = quote.bankInfo?.bankName || 'MB Bank (Ngân hàng Quân Đội)';
  const bankAccount = quote.bankInfo?.accountNumber || '0988123456888';
  const bankHolder = quote.bankInfo?.accountName || studioName;

  // Quyền lợi & sản phẩm bàn giao (Mục 2)
  const inclusionsList =
    quote.features && quote.features.length > 0
      ? quote.features
      : quote.deliverables && quote.deliverables.length > 0
      ? quote.deliverables
      : [
          'Chụp không giới hạn số lượng file trong suốt thời gian diễn ra buổi chụp.',
          'Chỉnh sửa màu sắc (Color Grading & Blend tone chuẩn Studio) toàn bộ file ảnh gốc.',
          'Retouch chuyên sâu chi tiết da, nếp nhăn và ánh sáng cho 50 - 80 ảnh chân dung đẹp nhất.',
          'Tặng 01 Photobook mở phẳng cao cấp bìa da/vải linen (30x30cm, 40 trang).',
          'Tặng 02 Ảnh cổng ép pha lê cao cấp khổ lớn (60x90cm).',
          'Bàn giao toàn bộ file gốc và file hoàn thiện qua Google Drive dung lượng vĩnh viễn trong 7 ngày làm việc.',
        ];

  return (
    <div className="w-full text-slate-800 font-sans selection:bg-slate-200">
      {/* ==================================================================== */}
      {/* WEB ACTION TOOLBAR (ẨN 100% KHI IN ẤN VĂN BẢN)                        */}
      {/* ==================================================================== */}
      <div className="no-print print:hidden mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs sm:text-sm font-semibold text-slate-700">
            Bản xem trước thư báo giá dịch vụ • Số {quoteNo}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Báo Giá / Lưu PDF (A4)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Xác Nhận & Đặt Cọc (30%)</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DOCUMENT SHEET: GIẤY TRẮNG MỰC ĐEN - CHUẨN A4 PHÁP LÝ VIỆT NAM        */}
      {/* ==================================================================== */}
      <div className="w-full max-w-[210mm] mx-auto bg-white p-6 sm:p-10 print:p-0 text-slate-800 leading-normal text-[13px] sm:text-sm space-y-4 print:space-y-3">
        {/* 1. HEADER HAI BÊN (ĐƠN VỊ CUNG CẤP & TIÊU ĐỀ BÁO GIÁ) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b-2 border-slate-800 items-start">
          {/* Header Trái: Logo & Thông tin Studio */}
          <div className="space-y-1 text-xs sm:text-[12px] text-slate-600">
            {/* Logo Studio */}
            <img
              src={studioLogo}
              alt={studioName}
              className="w-16 h-16 object-contain mb-2"
              onError={e => {
                (e.target as HTMLImageElement).src = '/mirmia-logo.png';
              }}
            />
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
              {studioName}
            </h2>
            {studioAddress && (
              <p>
                <span className="font-semibold text-slate-800">Địa chỉ:</span> {studioAddress}
              </p>
            )}
            {studioTaxCode && (
              <p>
                <span className="font-semibold text-slate-800">Mã số thuế:</span> {studioTaxCode}
              </p>
            )}
            {(studioPhone || studioEmail) && (
              <p>
                {studioPhone && (
                  <>
                    <span className="font-semibold text-slate-800">Hotline:</span> {studioPhone}
                  </>
                )}
                {studioPhone && studioEmail && ' | '}
                {studioEmail && (
                  <>
                    <span className="font-semibold text-slate-800">Email:</span> {studioEmail}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Header Phải: Báo Giá Dịch Vụ */}
          <div className="sm:text-right space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              BÁO GIÁ DỊCH VỤ
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              DỊCH VỤ NHIẾP ẢNH & SẢN XUẤT HÌNH ẢNH
            </p>
            <p className="text-xs text-slate-700">
              Số: <span className="font-bold text-slate-900">{quoteNo}</span>
            </p>
            <p className="text-xs text-slate-500 italic">
              {formatVietnameseDate(quote.eventDate)}
            </p>
          </div>
        </div>

        {/* 2. THÔNG TIN KHÁCH HÀNG (CLIENT INFORMATION) */}
        <div className="py-2 border-b border-slate-200 text-xs sm:text-[13px] space-y-1">
          <p className="text-sm">
            <span className="font-bold text-slate-900">Kính gửi:</span>{' '}
            <strong className="text-slate-900 uppercase font-bold text-base">
              {quote.clientName || 'Quý Khách Hàng'}
            </strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 pt-0.5">
            <p>
              <span className="font-semibold text-slate-800">Số điện thoại:</span>{' '}
              {quote.clientPhone || 'Chưa cập nhật'}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{' '}
              {quote.clientEmail || 'Chưa cập nhật'}
            </p>
            <p className="sm:text-right">
              <span className="font-semibold text-slate-800">Hiệu lực báo giá:</span>{' '}
              đến hết {quote.validUntil || '7 ngày sau'}
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PHẦN 1: CHI TIẾT LỊCH TRÌNH THỰC HIỆN                               */}
        {/* ==================================================================== */}
        <div className="space-y-1.5 pt-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300">
            1. CHI TIẾT LỊCH TRÌNH THỰC HIỆN
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-[13px] pt-1">
            <p>
              <span className="font-semibold text-slate-700">• Gói dịch vụ:</span>{' '}
              <strong className="text-slate-900 font-bold">{quote.sessionTitle || 'Chụp Ảnh Phóng Sự Cưới'}</strong>
            </p>
            <p>
              <span className="font-semibold text-slate-700">• Ngày bấm máy:</span>{' '}
              <strong className="text-slate-900 font-bold">{quote.eventDate || 'Theo thỏa thuận'}</strong>
            </p>
            <p>
              <span className="font-semibold text-slate-700">• Khung thời gian:</span>{' '}
              <span className="text-slate-900 font-medium">{quote.startTime || '08:00'} - {quote.endTime || '12:00'}</span>
            </p>
            <p>
              <span className="font-semibold text-slate-700">• Địa điểm thực hiện:</span>{' '}
              <span className="text-slate-900">{quote.location || 'Tại Studio / Địa chỉ thỏa thuận'}</span>
            </p>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PHẦN 2: QUYỀN LỢI DỊCH VỤ & SẢN PHẨM BÀN GIAO (BULLET POINTS)       */}
        {/* ==================================================================== */}
        <div className="space-y-1.5 pt-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300">
            2. QUYỀN LỢI DỊCH VỤ & SẢN PHẨM BÀN GIAO
          </h3>
          <ul className="space-y-1 text-xs sm:text-[12.5px] text-slate-700 pt-1 leading-relaxed">
            {inclusionsList.map((inc, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-slate-400 font-bold">•</span>
                <span>{inc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ==================================================================== */}
        {/* PHẦN 3: BẢNG QUYẾT TOÁN TÀI CHÍNH & THÔNG TIN CHUYỂN KHOẢN          */}
        {/* ==================================================================== */}
        <div className="space-y-2 pt-1 break-inside-avoid">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300">
            3. BẢNG QUYẾT TOÁN TÀI CHÍNH
          </h3>

          {/* Bảng Kế Toán Mảnh Mực */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-[12.5px] border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-1.5 px-2.5 border-r border-slate-300 text-center w-10">STT</th>
                  <th className="py-1.5 px-3 border-r border-slate-300">NỘI DUNG DỊCH VỤ</th>
                  <th className="py-1.5 px-2.5 border-r border-slate-300 text-center w-14">ĐVT</th>
                  <th className="py-1.5 px-2 border-r border-slate-300 text-center w-12">SL</th>
                  <th className="py-1.5 px-3 border-r border-slate-300 text-right w-28">ĐƠN GIÁ</th>
                  <th className="py-1.5 px-3 text-right w-32">THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-2.5 border-r border-slate-300 text-center font-medium">01</td>
                  <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-900">
                    {quote.sessionTitle || 'Trọn Gói Chụp Ảnh Dịch Vụ'}
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-300 text-center text-slate-600">Gói</td>
                  <td className="py-2 px-2 border-r border-slate-300 text-center font-bold">01</td>
                  <td className="py-2 px-3 border-r border-slate-300 text-right">
                    {formatVND(quote.packagePrice)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatVND(quote.packagePrice)}
                  </td>
                </tr>

                {/* Tổng tiền */}
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={5} className="py-1.5 px-3 border-r border-slate-300 text-right uppercase text-slate-900 font-bold">
                    Tổng Giá Trị Hợp Đồng:
                  </td>
                  <td className="py-1.5 px-3 text-right font-black text-slate-900 text-sm">
                    {formatVND(quote.packagePrice)}
                  </td>
                </tr>

                {/* Tiền Cọc 30% */}
                <tr className="text-slate-700 bg-white">
                  <td colSpan={5} className="py-1.5 px-3 border-r border-slate-300 text-right font-medium">
                    Tiền đặt cọc giữ lịch ({quote.depositPercentage || 30}%):
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                    {formatVND(quote.depositAmount)}
                  </td>
                </tr>

                {/* Tiền Còn Lại */}
                <tr className="text-slate-700 bg-white">
                  <td colSpan={5} className="py-1.5 px-3 border-r border-slate-300 text-right font-medium">
                    Số tiền còn lại thanh toán khi bàn giao file hoàn thiện (70%):
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                    {formatVND(quote.remainingAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Khối Thông Tin Chuyển Khoản Ngân Hàng (Phần Kết Thúc Thư Báo Giá) */}
          <div className="p-3 border border-slate-300 bg-slate-50/70 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wide text-[11px]">
                Thông Tin Tài Khoản Thanh Toán:
              </span>
              <p>
                • Ngân hàng:{' '}
                <strong className="text-slate-900 font-semibold">{bankName}</strong>
              </p>
              <p>
                • Số tài khoản:{' '}
                <strong className="text-slate-900 font-mono tracking-wider font-bold">
                  {bankAccount}
                </strong>
              </p>
              <p>
                • Chủ tài khoản:{' '}
                <strong className="text-slate-900 uppercase font-semibold">{bankHolder}</strong>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wide text-[11px]">
                Nội Dung Chuyển Khoản:
              </span>
              <p className="p-1 px-2 bg-white border border-slate-300 font-mono font-bold text-slate-900 inline-block text-xs">
                {transferMemo}
              </p>
              <p className="text-[11px] text-slate-500 italic mt-0.5 leading-snug">
                * Quý khách vui lòng ghi đúng nội dung chuyển khoản để hệ thống tự động khóa lịch và bảo lưu quyền lợi hợp đồng.
              </p>
            </div>
          </div>

          {/* Lời Cảm Ơn Kết Thúc Thư Báo Giá */}
          <div className="pt-3 pb-1 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 italic">
            <p>Xin chân thành cảm ơn Quý khách đã tin tưởng và lựa chọn dịch vụ của {studioName}.</p>
            <div className="not-italic flex items-center gap-1.5 text-[11px] text-slate-400">
              <img src="/lensy-logo.png" alt="Lensy CRM" className="w-3.5 h-3.5 object-contain rounded" />
              <span>Powered by <strong className="font-semibold text-slate-600">Lensy</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thanh toán / Đặt cọc VietQR khi người dùng bấm trên web */}
      <DepositModal
        quote={quote}
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onConfirmDeposit={handleConfirmDeposit}
        paymentType="deposit"
      />
    </div>
  );
};

export default LegalQuoteDocument;
