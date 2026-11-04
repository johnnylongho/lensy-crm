import React from 'react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
}

export const QuoteHeader: React.FC<Props> = ({ quote }) => {
  const logoSrc = quote.studioAvatarUrl || '/mirmia-logo.png';
  const rawTitle = quote.sessionTitle?.trim();
  const displayTitle = rawTitle
    ? `THƯ ĐỀ XUẤT DỊCH VỤ: ${rawTitle.toUpperCase()}`
    : 'THƯ ĐỀ XUẤT DỊCH VỤ NHIẾP ẢNH';

  return (
    <div className="pt-2 sm:pt-4 pb-2 px-2 text-center print:pt-0 print:pb-1 print:px-0 print:m-0 break-inside-avoid print:break-inside-avoid">
      {/* Studio Brand Logo: Hình vuông nguyên bản, KHÔNG viền, KHÔNG bo tròn cắt lẹm */}
      <div className="flex justify-center mb-1.5 print:mb-1">
        <img
          src={logoSrc}
          alt={quote.studioName || 'Studio Logo'}
          className="w-16 h-16 sm:w-20 sm:h-20 print:w-16 print:h-16 object-contain rounded-none border-none mx-auto"
          onError={e => {
            (e.target as HTMLImageElement).src = '/mirmia-logo.png';
          }}
        />
      </div>

      {/* Studio Brand Name */}
      <div className="space-y-0.5">
        <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-500 font-extrabold print:text-[10px]">
          {quote.studioName || 'MIRMIA STUDIO & ACADEMY'}
        </h3>

        {/* Dynamic Proposal Title (Tiêu đề động) */}
        <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-wide text-center mt-1 print:text-sm print:mt-0.5">
          {displayTitle}
        </h1>
      </div>

      {/* Lời chào khách hàng chuẩn mực */}
      <p className="text-xs sm:text-sm text-slate-600 text-center mt-1.5 print:mt-1 print:text-[11px] max-w-2xl mx-auto leading-relaxed">
        Kính gửi <strong>{quote.clientName || 'Quý khách'}</strong>, {quote.studioName || 'MIRMIA Studio'} hân hạnh gửi đến Quý khách thông tin chi tiết về gói dịch vụ.
      </p>
    </div>
  );
};
