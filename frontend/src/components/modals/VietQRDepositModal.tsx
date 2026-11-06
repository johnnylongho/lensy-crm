import React, { useState } from 'react';
import {
  QrCode,
  X,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateVietQRUrl } from '../../utils/vietqr';
import { formatVND } from '../../utils/finance';

interface VietQRDepositModalProps {
  booking: CalendarEvent;
  onClose: () => void;
  onSuccess?: () => void;
}

export const VietQRDepositModal: React.FC<VietQRDepositModalProps> = ({
  booking,
  onClose,
  onSuccess,
}) => {
  const { currentStudio } = useWorkspace();
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [isSimulatingSuccess, setIsSimulatingSuccess] = useState(false);

  // Lấy cấu hình ngân hàng studio từ currentStudio hoặc localStorage
  let bankName = currentStudio?.bank_name || 'MB Bank';
  let bankAccount = currentStudio?.bank_account || '0901234567';
  let bankAccountName = currentStudio?.bank_account_name || currentStudio?.name || 'MIRMIA STUDIO';

  try {
    const metaStr = currentStudio?.id ? localStorage.getItem(`lensy_studio_meta_${currentStudio.id}`) : null;
    if (metaStr) {
      const meta = JSON.parse(metaStr);
      if (meta.bank_name) bankName = meta.bank_name;
      if (meta.bank_account) bankAccount = meta.bank_account;
      if (meta.bank_account_name) bankAccountName = meta.bank_account_name;
    }
  } catch (e) {}

  const isDepositPending =
    booking.status === 'cho_coc' ||
    (booking.status as any) === 'lead' ||
    !booking.paidAmount ||
    booking.paidAmount === 0;

  const payAmount = isDepositPending
    ? booking.depositAmount || Math.round((booking.packagePrice * 30) / 100)
    : Math.max(0, (booking.remainingAmount !== undefined ? booking.remainingAmount : booking.packagePrice - (booking.paidAmount || 0)));

  const bookingCode = (booking.quoteToken || booking.id.slice(0, 6)).toUpperCase();
  const phoneTail = (booking.clientPhone || '0000').slice(-4);
  const transferMemo = `COC BG ${bookingCode} ${phoneTail}`;

  const qrImageUrl = generateVietQRUrl({
    bankId: bankName.includes('MB') ? 'MB' : bankName.includes('VCB') || bankName.includes('Vietcom') ? 'VCB' : bankName.includes('Techcom') ? 'TCB' : 'MB',
    accountNo: bankAccount,
    accountName: bankAccountName,
    amount: payAmount,
    description: transferMemo,
  });

  const handleCopyAcc = () => {
    navigator.clipboard.writeText(bankAccount);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(transferMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleSimulatePaymentReceived = () => {
    setIsSimulatingSuccess(true);
    setTimeout(() => {
      setIsSimulatingSuccess(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Mã VietQR Thu Tiền Ca Chụp
              </h3>
              <p className="text-xs text-slate-400">
                Quét mã để thu cọc hoặc quyết toán tức thì
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Show Info Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {booking.clientName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {booking.sessionTitle || `Gói Chụp ${booking.sessionType?.toUpperCase()}`} · Ngày {booking.eventDate}
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
            #{bookingCode}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="mt-5 flex flex-col items-center">
          <div className="relative p-3.5 rounded-2xl bg-white border border-slate-200 shadow-md">
            <img
              src={qrImageUrl}
              alt="VietQR Chuyển Khoản"
              className="w-56 h-auto rounded-xl object-contain"
            />
            <div className="mt-2 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                NAPAS 247 · VietQR Chuẩn
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">Số tiền cần thanh toán</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-sans tabular-nums tracking-tight">
              {formatVND(payAmount)}
            </div>
          </div>
        </div>

        {/* Account Details with Copy Buttons */}
        <div className="mt-5 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div>
              <span className="text-slate-400 block text-[10px]">TÀI KHOẢN THỤ HƯỞNG</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {bankName} · {bankAccount}
              </span>
            </div>
            <button
              onClick={handleCopyAcc}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-600 hover:bg-slate-100 font-semibold text-[11px] transition shadow-2xs"
            >
              {copiedAcc ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Sao chép STK</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div>
              <span className="text-slate-400 block text-[10px]">NỘI DUNG CHUYỂN KHOẢN (MEMO)</span>
              <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                {transferMemo}
              </span>
            </div>
            <button
              onClick={handleCopyMemo}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-600 hover:bg-slate-100 font-semibold text-[11px] transition shadow-2xs"
            >
              {copiedMemo ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Sao chép memo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSimulatePaymentReceived}
            disabled={isSimulatingSuccess}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition shadow-sm shadow-emerald-600/20 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSimulatingSuccess ? 'Đang xác nhận...' : 'Xác Nhận Đã Nhận Tiền'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

