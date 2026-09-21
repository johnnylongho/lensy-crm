import React, { useState } from 'react';
import { QuoteHeader } from './QuoteHeader';
import { QuoteSessionInfo } from './QuoteSessionInfo';
import { QuoteInclusions } from './QuoteInclusions';
import { QuoteEquipment } from './QuoteEquipment';
import { QuotePriceSummary } from './QuotePriceSummary';
import { DepositModal } from './DepositModal';
import { QuoteData } from '../../types';
import { Phone, Mail, MessageCircle, Heart } from 'lucide-react';

interface Props {
  initialQuote: QuoteData;
  onQuoteStatusChange?: (newStatus: QuoteData['status']) => void;
}

export const QuoteView: React.FC<Props> = ({ initialQuote, onQuoteStatusChange }) => {
  const [quote, setQuote] = useState<QuoteData>(initialQuote);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const handleConfirmDeposit = () => {
    const updated: QuoteData = {
      ...quote,
      status: 'da_chot',
    };
    setQuote(updated);
    if (onQuoteStatusChange) {
      onQuoteStatusChange('da_chot');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col luxury-gradient">
      {/* Container - Mobile-first width */}
      <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-8 space-y-6 flex-1">
        {/* Quote Header */}
        <QuoteHeader quote={quote} />

        {/* Session Primary Info */}
        <QuoteSessionInfo quote={quote} />

        {/* Package Inclusions & Deliverables */}
        <QuoteInclusions
          inclusions={quote.inclusions}
          deliverables={quote.deliverables}
        />

        {/* Equipment Guarantee */}
        <QuoteEquipment equipmentList={quote.equipmentList} />

        {/* Price Breakdown & Deposit Trigger */}
        <QuotePriceSummary
          quote={quote}
          onOpenDepositModal={() => setIsDepositModalOpen(true)}
        />

        {/* Photographer Contact Card */}
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-5 text-center space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hỗ Trợ & Tư Vấn Trực Tiếp
          </h4>
          <p className="text-xs text-slate-300">
            Có bất kỳ thắc mắc hoặc cần điều chỉnh timeline, quý khách hãy liên hệ với thợ ảnh chính:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <a
              href={`tel:${quote.photographerPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{quote.photographerPhone}</span>
            </a>
            <a
              href={`https://zalo.me/${quote.photographerPhone.replace(/^0/, '84')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-blue-200"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Nhắn Zalo</span>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-4 text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <span>Được tạo bởi Lensy Studio Platform</span>
          <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" />
        </div>
      </div>

      {/* Deposit QR & Transfer Modal */}
      <DepositModal
        quote={quote}
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onConfirmDeposit={handleConfirmDeposit}
      />
    </div>
  );
};
