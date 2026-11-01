import React from 'react';
import { QuoteView } from '../components/quote/QuoteView';
import { QuoteData } from '../types';

interface Props {
  initialQuote?: QuoteData;
  onQuoteStatusChange?: (newStatus: QuoteData['status']) => void;
  onBookingSubmit?: (newBooking: any) => void;
}

/**
 * PublicBookingPage:
 * Trang Đặt Lịch Công Khai dành riêng cho khách hàng (Public Booking Experience).
 * Áp dụng nguyên tắc Mobile-First:
 * - Triệt tiêu hoàn toàn thanh cuộn ngang (overflow-x-hidden w-full max-w-full)
 * - Lưới giá dịch vụ responsive (1 cột trên mobile, 2 cột trên tablet, 3 cột trên desktop)
 * - Nút CTA xác nhận tối ưu vùng bấm cảm ứng (min-h-[48px], sticky chân trang)
 */
export const PublicBookingPage: React.FC<Props> = (props) => {
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen relative">
      <QuoteView {...props} />
    </div>
  );
};

export default PublicBookingPage;
