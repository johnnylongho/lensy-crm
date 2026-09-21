import React from 'react';
import { CreditCard, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
  onOpenDepositModal: () => void;
}

export const QuotePriceSummary: React.FC<Props> = ({ quote, onOpenDepositModal }) => {
  const isConfirmed = quote.status === 'da_chot' || quote.status === 'hoan_thanh';

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#0c121e] border border-amber-500/30 p-5 sm:p-7 shadow-2xl space-y-6 gold-glow">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
            Bảng Quyết Toán Tài Chính
          </span>
          <h3 className="text-base font-bold text-white">Tổng Chi Phí Trọn Gói</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
            {quote.packagePrice.toLocaleString('vi-VN')} <span className="text-sm font-normal text-amber-400">VNĐ</span>
          </div>
        </div>
      </div>

      {/* Breakdown Rows */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div>
            <span className="font-bold text-amber-200 block text-xs sm:text-sm">
              Tiền Đặt Cọc Giữ Lịch ({quote.depositPercentage}%)
            </span>
            <span className="text-[10px] text-amber-300/80">Khóa lịch thợ & trang thiết bị ngay khi hoàn tất</span>
          </div>
          <div className="text-right font-mono font-bold text-amber-300 text-base sm:text-lg">
            {quote.depositAmount.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div>
            <span className="font-semibold text-slate-300 block text-xs">
              Khoản Còn Lại ({100 - quote.depositPercentage}%)
            </span>
            <span className="text-[10px] text-slate-500">Quyết toán sau khi nghiệm thu và bàn giao file ảnh hoàn chỉnh</span>
          </div>
          <div className="text-right font-mono text-slate-300 text-sm">
            {quote.remainingAmount.toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Guarantee Note */}
      <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-white/[0.02] p-3 rounded-xl border border-white/5">
        <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          Báo giá có hiệu lực đến hết ngày <strong className="text-slate-200">{quote.validUntil}</strong>. Quý khách vui lòng xác nhận và đặt cọc sớm để giữ trọn vẹn ekip ưng ý nhất.
        </span>
      </div>

      {/* Main Action Button */}
      {isConfirmed ? (
        <div className="w-full py-4 px-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            Lịch Chụp Đã Được Chốt Thành Công!
          </div>
          <p className="text-[11px] text-emerald-300/80">
            Ekip sẽ liên hệ trực tiếp trước ngày chụp để chốt trang phục và timeline chi tiết.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenDepositModal}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2.5"
        >
          <CreditCard className="w-5 h-5 text-slate-950" />
          <span>Xác Nhận & Cọc Tiền ({quote.depositAmount.toLocaleString('vi-VN')} đ)</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      )}
    </div>
  );
};
