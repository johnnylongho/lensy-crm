import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { QuoteData } from '../../types';

interface Props {
  quote: QuoteData;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeposit: () => void;
}

export const DepositModal: React.FC<Props> = ({ quote, isOpen, onClose, onConfirmDeposit }) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const transferContent = `COC ${quote.quoteToken}`;
  const qrUrl = `https://api.vietqr.io/image/970422-${quote.bankInfo.accountNumber}-compact.png?amount=${quote.depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(quote.bankInfo.accountName)}`;

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleSuccessSubmit = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onConfirmDeposit();
      onClose();
      setIsSuccess(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Xác Nhận Cọc Thành Công!</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Hệ thống đã tự động khóa lịch cho bạn. Tin nhắn biên nhận đã được ghi nhận.
            </p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5" />
                Cổng Chuyển Khoản Trực Tiếp (VietQR)
              </div>
              <h3 className="text-lg font-bold text-white">
                Đặt Cọc Giữ Lịch Chụp
              </h3>
              <p className="text-xs text-slate-400">
                Quét mã QR qua app ngân hàng để hoàn tất tự động
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl w-48 h-48 mx-auto shadow-lg flex items-center justify-center">
              <img
                src={qrUrl}
                alt="VietQR Chuyển Khoản Cọc"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bank details copy helper */}
            <div className="space-y-2 text-xs bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Ngân Hàng:
                </span>
                <span className="font-bold text-white">{quote.bankInfo.bankName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {quote.bankInfo.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(quote.bankInfo.accountNumber, setCopiedAccount)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy STK"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-slate-200 uppercase">{quote.bankInfo.accountName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Số tiền cọc:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {quote.depositAmount.toLocaleString('vi-VN')} đ
                  </span>
                  <button
                    onClick={() => handleCopy(String(quote.depositAmount), setCopiedAmount)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy số tiền"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400 text-xs">
                    {transferContent}
                  </span>
                  <button
                    onClick={() => handleCopy(transferContent, setCopiedContent)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy nội dung"
                  >
                    {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSuccessSubmit}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Tôi Đã Hoàn Tất Chuyển Khoản</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Để Tôi Chuyển Sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
