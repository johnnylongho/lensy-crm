import React, { useState } from 'react';
import { QuoteData } from '../../types';
import {
  Download,
  FolderArchive,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Key,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  QrCode,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';

interface Props {
  quote: QuoteData;
  onOpenPaymentModal?: () => void;
}

export const ClientDeliverySection: React.FC<Props> = ({ quote, onOpenPaymentModal }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const deliveryLink = quote.drive_delivery_link;
  const deliveryNotes = quote.delivery_notes;
  const remaining = Number(quote.remainingAmount || 0);

  // Nhận diện nền tảng lưu trữ
  const getPlatformInfo = (url?: string) => {
    if (!url) return { name: 'Đám Mây Lưu Trữ', icon: FolderArchive, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    const lower = url.toLowerCase();
    if (lower.includes('drive.google.com')) {
      return { name: 'Google Drive VIP', icon: FolderArchive, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    }
    if (lower.includes('pixieset.com')) {
      return { name: 'Pixieset Gallery', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
    }
    if (lower.includes('dropbox.com')) {
      return { name: 'Dropbox Pro', icon: FolderArchive, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    }
    if (lower.includes('onedrive') || lower.includes('1drv.ms')) {
      return { name: 'OneDrive Cloud', icon: FolderArchive, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
    return { name: 'Kho Lưu Trữ Trực Tuyến', icon: FolderArchive, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  };

  const platform = getPlatformInfo(deliveryLink);

  const handleCopyNotes = () => {
    if (!deliveryNotes) return;
    navigator.clipboard.writeText(deliveryNotes);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Nếu đã có link tải ảnh
  if (deliveryLink) {
    return (
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#292524] via-[#1c1917] to-[#0c0a09] border-2 border-amber-500/40 shadow-2xl space-y-6 animate-scaleUp relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${platform.color}`}>
                <platform.icon className="w-3.5 h-3.5" />
                <span>{platform.name}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bàn Giao Hoàn Tất</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>🎁 Tải Trọn Bộ File Ảnh Của Bạn</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-300">
              Mời <strong className="text-amber-400">{quote.clientName}</strong> truy cập link trực tuyến để xem trước và tải trọn bộ ảnh gốc & ảnh retouch chất lượng cao.
            </p>
          </div>

          {quote.delivery_date && (
            <div className="text-xs text-stone-400 flex items-center gap-1.5 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Bàn giao: <strong>{new Date(quote.delivery_date).toLocaleDateString('vi-VN')}</strong></span>
            </div>
          )}
        </div>

        {/* Main Action Callout */}
        <div className="relative z-10 space-y-4">
          <a
            href={deliveryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 transform active:scale-[0.98] transition-all"
          >
            <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            <span>MỞ KHO ẢNH & TẢI VỀ TRỌN BỘ</span>
            <ExternalLink className="w-4 h-4 text-stone-900/80 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Delivery Notes / Password Card */}
          {deliveryNotes && (
            <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Key className="w-3.5 h-3.5" />
                  <span>Ghi Chú Bàn Giao / Mật Khẩu (Password):</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyNotes}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-300 hover:text-white px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 font-mono text-xs whitespace-pre-wrap select-all">
                {deliveryNotes}
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-stone-400 pt-2">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-stone-900/50 border border-stone-800/80">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Khuyến nghị thiết bị:</strong> Nên tải bằng máy tính (PC / Laptop) để lưu trọn bộ file dung lượng gốc và giải nén dễ dàng nhất.
              </span>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-stone-900/50 border border-stone-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Bảo hành lưu trữ:</strong> Link được lưu trữ an toàn trong 12 tháng. Vui lòng tải về ổ cứng cá nhân để bảo quản vĩnh viễn.
              </span>
            </div>
          </div>
        </div>

        {/* Quyết toán nốt công nợ nếu còn */}
        {remaining > 0 ? (
          <div className="relative z-10 pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-semibold text-stone-400">Quyết toán số tiền còn lại sau nhận ảnh:</span>
              <div className="text-lg sm:text-xl font-black text-amber-400">
                {remaining.toLocaleString('vi-VN')} đ
              </div>
            </div>
            {onOpenPaymentModal && (
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Thanh Toán Quyết Toán Qua VietQR</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative z-10 pt-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
            <HeartHandshake className="w-4 h-4" />
            <span>Bạn đã hoàn tất 100% thanh toán cho hợp đồng này. {quote.studioName} chân thành cảm ơn bạn!</span>
          </div>
        )}
      </div>
    );
  }

  // Nếu đang trong giai đoạn hậu kỳ hoặc đã chụp (chưa có link)
  if (quote.status === 'editing' || quote.status === 'shot') {
    return (
      <div className="rounded-3xl p-6 sm:p-7 bg-[#1c1917]/80 backdrop-blur-xl border border-stone-800 shadow-xl space-y-4 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Ảnh Của Bạn Đang Trong Phòng Hậu Kỳ
            </h3>
            <p className="text-xs text-stone-400">
              Ekip {quote.studioName} đang tỉ mỉ xử lý từng bức ảnh và blend màu tone fine-art.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 text-xs text-stone-300 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Thời gian dự kiến bàn giao: 3 - 5 ngày sau buổi chụp</span>
          </div>
          <p className="text-stone-400 leading-relaxed">
            Ngay khi hoàn thiện, đường link tải bộ ảnh chất lượng cao (Google Drive / Pixieset) sẽ tự động kích hoạt tại chính trang này và thông báo qua Zalo cho bạn.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
