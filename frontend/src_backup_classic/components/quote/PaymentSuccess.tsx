import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Building2,
  CreditCard,
  DollarSign,
  Phone,
  MessageCircle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  clientName: string;
  clientPhone: string;
  depositAmount: number;
  sessionTitle?: string;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  studioPhone?: string;
  onReset?: () => void;
}

// Bảng tra mã ngân hàng chuẩn VietQR
export function getVietQrBankCode(bankName?: string): string {
  if (!bankName) return 'MB';
  const norm = bankName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('mb') || norm.includes('quandoi')) return 'MB';
  if (norm.includes('vietcom') || norm.includes('vcb')) return 'VCB';
  if (norm.includes('techcom') || norm.includes('tcb')) return 'TCB';
  if (norm.includes('acb')) return 'ACB';
  if (norm.includes('vpbank') || norm.includes('vpb')) return 'VPB';
  if (norm.includes('tpbank') || norm.includes('tpb')) return 'TPB';
  if (norm.includes('bidv')) return 'BIDV';
  if (norm.includes('vietin') || norm.includes('icb')) return 'ICB';
  if (norm.includes('sacom') || norm.includes('stb')) return 'STB';
  if (norm.includes('vib')) return 'VIB';
  if (norm.includes('hdbank') || norm.includes('hdb')) return 'HDB';
  if (norm.includes('msb')) return 'MSB';
  if (norm.includes('ocb')) return 'OCB';
  if (norm.includes('seabank')) return 'SEAB';
  return 'MB';
}

export const PaymentSuccess: React.FC<Props> = ({
  clientName,
  clientPhone,
  depositAmount = 1000000,
  sessionTitle,
  bankInfo,
  studioPhone,
  onReset,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  // Kiểm tra thợ ảnh đã cập nhật thông tin ngân hàng hay chưa
  const hasBankInfo = Boolean(
    bankInfo &&
      bankInfo.accountNumber &&
      bankInfo.accountNumber.trim().length > 0 &&
      bankInfo.bankName &&
      bankInfo.bankName.trim().length > 0
  );

  const bankCode = getVietQrBankCode(bankInfo?.bankName);
  const bankAccount = (bankInfo?.accountNumber || '').trim();
  const accountName = (bankInfo?.accountName || '').trim().toUpperCase();

  // Số tiền cọc: Tạm thời mặc định là 1000000 (1 triệu VNĐ) hoặc lấy theo cấu hình gói chụp
  const finalDepositAmount = depositAmount > 0 ? depositAmount : 1000000;

  // Cú pháp nội dung chuyển khoản: "Coc lich chup " + SĐT khách hàng
  const transferContent = `Coc lich chup ${clientPhone.replace(/[^0-9]/g, '')}`;

  // URL VietQR chuẩn theo cấu trúc yêu cầu
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${finalDepositAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountName)}`;

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const cleanStudioPhone = (studioPhone || '0901234567').replace(/[^0-9]/g, '');

  return (
    <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6 text-slate-100 animate-fadeIn">
      {/* Banner Thành công & Lời cảm ơn */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
          Đăng Ký Thành Công
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          Cảm ơn bạn! Lịch chụp của bạn đã được ghi nhận.
        </h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          {hasBankInfo
            ? 'Vui lòng quét mã QR dưới đây để tiến hành đặt cọc và giữ lịch.'
            : 'Studio sẽ liên hệ với bạn qua Số điện thoại/Zalo để hướng dẫn đặt cọc.'}
        </p>
      </div>

      {/* Thông tin buổi chụp tóm tắt */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>Khách hàng:</span>
          <span className="font-bold text-slate-200 font-sans">{clientName}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Số điện thoại (Zalo):</span>
          <span className="font-bold text-amber-400">{clientPhone}</span>
        </div>
        {sessionTitle && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Gói chụp:</span>
            <span className="text-slate-200 font-sans">{sessionTitle}</span>
          </div>
        )}
      </div>

      {/* Khối hiển thị VietQR hoặc Fallback */}
      {hasBankInfo ? (
        <div className="space-y-5">
          {/* Ảnh Mã QR Căn Giữa Màn Hình, Sắc Nét & Thân Thiện Di Động */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="p-3 bg-white rounded-3xl shadow-2xl shadow-amber-500/10 border-4 border-amber-400/60 max-w-[280px] sm:max-w-[320px] w-full transition-transform hover:scale-[1.02]">
              <img
                src={qrUrl}
                alt="Mã VietQR Đặt Cọc Lịch Chụp"
                className="w-full h-auto rounded-xl object-contain mx-auto block"
                loading="eager"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Mở App Ngân Hàng quét mã để chuyển khoản 1-chạm</span>
            </p>
          </div>

          {/* Chi tiết thông tin chuyển khoản kèm nút Copy nhanh */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              <span>Thông Tin Chuyển Khoản Thủ Công</span>
              <span className="text-amber-400">Napas 247</span>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              {/* Ngân hàng */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-slate-200 font-mono">
                  {bankInfo?.bankName || 'MB Bank'}
                </span>
              </div>

              {/* Số tài khoản */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-white text-sm">
                    {bankAccount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankAccount, setCopiedAccount)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy số tài khoản"
                  >
                    {copiedAccount ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-slate-200">{accountName}</span>
              </div>

              {/* Số tiền cọc */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">Số tiền cọc:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-emerald-400">
                    {finalDepositAmount.toLocaleString('vi-VN')} đ
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(finalDepositAmount.toString(), setCopiedAmount)
                    }
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy số tiền"
                  >
                    {copiedAmount ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300">
                    {transferContent}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferContent, setCopiedContent)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy nội dung chuyển khoản"
                  >
                    {copiedContent ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lưu ý sau cọc */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Ngay sau khi nhận được tiền cọc, ekip sẽ gửi xác nhận và khóa lịch chụp cho bạn!
            </span>
          </div>
        </div>
      ) : (
        /* Fallback: Nếu thợ ảnh chưa cập nhật ngân hàng trong Settings */
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-amber-200">
            Studio sẽ liên hệ với bạn qua Số điện thoại/Zalo để hướng dẫn đặt cọc.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <a
              href={`https://zalo.me/${cleanStudioPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-bold transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Nhắn Zalo Với Studio</span>
            </a>
            <a
              href={`tel:${cleanStudioPhone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi Hotline ({cleanStudioPhone})</span>
            </a>
          </div>
        </div>
      )}

      {/* Nút đặt lịch thêm nếu cần */}
      {onReset && (
        <div className="pt-2 border-t border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors py-1 px-3 rounded-lg hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đặt thêm lịch chụp khác</span>
          </button>
        </div>
      )}
    </div>
  );
};
