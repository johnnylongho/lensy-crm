import React, { useState, useEffect } from 'react';
import { CalendarEvent, GearItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Camera,
  Layers,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Save,
  Loader2,
  ShieldAlert,
  Sparkles,
  Phone,
  DollarSign,
  Info,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  booking: CalendarEvent | null;
  allBookings: CalendarEvent[];
  onClose: () => void;
  onBookingUpdated?: (updatedBooking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
}

export const BookingDetailModal: React.FC<Props> = ({
  isOpen,
  booking,
  allBookings,
  onClose,
  onBookingUpdated,
  onOpenDebtReminder,
}) => {
  const { user } = useAuth();
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState(false);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync selected gears whenever booking changes
  useEffect(() => {
    if (booking) {
      setSelectedGearIds(booking.assignedGears || []);
    }
  }, [booking]);

  // Fetch gears of photographer
  useEffect(() => {
    if (!isOpen) return;

    const loadGears = async () => {
      setIsLoadingGears(true);
      try {
        if (isSupabaseConfigured) {
          let query = supabase.from('gears').select('*').order('created_at', { ascending: false });
          if (user) {
            query = query.eq('photographer_id', user.id);
          }
          const { data, error } = await query;
          if (error) throw error;
          setGears(data || []);
        } else {
          setGears([
            { id: 'g1', name: 'Sony Alpha 7 IV (Chính)', type: 'camera', status: 'active' },
            { id: 'g2', name: 'Sony Alpha 7R V (Phụ)', type: 'camera', status: 'active' },
            { id: 'g3', name: 'Lens FE 24-70mm F2.8 GM II', type: 'lens', status: 'active' },
            { id: 'g4', name: 'Lens FE 70-200mm F2.8 GM OSS II', type: 'lens', status: 'active' },
            { id: 'g5', name: 'Đèn Studio Godox AD600 Pro', type: 'lighting', status: 'active' },
          ]);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách thiết bị:', err);
      } finally {
        setIsLoadingGears(false);
      }
    };

    loadGears();
  }, [isOpen, user]);

  if (!isOpen || !booking) return null;

  // ====================================================================
  // LOGIC CHỐNG TRÙNG LẶP (CONFLICT SCANNER)
  // Kiểm tra xem thiết bị gearId đã được gắn cho Booking nào khác CÙNG NGÀY hay chưa
  // ====================================================================
  const getGearConflict = (gearId: string): CalendarEvent | null => {
    if (!booking) return null;

    // Tìm trong danh sách tất cả các booking: khác id hiện tại, cùng eventDate, và có chứa gearId
    const conflictBooking = allBookings.find(
      b =>
        b.id !== booking.id &&
        b.eventDate === booking.eventDate &&
        (b.assignedGears || []).includes(gearId) &&
        b.status !== 'da_huy'
    );

    return conflictBooking || null;
  };

  // Tìm tất cả các xung đột trong số những thiết bị đang được chọn
  const activeConflicts = selectedGearIds
    .map(gearId => {
      const conflict = getGearConflict(gearId);
      const gear = gears.find(g => g.id === gearId);
      return conflict && gear ? { gear, conflict } : null;
    })
    .filter(Boolean) as { gear: GearItem; conflict: CalendarEvent }[];

  // Toggle chọn / gỡ thiết bị
  const handleToggleGear = (gearId: string) => {
    setSelectedGearIds(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  // Lưu thiết bị vào Supabase
  const handleSaveAssignedGears = async () => {
    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('bookings')
          .update({
            assigned_gears: selectedGearIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (error) throw error;
      }

      // Cập nhật state cho parent
      const updated: CalendarEvent = {
        ...booking,
        assignedGears: selectedGearIds,
      };

      if (onBookingUpdated) {
        onBookingUpdated(updated);
      }

      setToastMessage({
        type: 'success',
        text: '🎉 Đã lưu danh sách thiết bị cho lịch chụp thành công!',
      });
    } catch (err: any) {
      console.error('Lỗi khi lưu thiết bị vào booking:', err);
      setToastMessage({
        type: 'error',
        text: `Lỗi: ${err.message || 'Không thể lưu thiết bị'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remainingDebt = Math.max(0, booking.packagePrice - (booking.paidAmount || booking.depositAmount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 space-y-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="pr-8 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Chi Tiết Lịch Chụp
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              {booking.sessionType.toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {booking.clientName}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{booking.eventDate}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{booking.startTime} - {booking.endTime}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{booking.location}</span>
            </span>
          </div>
        </div>

        {/* Financial Metrics Summary */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Tổng Gói</span>
            <span className="font-mono font-bold text-white">
              {booking.packagePrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Đã Thanh Toán</span>
            <span className="font-mono font-bold text-emerald-400">
              {(booking.paidAmount || booking.depositAmount).toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Còn Lại</span>
            <span className={`font-mono font-bold ${remainingDebt > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {remainingDebt === 0 ? '0 đ (Xong)' : `${remainingDebt.toLocaleString('vi-VN')} đ`}
            </span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CẢNH BÁO XUNG ĐỘT THIẾT BỊ (CONFLICT ALERT BANNER) */}
        {/* ==================================================================== */}
        {activeConflicts.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500/80 shadow-xl space-y-2 animate-scaleUp">
            <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs uppercase tracking-wide">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
              <span>Cảnh Báo Xung Đột Thiết Bị Cùng Ngày!</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {activeConflicts.map(({ gear, conflict }) => (
                <div
                  key={gear.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Cảnh báo: </span>
                    Thiết bị <strong className="text-amber-300 underline">{gear.name}</strong> đã được xếp lịch cho khách{' '}
                    <strong className="text-white">"{conflict.clientName}"</strong> ({conflict.sessionType.toUpperCase()}) vào ngày này ({booking.eventDate})!
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-rose-300/80 pt-0.5">
              💡 Gợi ý: Hãy cân nhắc đổi thiết bị phụ hoặc lên kế hoạch thuê thiết bị ngoài thay thế để tránh thiếu máy tại show.
            </p>
          </div>
        )}

        {/* Section: Gắn Thiết Bị (Assign Gears) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Gắn Thiết Bị Đi Chụp (Assigned Gears)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Đã chọn: <strong className="text-amber-400">{selectedGearIds.length}</strong> thiết bị
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Chọn các body máy, ống kính và đèn studio bạn sẽ mang theo cho show chụp của khách{' '}
            <strong className="text-white">{booking.clientName}</strong>:
          </p>

          {isLoadingGears ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <span className="text-xs text-slate-400">Đang tải kho thiết bị...</span>
            </div>
          ) : gears.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
              <Info className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                Kho thiết bị của bạn đang trống. Vui lòng vào trang <strong>Cài Đặt / Thiết Bị</strong> để thêm máy và lens.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {gears.map(gear => {
                const isSelected = selectedGearIds.includes(gear.id);
                const conflict = getGearConflict(gear.id);

                return (
                  <button
                    key={gear.id}
                    type="button"
                    onClick={() => handleToggleGear(gear.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? conflict
                          ? 'bg-rose-950/40 border-rose-500/80 shadow-md'
                          : 'bg-amber-500/10 border-amber-500/60 shadow-md'
                        : conflict
                        ? 'bg-slate-950/50 border-rose-950/80 hover:border-rose-500/50 opacity-80'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Checkbox circle */}
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? conflict
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-slate-950 font-bold'
                          : 'border border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          {gear.name}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                          {gear.type}
                        </span>
                      </div>

                      {/* Conflict Indicator on Card */}
                      {conflict && (
                        <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          <span className="truncate">
                            Đã gán cho "{conflict.clientName}" ngày này
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div>
            {remainingDebt > 0 && onOpenDebtReminder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDebtReminder(booking);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline transition-colors flex items-center gap-1"
              >
                <span>💬 Mở Trợ Lý Nhắc Nợ ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAssignedGears}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Thiết Bị</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
