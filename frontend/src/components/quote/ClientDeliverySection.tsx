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
    if (!url) return { name: 'Đám Mây Lưu Trữ', icon: FolderArchive, color: 'text-amber-600 bg-orange-50 border-orange-200' };
    const lower = url.toLowerCase();
    if (lower.includes('drive.google.com')) {
      return { name: 'Google Drive VIP', icon: FolderArchive, color: 'text-blue-600 bg-blue-50 border-blue-200' };
    }
    if (lower.includes('pixieset.com')) {
      return { name: 'Pixieset Gallery', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' };
    }
    if (lower.includes('dropbox.com')) {
      return { name: 'Dropbox Pro', icon: FolderArchive, color: 'text-sky-600 bg-sky-50 border-sky-200' };
    }
    if (lower.includes('onedrive') || lower.includes('1drv.ms')) {
      return { name: 'OneDrive Cloud', icon: FolderArchive, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
    }
    return { name: 'Kho Lưu Trữ Trực Tuyến', icon: FolderArchive, color: 'text-amber-600 bg-orange-50 border-orange-200' };
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-scaleUp">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${platform.color}`}>
                <platform.icon className="w-3.5 h-3.5" />
                <span>{platform.name}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bàn Giao Hoàn Tất</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>🎁 Tải Trọn Bộ File Ảnh Của Bạn</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Mời <strong className="text-orange-600">{quote.clientName}</strong> truy cập link trực tuyến để xem trước và tải trọn bộ ảnh gốc & ảnh retouch chất lượng cao.
            </p>
          </div>

          {quote.delivery_date && (
            <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              <span>Bàn giao: <strong>{new Date(quote.delivery_date).toLocaleDateString('vi-VN')}</strong></span>
            </div>
          )}
        </div>

        {/* Main Action Callout */}
        <div className="space-y-4">
          <a
            href={deliveryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 transform active:scale-[0.98] transition-all"
          >
            <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            <span>MỞ KHO ẢNH & TẢI VỀ TRỌN BỘ</span>
            <ExternalLink className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Delivery Notes / Password Card */}
          {deliveryNotes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span className="flex items-center gap-1.5 text-orange-600">
                  <Key className="w-3.5 h-3.5" />
                  <span>Ghi Chú Bàn Giao / Mật Khẩu (Password):</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyNotes}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-900 break-all select-all">
                {deliveryNotes}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Bảo hành lưu trữ:</strong> Link được lưu trữ an toàn trong 12 tháng. Vui lòng tải về ổ cứng cá nhân để bảo quản vĩnh viễn.
            </span>
          </div>
        </div>

        {/* Quyết toán nốt công nợ nếu còn */}
        {remaining > 0 ? (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-600">Quyết toán số tiền còn lại sau nhận ảnh:</span>
              <div className="text-lg sm:text-xl font-bold text-orange-600">
                {remaining.toLocaleString('vi-VN')} đ
              </div>
            </div>
            {onOpenPaymentModal && (
              <button
                type="button"
                onClick={onOpenPaymentModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Thanh Toán Quyết Toán Qua VietQR</span>
              </button>
            )}
          </div>
        ) : (
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Ảnh Của Bạn Đang Trong Phòng Hậu Kỳ
            </h3>
            <p className="text-xs text-slate-500">
              Ekip {quote.studioName} đang tỉ mỉ xử lý từng bức ảnh và blend màu tone fine-art.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-orange-600 font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Thời gian dự kiến bàn giao: 3 - 5 ngày sau buổi chụp</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Ngay khi hoàn thiện, đường link tải bộ ảnh chất lượng cao (Google Drive / Pixieset) sẽ tự động kích hoạt tại chính trang này và thông báo qua Zalo cho bạn.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
