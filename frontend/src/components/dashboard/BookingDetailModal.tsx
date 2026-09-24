import React, { useState, useEffect } from 'react';
import { CalendarEvent, GearItem, ExpenseItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { checkAssignedGearConflicts, DynamicGearConflict } from '../../lib/conflictScanner';
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
  Search,
  SlidersHorizontal,
  Receipt,
  Plus,
  Trash2,
  Wallet,
  Coins,
  TrendingUp,
  Tag,
  Calculator,
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
  const [activeTab, setActiveTab] = useState<'gears' | 'expenses'>('gears');
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState(false);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);
  const [isOverrideConfirmed, setIsOverrideConfirmed] = useState(false);
  const [gearSearch, setGearSearch] = useState('');
  const [gearCategory, setGearCategory] = useState<string>('all');
  
  // Job Costing (Hạch toán Chi phí) States
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync selected gears & expenses whenever booking changes
  useEffect(() => {
    if (booking) {
      setSelectedGearIds(booking.assignedGears || []);
      setIsOverrideConfirmed(false);
      setExpenseItems(booking.expenseDetails || []);
      setNewExpenseName('');
      setNewExpenseAmount('');
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
  // LOGIC CHỐNG TRÙNG LẶP (CONFLICT SCANNER - USP 2)
  // Kiểm tra xem các thiết bị đang chọn có bị xếp lịch cho show nào khác CÙNG NGÀY không
  // ====================================================================
  const activeConflicts: DynamicGearConflict[] = checkAssignedGearConflicts(
    booking.eventDate,
    booking.id,
    selectedGearIds,
    allBookings,
    gears
  );

  // Kiểm tra riêng lẻ một thiết bị bất kỳ có bị xung đột trong ngày này hay không
  const getSingleGearConflict = (gearId: string): DynamicGearConflict | null => {
    const res = checkAssignedGearConflicts(
      booking.eventDate,
      booking.id,
      [gearId],
      allBookings,
      gears
    );
    return res.length > 0 ? res[0] : null;
  };

  // Toggle chọn / gỡ thiết bị
  const handleToggleGear = (gearId: string) => {
    setSelectedGearIds(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  // ====================================================================
  // LOGIC HẠCH TOÁN CHI PHÍ & TÍNH LỢI NHUẬN RÒNG (JOB COSTING)
  // ====================================================================
  const EXPENSE_PRESETS = [
    { name: 'Makeup Artist', amount: 1500000 },
    { name: 'Grab / Di chuyển', amount: 300000 },
    { name: 'Thuê phim trường / Studio', amount: 1200000 },
    { name: 'Trợ lý ánh sáng (Second)', amount: 600000 },
    { name: 'In album / Ép gỗ', amount: 800000 },
    { name: 'Ăn uống / Cơm đoàn', amount: 250000 },
  ];

  const handleAddExpense = (presetName?: string, presetAmount?: number) => {
    const title = (presetName !== undefined ? presetName : newExpenseName).trim();
    const cost = presetAmount !== undefined ? presetAmount : (Number(newExpenseAmount) || 0);

    if (!title) {
      setToastMessage({ type: 'error', text: 'Vui lòng nhập tên khoản chi (VD: Makeup, Taxi...)' });
      return;
    }
    if (cost <= 0) {
      setToastMessage({ type: 'error', text: 'Số tiền chi phí phải lớn hơn 0 đ.' });
      return;
    }

    const newItem: ExpenseItem = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: title,
      amount: cost,
    };

    setExpenseItems(prev => [...prev, newItem]);
    setNewExpenseName('');
    setNewExpenseAmount('');
    setToastMessage({ type: 'success', text: `Đã thêm khoản chi: "${title}" (${cost.toLocaleString('vi-VN')} đ)` });
  };

  const handleRemoveExpense = (index: number) => {
    const item = expenseItems[index];
    setExpenseItems(prev => prev.filter((_, i) => i !== index));
    if (item) {
      setToastMessage({ type: 'success', text: `Đã xóa khoản chi "${item.name}"` });
    }
  };

  // Tính toán tài chính
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const effectivePaid = Number(booking.paidAmount || booking.depositAmount || 0);
  // Lợi nhuận ròng = Số tiền khách trả - Tổng chi phí
  const netProfit = effectivePaid - totalExpenses;
  const projectedNetProfit = booking.packagePrice - totalExpenses;

  // Lưu phân bổ thiết bị VÀ hạch toán chi phí vào Supabase
  const handleSaveAssignedGears = async () => {
    // 1. CHẶN LƯU NẾU CÓ XUNG ĐỘT MÀ CHƯA XÁC NHẬN GHI ĐÈ
    if (activeConflicts.length > 0 && !isOverrideConfirmed) {
      setToastMessage({
        type: 'error',
        text: `⚠️ Lưu bị chặn! Thiết bị vừa chọn bị trùng với lịch khác cùng ngày (${booking.eventDate}). Vui lòng gỡ thiết bị hoặc tích chọn "Tôi xác nhận ghi đè" để tiếp tục!`,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('bookings')
          .update({
            assigned_gears: selectedGearIds,
            expenses: totalExpenses,
            expense_details: expenseItems,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (error) throw error;
      }

      // Cập nhật state cho parent
      const updated: CalendarEvent = {
        ...booking,
        assignedGears: selectedGearIds,
        expenses: totalExpenses,
        expenseDetails: expenseItems,
      };

      if (onBookingUpdated) {
        onBookingUpdated(updated);
      }

      setToastMessage({
        type: 'success',
        text: activeConflicts.length > 0
          ? '⚠️ Đã ghi đè thiết bị và lưu hạch toán chi phí thành công!'
          : '🎉 Đã lưu danh sách thiết bị & hạch toán chi phí thành công!',
      });
    } catch (err: any) {
      console.error('Lỗi khi lưu booking:', err);
      setToastMessage({
        type: 'error',
        text: `Lỗi: ${err.message || 'Không thể lưu'}`,
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

        {/* Financial Metrics Summary - 4 Cột Rõ Ràng: Tổng Gói, Khách Trả, Chi Phí, Lợi Nhuận Ròng */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Tổng Gói (Hợp Đồng)</span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm">
              {booking.packagePrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Khách Đã Trả (Doanh Thu)</span>
            <span className="font-mono font-bold text-sky-400 text-xs sm:text-sm">
              {effectivePaid.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Tổng Chi Phí (Job Cost)</span>
            <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
              {totalExpenses.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Lợi Nhuận Ròng (Net Profit)</span>
            <span className={`font-mono font-black text-xs sm:text-sm ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        {/* Tab Switcher: Phân Bổ Thiết Bị vs Hạch Toán Chi Phí */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('gears')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gears'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Phân Bổ Thiết Bị</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'gears' ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'}`}>
              {selectedGearIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'expenses'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Hạch Toán Chi Phí (Job Costing)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'expenses' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
              {expenseItems.length}
            </span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: PHÂN BỔ THIẾT BỊ (USP 2) */}
        {/* ==================================================================== */}
        {activeTab === 'gears' && (
          <div className="space-y-4 animate-fadeIn">

        {/* ==================================================================== */}
        {/* CẢNH BÁO XUNG ĐỘT THIẾT BỊ (PROMINENT RED CONFLICT ALERT BANNER - USP 2) */}
        {/* ==================================================================== */}
        {activeConflicts.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl space-y-3.5 animate-scaleUp ring-2 ring-rose-500/20">
            <div className="flex items-center justify-between gap-2 border-b border-rose-900/80 pb-2">
              <div className="flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 animate-bounce" />
                <span>⚠️ CẢNH BÁO: XUNG ĐỘT THIẾT BỊ CÙNG NGÀY ({booking.eventDate})!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900 text-rose-200 border border-rose-500/50">
                {activeConflicts.length} trùng lặp
              </span>
            </div>

            <div className="space-y-2">
              {activeConflicts.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/85 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5 shadow-md"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-extrabold text-white">⚠️ Cảnh báo: </span>
                    <strong className="text-amber-300 underline font-bold">{c.gearName}</strong> đã được xếp lịch cho một khách khác (
                    <strong className="text-white">"{c.conflictingClientName}"</strong> - {c.conflictingSessionType} lúc {c.timeRange}) vào ngày này!
                  </div>
                </div>
              ))}
            </div>

            {/* Checkbox Yêu Cầu Xác Nhận Ghi Đè (Chặn Lưu nếu chưa tích) */}
            <div
              className={`p-3 rounded-xl border transition-all ${
                isOverrideConfirmed
                  ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 shadow-inner'
                  : 'bg-rose-950/80 border-rose-500/70 text-rose-200'
              } flex items-start gap-3`}
            >
              <input
                type="checkbox"
                id="override-conflict-checkbox"
                checked={isOverrideConfirmed}
                onChange={e => setIsOverrideConfirmed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-rose-500 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <label
                htmlFor="override-conflict-checkbox"
                className="text-xs cursor-pointer select-none font-semibold leading-relaxed"
              >
                <span>
                  <strong>Xác nhận ghi đè:</strong> Tôi đồng ý sử dụng thiết bị này dù có xung đột lịch trình (Studio đã có phương án máy dự phòng hoặc thuê ngoài).
                </span>
                {!isOverrideConfirmed && (
                  <span className="block text-[11px] text-rose-400 font-bold mt-0.5">
                    * Bắt buộc tích chọn để mở khóa nút "Lưu Thiết Bị".
                  </span>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Section: Phân Bổ Thiết Bị (Equipment Allocation) */}
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Phân Bổ Thiết Bị Cho Show (Equipment Allocation)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Đã phân bổ: <strong className="text-amber-400">{selectedGearIds.length}</strong> thiết bị
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Chọn các body máy, ống kính và đèn studio bạn sẽ mang theo cho show chụp của khách{' '}
            <strong className="text-white">{booking.clientName}</strong>:
          </p>

          {/* Selected Gear Tag Badges with Quick Removal */}
          {selectedGearIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Đang chọn:</span>
              {selectedGearIds.map(id => {
                const g = gears.find(item => item.id === id);
                const isClashed = activeConflicts.some(c => c.gearId === id);
                return (
                  <span
                    key={id}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      isClashed
                        ? 'bg-rose-950/80 text-rose-200 border-rose-500/70 shadow-sm'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isClashed && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    <span>{g?.name || id}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleGear(id)}
                      className="hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                      title="Gỡ thiết bị"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Filter & Search Bar for Gears in Modal */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={gearSearch}
                onChange={e => setGearSearch(e.target.value)}
                placeholder="Tìm máy, lens, đèn..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-400 text-xs text-white placeholder-slate-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'camera', label: '📷 Máy' },
                { id: 'lens', label: '🔍 Lens' },
                { id: 'lighting', label: '💡 Đèn' },
                { id: 'accessory', label: '🎬 Phụ kiện' },
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setGearCategory(c.id)}
                  className={`px-2 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    gearCategory === c.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
              {gears
                .filter(gear => {
                  const matchCategory = gearCategory === 'all' || gear.type === gearCategory;
                  const matchSearch = gear.name.toLowerCase().includes(gearSearch.toLowerCase());
                  return matchCategory && matchSearch;
                })
                .map(gear => {
                  const isSelected = selectedGearIds.includes(gear.id);
                  const conflict = getSingleGearConflict(gear.id);

                  return (
                    <button
                      key={gear.id}
                      type="button"
                      onClick={() => handleToggleGear(gear.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? conflict
                            ? 'bg-rose-950/50 border-rose-500 shadow-md ring-1 ring-rose-500/40'
                            : 'bg-amber-500/10 border-amber-500/70 shadow-md'
                          : conflict
                          ? 'bg-slate-950/50 border-rose-900/80 hover:border-rose-500/50 opacity-80'
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
                              ⚠️ Đã xếp lịch cho "{conflict.conflictingClientName}" ngày này
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
      </div>
    )}

    {/* ==================================================================== */}
    {/* TAB 2: HẠCH TOÁN CHI PHÍ - JOB COSTING */}
    {/* ==================================================================== */}
    {activeTab === 'expenses' && (
      <div className="space-y-4 animate-fadeIn">
        {/* Banner Công thức Lợi Nhuận Ròng (Net Profit Formula Banner) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Công Thức Hạch Toán (Job Costing)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Lợi nhuận ròng = [Số tiền khách trả] - [Tổng chi phí phát sinh]
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Tỷ suất lợi nhuận:</span>
              <strong className={netProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {effectivePaid > 0 ? ((netProfit / effectivePaid) * 100).toFixed(1) : 0}%
              </strong>
            </div>
          </div>

          {/* Trực quan hóa phép tính: [Khách Trả] - [Tổng Chi Phí] = [Lợi Nhuận Ròng] */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/20 text-center">
              <span className="text-[10px] text-slate-400 font-medium block">Số tiền khách trả</span>
              <strong className="text-sm font-bold text-blue-400 font-mono">
                {effectivePaid.toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/20 text-center relative">
              <div className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                -
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">Tổng chi phí ({expenseItems.length} khoản)</span>
              <strong className="text-sm font-bold text-rose-400 font-mono">
                {totalExpenses.toLocaleString('vi-VN')} đ
              </strong>
            </div>
            <div className={`p-2.5 rounded-xl border text-center relative ${
              netProfit >= 0
                ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-500/10'
            }`}>
              <div className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                =
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">Lợi Nhuận Ròng (Net Profit)</span>
              <strong className={`text-sm sm:text-base font-extrabold font-mono ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {netProfit.toLocaleString('vi-VN')} đ
              </strong>
            </div>
          </div>
        </div>

        {/* Form Thêm Khoản Chi Mới */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thêm Khoản Chi Phí Phát Sinh Cho Show</span>
            </h4>
            <span className="text-[10px] text-slate-500">Mẫu chọn nhanh bên dưới</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setNewExpenseName(preset.name);
                  setNewExpenseAmount(preset.amount.toString());
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  newExpenseName === preset.name
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                + {preset.name} ({preset.amount.toLocaleString('vi-VN')} đ)
              </button>
            ))}
          </div>

          {/* Input Row */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <input
              type="text"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              placeholder="Tên khoản chi (VD: Makeup artist, Thuê Studio...)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddExpense();
                }
              }}
            />
            <div className="relative sm:w-44">
              <input
                type="number"
                min="0"
                step="10000"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                placeholder="Số tiền (VNĐ)"
                className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExpense();
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                đ
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleAddExpense()}
              disabled={!newExpenseName.trim() || !newExpenseAmount}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Khoản Chi</span>
            </button>
          </div>
        </div>

        {/* Danh Sách Các Khoản Chi Đã Thêm */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">
              Chi tiết các khoản chi ({expenseItems.length})
            </span>
            <span className="font-mono text-rose-400">
              Tổng chi: <strong>{totalExpenses.toLocaleString('vi-VN')} đ</strong>
            </span>
          </div>

          {expenseItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800/80 space-y-2">
              <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Chưa có khoản chi phí phát sinh nào cho show này.
              </p>
              <p className="text-[11px] text-slate-500">
                Nhập tên và số tiền ở trên để theo dõi sát sao lợi nhuận thực tế (tiền bỏ túi).
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {expenseItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-rose-400 font-mono">
                      -{Number(item.amount).toLocaleString('vi-VN')} đ
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpense(idx)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                      title="Xóa khoản chi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

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

        {/* Nút Lưu: Có cơ chế kiểm soát xung đột và lưu cả Thiết Bị + Hạch Toán Chi Phí */}
        {activeConflicts.length > 0 && !isOverrideConfirmed ? (
          <button
            type="button"
            onClick={handleSaveAssignedGears}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-900 transition-all shadow-md"
            title="Bị chặn do xung đột thiết bị - Cần tích chọn Xác nhận ghi đè"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Chặn Lưu Xung Đột (Cần Xác Nhận)</span>
          </button>
        ) : activeConflicts.length > 0 && isOverrideConfirmed ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAssignedGears}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Xác Nhận Ghi Đè & Lưu Phân Bổ</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAssignedGears}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Phân Bổ & Chi Phí</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
      </div>
    </div>
  );
};

