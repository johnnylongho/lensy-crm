import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles, Check, Package, AlertCircle, Loader2 } from 'lucide-react';
import { CalendarEvent } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { STANDARD_CATEGORIES, getCategoryConfig, normalizeCategory } from '../../utils/categoryConfig';

interface Props {
  isOpen: boolean;
  booking: CalendarEvent | null;
  onClose: () => void;
  onSuccess: (updatedBooking: CalendarEvent) => void;
}

export const EditCategoryModal: React.FC<Props> = ({
  isOpen,
  booking,
  onClose,
  onSuccess,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('portrait');
  const [packageType, setPackageType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (booking && isOpen) {
      const currentCat = normalizeCategory(booking.category || booking.sessionType);
      setSelectedCategory(currentCat);
      setPackageType(booking.package_type || '');
      setErrorMsg(null);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const currentConfig = getCategoryConfig(selectedCategory);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const canonicalCategory = normalizeCategory(selectedCategory);

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('bookings')
          .update({
            category: canonicalCategory,
            session_type: canonicalCategory,
            package_type: packageType.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (error) {
          console.warn('Lưu category qua Supabase gặp lỗi, thử lưu qua session_type:', error);
          // Fallback nếu cột category chưa tồn tại
          const { error: fallbackErr } = await supabase
            .from('bookings')
            .update({
              session_type: canonicalCategory,
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id);
          if (fallbackErr) throw fallbackErr;
        }
      }

      const updatedBooking: CalendarEvent = {
        ...booking,
        category: canonicalCategory,
        sessionType: canonicalCategory as any,
        package_type: packageType.trim() || undefined,
        updated_at: new Date().toISOString(),
      };

      onSuccess(updatedBooking);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật loại hình chụp:', err);
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
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto z-10 animate-scaleUp text-slate-800 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Tag className="w-3 h-3" />
              <span>Phân Loại Lịch Chụp</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              Tùy chỉnh Loại Hình & Gói Chụp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khách hàng: <strong className="text-gray-900 dark:text-white">{booking.clientName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Chọn Loại Hình Chụp (Category Grid / Dropdown) */}
          <div className="space-y-2">
            <label className="text-slate-700 dark:text-slate-200 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Loại Hình Chụp (Category) *</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${currentConfig.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dotColor}`} />
                <span>{currentConfig.label}</span>
              </span>
            </label>

            {/* Danh sách chọn dạng thẻ trực quan */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STANDARD_CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? `${cat.color} ring-2 ring-amber-500/50 font-bold shadow-sm`
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full ${cat.dotColor} flex-shrink-0`} />
                      <span className="truncate text-xs">{cat.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tên Gói Chụp (Package Type) */}
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-500" />
              <span>Gói Chụp / Dịch Vụ Cụ Thể</span>
            </label>
            <input
              type="text"
              value={packageType}
              onChange={e => setPackageType(e.target.value)}
              placeholder="VD: Gói VIP Diamond, Ngoại cảnh Đà Lạt, Lookbook 5 set..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium text-xs focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              Nhập tên chi tiết gói dịch vụ hoặc ghi chú phân tầng để thợ chụp dễ theo dõi.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu Thay Đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
