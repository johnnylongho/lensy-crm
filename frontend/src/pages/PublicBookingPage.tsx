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
 * Áp dụng hệ màu chuẩn Lensy CRM: Midnight Obsidian (Dark Mode) & Clean Slate (Light Mode)
 * với điểm nhấn Cam Hổ Phách (Primary Orange CTA).
 */
export const PublicBookingPage: React.FC<Props> = (props) => {
  return <QuoteView {...props} />;
};

export default PublicBookingPage;

