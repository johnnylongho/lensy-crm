import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  X,
  Copy,
  Check,
  MessageSquareQuote,
  Sparkles,
  QrCode,
  ExternalLink,
  DollarSign,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  booking: CalendarEvent | null;
  onClose: () => void;
  onCopied?: (text: string) => void;
  photographerBankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    studioName?: string;
  };
}

type ToneType = 'gentle' | 'professional' | 'short';

// Hàm ánh xạ tên ngân hàng sang mã định danh VietQR
function getVietQrBankSlug(bankName: string): string {
  const lower = (bankName || '').toLowerCase();
  if (lower.includes('techcom')) return 'techcombank';
  if (lower.includes('vietcom') || lower.includes('vcb')) return 'vietcombank';
  if (lower.includes('tiên phong') || lower.includes('tpbank')) return 'tpbank';
  if (lower.includes('acb') || lower.includes('á châu')) return 'acb';
  if (lower.includes('vpbank') || lower.includes('thịnh vượng')) return 'vpbank';
  if (lower.includes('bidv')) return 'bidv';
  if (lower.includes('vietin') || lower.includes('icb') || lower.includes('ctg')) return 'vietinbank';
  if (lower.includes('sacom')) return 'sacombank';
  if (lower.includes('vib')) return 'vib';
  if (lower.includes('hdbank') || lower.includes('hd')) return 'hdbank';
  if (lower.includes('msb') || lower.includes('hàng hải')) return 'msb';
  if (lower.includes('ocb')) return 'ocb';
  if (lower.includes('seabank')) return 'seabank';
  return 'mbbank';
}

