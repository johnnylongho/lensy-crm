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
 * Trang Đặt Lịch Công Khai (Public Client Booking Portal - Standard Web & Mobile-First).
 * - Giải phóng hoàn toàn các ràng buộc khổ in A4 (max-w-[210mm], aspect-[1/1.414], min-h-[297mm]).
 * - Bố cục Container chuẩn web: max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 trên nền sáng bg-slate-50.
 */
export const PublicBookingPage: React.FC<Props> = (props) => {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500/20">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuoteView {...props} />
      </div>
    </div>
  );
};

export default PublicBookingPage;
