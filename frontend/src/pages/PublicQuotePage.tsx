import React from 'react';
import { QuoteView } from '../components/quote/QuoteView';
import { QuoteData } from '../types';

interface Props {
  initialQuote?: QuoteData;
  onQuoteStatusChange?: (newStatus: QuoteData['status']) => void;
  onBookingSubmit?: (newBooking: any) => void;
}

/**
 * PublicQuotePage:
 * Giao diện Báo Giá Dịch Vụ / Hợp Đồng Nguyên Tắc chuẩn mực văn bản pháp lý Việt Nam.
 * - Khổ giấy in A4 tiêu chuẩn (max-w-[210mm]).
 * - Loại bỏ hoàn toàn phong cách Web Dashboard (card đổ bóng, badges màu, timeline, icons thừa).
 * - Chuẩn "Giấy trắng mực đen": Bảng kế toán, thông tin pháp lý MST, điều khoản, khu vực ký tên 2 bên.
 */
export const PublicQuotePage: React.FC<Props> = (props) => {
  return (
    <div className="w-full min-h-screen bg-slate-100/80 print:bg-white text-slate-800 font-sans selection:bg-slate-200 py-6 sm:py-8 print:py-0 print:p-0">
      <div className="w-full max-w-[210mm] mx-auto shadow-lg print:shadow-none">
        <QuoteView {...props} />
      </div>
    </div>
  );
};

export default PublicQuotePage;
