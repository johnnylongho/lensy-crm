import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CalendarEvent } from '../../types';
import {
  X,
  DollarSign,
  Wallet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  booking: CalendarEvent | null;
  onClose: () => void;
  onSuccess: (updatedBooking: CalendarEvent) => void;
}

import { formatCurrencyVND, parseCurrencyVND } from '../../utils/currency';
export { formatCurrencyVND, parseCurrencyVND };

export const QuickEditFinancialsModal: React.FC<Props> = ({
  isOpen,
  booking,
  onClose,
  onSuccess,
}) => {
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Đồng bộ dữ liệu khi mở Modal
  useEffect(() => {
    if (booking) {
      setTotalPrice(booking.packagePrice || 0);
      setDepositAmount(booking.paidAmount && booking.paidAmount > 0 ? booking.paidAmount : booking.depositAmount || 0);
      setNotes(booking.notes || '');
      setErrorMsg(null);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  // Nợ đọng tự động tính toán = Giá trị hợp đồng - Số tiền đã thu
  const remainingDebt = Math.max(0, totalPrice - depositAmount);

  // Xử lý thay đổi input giá trị hợp đồng
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrencyVND(e.target.value);
    setTotalPrice(parsed);
  };

  // Xử lý thay đổi input tiền cọc/đã thu
  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseCurrencyVND(e.target.value);
    setDepositAmount(parsed);
  };

  // Nút tắt: Chốt 30% cọc
  const handleSetDeposit30 = () => {
    const dep30 = Math.round(totalPrice * 0.3);
    setDepositAmount(dep30);
  };

  // Nút tắt: Thu đủ 100%
  const handleSetDepositFull = () => {
    setDepositAmount(totalPrice);
  };

  // Lưu thay đổi vào Supabase và cập nhật state
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const updatedEvent: CalendarEvent = {
      ...booking,
      packagePrice: totalPrice,
      depositAmount: depositAmount,
      paidAmount: depositAmount,
      remainingAmount: remainingDebt,
      notes: notes.trim(),
    };

    try {
      if (isSupabaseConfigured) {
        const updatePayload: Record<string, any> = {
          package_price: totalPrice,
          deposit_amount: depositAmount,
          paid_amount: depositAmount,
          notes: notes.trim(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', booking.id);

        if (error) throw error;
      } else {
        // Fallback demo mock
        console.log('[Mock DB] Cập nhật tài chính nhanh:', updatedEvent);
        await new Promise(r => setTimeout(r, 400));
      }

      onSuccess(updatedEvent);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật tài chính booking:', err);
      setErrorMsg(err.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden max-h-[90vh] overflow-y-auto z-10 animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Pencil className="w-3 h-3 text-amber-400" />
              <span>Cập Nhật Tài Chính Nhanh</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Cập nhật Tài chính — <span className="text-amber-400">{booking.clientName}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Điều chỉnh giá trị hợp đồng, tiền cọc/đã thu và ghi chú phát sinh cho show này.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Giá trị hợp đồng (total_price / package_price) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Giá trị hợp đồng (Tổng gói)</span>
              </label>
              <span className="text-[10px] text-slate-400">Tự động format hàng nghìn</span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={formatCurrencyVND(totalPrice)}
                onChange={handlePriceChange}
                placeholder="1.500.000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-3.5 pr-12 py-2.5 text-white font-mono font-bold text-sm focus:outline-none transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                VNĐ
              </span>
            </div>
          </div>

          {/* 2. Số tiền đã thu / cọc (deposit_amount) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Số tiền đã thu / Cọc</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetDeposit30}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cọc 30%
                </button>
                <button
                  type="button"
                  onClick={handleSetDepositFull}
                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-medium transition-colors"
                >
                  Thu đủ 100%
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formatCurrencyVND(depositAmount)}
                onChange={handleDepositChange}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-3.5 pr-12 py-2.5 text-emerald-300 font-mono font-bold text-sm focus:outline-none transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                VNĐ
              </span>
            </div>
          </div>

          {/* 3. Nợ đọng (Readonly - Tự động tính toán) */}
          <div className="space-y-1.5">
            <label className="text-slate-200 font-semibold flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nợ đọng còn lại (Tự động tính)</span>
            </label>
            <div
              className={`p-3 rounded-xl border flex items-center justify-between font-mono font-bold transition-all ${
                remainingDebt === 0
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    remainingDebt === 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                  }`}
                />
                <span className="text-xs">
                  {remainingDebt === 0 ? 'Đã thu đủ 100% (Không còn nợ)' : 'Khách còn nợ:'}
                </span>
              </div>
              <span className="text-sm font-black">
                {remainingDebt.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>

          {/* 4. Ghi chú điều chỉnh (notes) */}
          <div className="space-y-1.5">
            <label className="text-slate-200 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi chú điều chỉnh (Lý do thay đổi)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="VD: Giảm 10% khách quen, Khách tip thêm 500k, Phát sinh phí thuê váy..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-white focus:outline-none transition-colors resize-none placeholder-slate-600 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Thay Đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
