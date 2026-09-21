import React, { useState } from 'react';
import { DebtReminder } from '@lensflow/shared';
import { Send, Copy, Check, MessageSquare, Clock, AlertCircle } from 'lucide-react';

interface Props {
  reminders: DebtReminder[];
  onClose?: () => void;
}

export const DebtCollectorModal: React.FC<Props> = ({ reminders }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeToneFilter, setActiveToneFilter] = useState<'all' | 'gentle' | 'professional' | 'firm_invoice'>('all');

  const filteredReminders = reminders.filter(r => {
    if (activeToneFilter === 'all') return true;
    return r.recommendedTone === activeToneFilter;
  });

  const handleCopy = (bookingId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(bookingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case 'gentle':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">Giai đoạn 1: Tinh tế (Ngày 1-3)</span>;
      case 'professional':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">Giai đoạn 2: Nhắc nhở chuyên nghiệp (Ngày 4-7)</span>;
      case 'firm_invoice':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">Giai đoạn 3: Quyết toán hoá đơn (&gt; 7 ngày)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 p-4 border border-indigo-500/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Trợ Lý Thu Hồi Công Nợ Tự Động (AI Debt Collector)
            </h3>
            <p className="text-xs text-slate-300">
              Tự động khớp lệnh "Đã trả ảnh" và "Chưa quyết toán" để soạn mẫu tin Zalo/SMS chuẩn phong cách
            </p>
          </div>
        </div>

        {/* Tone Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveToneFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              activeToneFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tất cả ({reminders.length})
          </button>
          <button
            onClick={() => setActiveToneFilter('gentle')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              activeToneFilter === 'gentle'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Nhẹ nhàng
          </button>
          <button
            onClick={() => setActiveToneFilter('professional')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              activeToneFilter === 'professional'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Chuyên nghiệp
          </button>
          <button
            onClick={() => setActiveToneFilter('firm_invoice')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              activeToneFilter === 'firm_invoice'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Quyết toán gắt
          </button>
        </div>
      </div>

      {/* Reminder Cards */}
      {filteredReminders.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          <Check className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
          <p className="font-medium text-sm">Tuyệt vời! Không có khách hàng nào bị đọng công nợ sau khi trả ảnh.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map(item => (
            <div
              key={item.bookingId}
              className="p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all shadow-md space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{item.clientName}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>SĐT: {item.clientPhone}</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5" /> Đã trả ảnh {item.daysSinceDelivery} ngày
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Còn nợ:</div>
                  <div className="text-base font-bold text-rose-400 font-mono">
                    {item.remainingAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              <div>{getToneBadge(item.recommendedTone)}</div>

              {/* Message Preview Box */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                {item.messageContent}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(item.bookingId, item.messageContent)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copiedId === item.bookingId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép tin nhắn
                    </>
                  )}
                </button>

                {item.zaloDeeplink && (
                  <a
                    href={item.zaloDeeplink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Gửi qua Zalo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
