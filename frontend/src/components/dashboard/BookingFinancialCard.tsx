import React from 'react';
import { BookingStatus } from '../../types';
import { DollarSign, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';

interface Props {
  packagePrice: number;
  depositAmount: number;
  status: BookingStatus;
  paidAmount?: number;
  compact?: boolean;
}

export const BookingFinancialCard: React.FC<Props> = ({
  packagePrice,
  depositAmount,
  status,
  paidAmount,
  compact = false,
}) => {
  // Tính tiền cọc: Nếu Đã nhận cọc (da_chot) mà depositAmount = 0 thì tự động tính 30%
  const effectiveDeposit =
    status === 'da_chot' && (!depositAmount || depositAmount === 0)
      ? Math.round(packagePrice * 0.3)
      : depositAmount;

  // Tiền đã thu thực tế:
  // - Hoàn thành: 100%
  // - Chờ cọc: 0 đ
  // - Đã nhận cọc / Đã trả file: tiền cọc
  const effectivePaid =
    status === 'hoan_thanh'
      ? packagePrice
      : status === 'cho_coc'
      ? 0
      : paidAmount && paidAmount > 0
      ? paidAmount
      : effectiveDeposit;

  // Số tiền nợ đọng (Remaining Balance = Tổng tiền - Đã cọc/Đã thanh toán)
  const remainingDebt = Math.max(0, packagePrice - effectivePaid);

  const isDeposit30 =
    packagePrice > 0 && Math.abs(effectiveDeposit - packagePrice * 0.3) < 1000;

  if (compact) {
    return (
      <div className="space-y-1 font-mono text-xs">
        <div className="flex items-center justify-between gap-2 text-slate-300">
          <span className="text-gray-400 text-xs font-sans">Tổng gói:</span>
          <span className="font-bold text-white text-right">
            {packagePrice.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-emerald-400">
          <span className="text-gray-400 text-xs font-sans">Đã cọc:</span>
          <span className="font-bold text-right flex items-center justify-end gap-1">
            <span>{effectiveDeposit.toLocaleString('vi-VN')} đ</span>
            {isDeposit30 && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-sans">
                30%
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400 text-xs font-sans">Nợ đọng:</span>
          <span className={`font-bold text-right ${remainingDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {remainingDebt === 0 ? '0 đ' : `${remainingDebt.toLocaleString('vi-VN')} đ`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 font-mono text-xs">
      <div className="flex items-center justify-between text-slate-300">
        <span className="text-slate-400 flex items-center gap-1 font-sans">
          <DollarSign className="w-3 h-3 text-amber-400" />
          Tổng giá trị gói:
        </span>
        <span className="font-bold text-white text-xs">
          {packagePrice.toLocaleString('vi-VN')} đ
        </span>
      </div>

      <div className="flex items-center justify-between text-emerald-400">
        <span className="text-slate-400 flex items-center gap-1 font-sans">
          <Wallet className="w-3 h-3 text-emerald-400" />
          Số tiền đã cọc:
        </span>
        <span className="font-bold flex items-center gap-1">
          <span>{effectiveDeposit.toLocaleString('vi-VN')} đ</span>
          {isDeposit30 && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-sans">
              30%
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
        <span className="text-slate-400 flex items-center gap-1 font-sans">
          {remainingDebt > 0 ? (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
          Số tiền nợ đọng:
        </span>
        <span
          className={`font-bold ${
            remainingDebt > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          {remainingDebt === 0
            ? '0 đ (Đã trả đủ)'
            : `${remainingDebt.toLocaleString('vi-VN')} đ`}
        </span>
      </div>
    </div>
  );
};