export const DebtReminderModal: React.FC<Props> = ({
  isOpen,
  booking,
  onClose,
  onCopied,
  photographerBankInfo,
}) => {
  const { user } = useAuth();
  const [selectedTone, setSelectedTone] = useState<ToneType>('gentle');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  // Bank Info State (Lấy chính xác từ Cài Đặt của Thợ ảnh)
  const [bankName, setBankName] = useState<string>(photographerBankInfo?.bankName || 'MB Bank');
  const [accountNumber, setAccountNumber] = useState<string>(photographerBankInfo?.accountNumber || '0901234567');
  const [accountName, setAccountName] = useState<string>(photographerBankInfo?.accountName || 'JOHNNY LONG HO');
  const [studioName, setStudioName] = useState<string>(photographerBankInfo?.studioName || 'MIRMIA STUDIO & ACADEMY');

  // Lấy dữ liệu ngân hàng thời gian thực từ bảng users của thợ ảnh
  useEffect(() => {
    if (photographerBankInfo?.accountNumber) {
      setBankName(photographerBankInfo.bankName || 'MB Bank');
      setAccountNumber(photographerBankInfo.accountNumber);
      setAccountName(photographerBankInfo.accountName || 'JOHNNY LONG HO');
      setStudioName(photographerBankInfo.studioName || 'MIRMIA STUDIO & ACADEMY');
      return;
    }

    if (!user) return;

    if (isSupabaseConfigured) {
      supabase
        .from('users')
        .select('bank_name, bank_account_number, bank_account_name, studio_name, full_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data && !error) {
            if (data.bank_name) setBankName(data.bank_name);
            if (data.bank_account_number) setAccountNumber(data.bank_account_number);
            if (data.bank_account_name || data.full_name) {
              setAccountName(data.bank_account_name || data.full_name);
            }
            if (data.studio_name) setStudioName(data.studio_name);
          }
        });
    }
  }, [user, photographerBankInfo]);

  // Calculate Remaining Balance
  const packagePrice = booking?.packagePrice || 0;
  const depositAmount =
    booking?.depositAmount || Math.round(packagePrice * 0.3);
  const paidAmount = booking?.paidAmount || depositAmount;
  const remainingDebt = Math.max(0, packagePrice - paidAmount);

  // Sinh template tin nhắn theo Tone đã chọn và thông tin ngân hàng thực tế
  useEffect(() => {
    if (!booking) return;

    const formattedRemaining = remainingDebt.toLocaleString('vi-VN') + ' đ';

    if (selectedTone === 'gentle') {
      setCustomMessage(
        `Dạ em chào anh/chị ${booking.clientName}, em vừa gửi link ảnh chất lượng cao rồi ạ, anh/chị check xem đã ưng ý chưa nhé! Sẵn tiện anh/chị thanh toán giúp em phần chi phí còn lại là ${formattedRemaining} qua STK ${accountNumber} - ${bankName} (${accountName}) nhé. Em cảm ơn anh/chị nhiều ạ! ✨`
      );
    } else if (selectedTone === 'professional') {
      setCustomMessage(
        `Chào anh/chị ${booking.clientName}, ${studioName} đã hoàn tất và bàn giao file ảnh trọn bộ gói ${booking.sessionType.toUpperCase()}. Theo hợp đồng, số dư quyết toán còn lại là ${formattedRemaining}. Anh/chị vui lòng sắp xếp chuyển khoản qua STK: ${accountNumber} - ${bankName} (Chủ TK: ${accountName}) để bên em lưu trữ vĩnh viễn file gốc trên Cloud Drive nhé. Em cảm ơn anh/chị rất nhiều!`
      );
    } else {
      setCustomMessage(
        `Em gửi anh/chị ${booking.clientName} thông tin quyết toán gói chụp: Số tiền còn lại là ${formattedRemaining} qua STK ${bankName}: ${accountNumber} (${accountName}), cú pháp: TT ${booking.clientName}. Em cảm ơn anh/chị nhiều nha!`
      );
    }
  }, [booking, selectedTone, remainingDebt, bankName, accountNumber, accountName, studioName]);

  if (!isOpen || !booking) return null;

  // Xử lý sao chép tin nhắn vào Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setIsCopied(true);
      if (onCopied) {
        onCopied(
          `Đã sao chép tin nhắn nhắc nợ cho "${booking.clientName}"! Bạn có thể dán (Ctrl + V) sang Zalo ngay.`
        );
      }
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Không thể copy:', err);
    }
  };

  // VietQR Image URL với mã ngân hàng động
  const bankSlug = getVietQrBankSlug(bankName);
  const vietQrUrl = `https://img.vietqr.io/image/${bankSlug}-${accountNumber}-compact2.png?amount=${remainingDebt}&addInfo=${encodeURIComponent(
    `TT ${booking.clientName} Lensy`
  )}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 flex-shrink-0 shadow-lg shadow-rose-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <MessageSquareQuote className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/30 text-rose-300">
                USP 1 • Auto Debt Collector
              </span>
              <span className="text-[10px] text-slate-400">Trợ Lý Nhắc Nợ Tinh Tế</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Soạn Tin Nhắn Nhắc Thanh Toán Cho Khách
            </h3>
            <p className="text-xs text-slate-400">
              Khách hàng: <strong className="text-white">{booking.clientName}</strong> • Gói:{' '}
              <strong className="text-amber-400 uppercase">{booking.sessionType}</strong>
            </p>
          </div>
        </div>

        {/* Financial Highlights Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Tổng Gói Chụp</span>
            <span className="font-bold text-slate-200">
              {packagePrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Đã Thu Cọc</span>
            <span className="font-bold text-emerald-400">
              {paidAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="border-l border-slate-800 pl-2">
            <span className="text-[10px] text-rose-400 block font-sans font-bold">Số Dư Nợ Đọng</span>
            <span className="font-extrabold text-amber-400 text-sm">
              {remainingDebt.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        {/* Tone Selector Pills */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Chọn Phong Cách (Tone Giọng Nhắc Nợ):</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Có thể sửa thêm nội dung ở ô bên dưới
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTone('gentle')}
              className={`p-2 rounded-xl text-xs font-bold transition-all border text-left ${
                selectedTone === 'gentle'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] flex items-center gap-1">
                <span>✨ Tinh Tế</span>
                {selectedTone === 'gentle' && <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300">Khuyên dùng</span>}
              </div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Nhắc khéo kèm hỏi thăm ảnh</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTone('professional')}
              className={`p-2 rounded-xl text-xs font-bold transition-all border text-left ${
                selectedTone === 'professional'
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="text-[11px]">📋 Chuyên Nghiệp</div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Quyết toán hợp đồng rõ ràng</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTone('short')}
              className={`p-2 rounded-xl text-xs font-bold transition-all border text-left ${
                selectedTone === 'short'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="text-[11px]">⚡ Ngắn Gọn</div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Khách quen, chuyển khoản nhanh</div>
            </button>
          </div>
        </div>

        {/* Message Preview & Editable Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Nội Dung Tin Nhắn Sẵn Sàng Gửi:</span>
            <span className="text-[10px] text-slate-400">Đã tự động điền STK & số tiền nợ</span>
          </div>

          <div className="relative group">
            <textarea
              rows={4}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-4 pr-12 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all font-sans"
              placeholder="Nội dung tin nhắn..."
            />

            {/* Quick Copy Icon inside corner */}
            <button
              type="button"
              onClick={handleCopy}
              className={`absolute top-3 right-3 p-2 rounded-xl transition-all shadow-md ${
                isCopied
                  ? 'bg-emerald-500 text-slate-950 font-bold scale-110'
                  : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300'
              }`}
              title="Sao chép tin nhắn này"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bank & VietQR Preview Box */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Tài Khoản Nhận Thanh Toán:</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Ẩn mã QR' : 'Hiện VietQR quét nhanh'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] font-sans">Ngân Hàng</span>
              <span className="text-slate-200 font-bold">{bankName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-sans">Số Tài Khoản</span>
              <span className="text-amber-400 font-bold">{accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-sans">Chủ Tài Khoản</span>
              <span className="text-slate-200 font-bold">{accountName}</span>
            </div>
          </div>

          {/* VietQR Image Drawer */}
          {showQr && (
            <div className="pt-2 border-t border-slate-800 flex flex-col items-center justify-center space-y-2 animate-fadeIn">
              <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                <img
                  src={vietQrUrl}
                  alt="VietQR MB Bank"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Mã QR đã gắn sẵn số tiền quyết toán: <strong>{remainingDebt.toLocaleString('vi-VN')} đ</strong>
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            Bấm nút dưới đây để sao chép tin nhắn ➜ Dán (Ctrl + V) sang Zalo cho khách.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isCopied
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 scale-[1.02]'
                  : 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ĐÃ SAO CHÉP!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>SAO CHÉP TIN NHẮN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
