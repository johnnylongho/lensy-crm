import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CalendarEvent } from '../../types';
import { STANDARD_CATEGORIES } from '../../utils/categoryConfig';
import {
  X,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (newBooking: CalendarEvent) => void;
}

export const QuickPassShowModal: React.FC<Props> = ({ isOpen, onClose, onBookingCreated }) => {
  const { user } = useAuth();
  const { currentStudio } = useWorkspace();

  const todayStr = new Date().toISOString().split('T')[0];

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventDate, setEventDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [sessionType, setSessionType] = useState('portrait');
  const [location, setLocation] = useState('Tại Studio');
  const [packagePrice, setPackagePrice] = useState<string>('1500000');
  const [depositAmount, setDepositAmount] = useState<string>('500000');
  const [paidAmount, setPaidAmount] = useState<string>('500000');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setErrorMessage('Vui lòng nhập tên khách hàng hoặc tên show.');
      return;
    }
    if (!eventDate) {
      setErrorMessage('Vui lòng chọn ngày chụp.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const numPrice = Number(packagePrice) || 0;
    const numDeposit = Number(depositAmount) || 0;
    const numPaid = Number(paidAmount) || 0;

    const newBookingData: any = {
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || null,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      session_type: sessionType,
      session_title: `Lịch Chụp - ${clientName.trim()}`,
      location: location.trim() || 'Tại Studio',
      package_price: numPrice,
      deposit_amount: numDeposit,
      paid_amount: numPaid,
      notes: notes.trim() ? `[Pass Show] ${notes.trim()}` : '[Pass Show]',
      status: 'confirmed',
      photographer_id: user?.id || null,
      studio_id: currentStudio?.id || null,
    };

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('bookings')
          .insert([newBookingData])
          .select()
          .single();

        if (error) throw error;

        const mappedEvent: CalendarEvent = {
          id: data.id,
          clientName: data.client_name,
          clientPhone: data.client_phone || '',
          eventDate: data.event_date,
          startTime: data.start_time,
          endTime: data.end_time,
          sessionType: data.session_type || 'portrait',
          sessionTitle: data.session_title || `Lịch Chụp - ${data.client_name}`,
          location: data.location || 'Tại Studio',
          packagePrice: Number(data.package_price) || 0,
          depositAmount: Number(data.deposit_amount) || 0,
          paidAmount: Number(data.paid_amount) || 0,
          notes: data.notes || '',
          status: data.status || 'confirmed',
          assignedGears: [],
        };

        if (onBookingCreated) {
          onBookingCreated(mappedEvent);
        }
      } else {
        const dummyId = `pass-${Date.now()}`;
        const mappedEvent: CalendarEvent = {
          id: dummyId,
          clientName: newBookingData.client_name,
          clientPhone: newBookingData.client_phone || '',
          eventDate: newBookingData.event_date,
          startTime: newBookingData.start_time,
          endTime: newBookingData.end_time,
          sessionType: newBookingData.session_type,
          sessionTitle: newBookingData.session_title,
          location: newBookingData.location,
          packagePrice: numPrice,
          depositAmount: numDeposit,
          paidAmount: numPaid,
          notes: newBookingData.notes,
          status: 'confirmed',
          assignedGears: [],
        };

        if (onBookingCreated) {
          onBookingCreated(mappedEvent);
        }
      }

      // Thông báo cho toàn bộ ứng dụng cập nhật
      window.dispatchEvent(new CustomEvent('lensy:booking-created'));
      onClose();
    } catch (err: any) {
      console.error('[QuickPassShow] Lỗi lưu lịch chụp:', err);
      setErrorMessage(err.message || 'Không thể lưu lịch chụp. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-hidden p-4"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Tạo Lịch Thủ Công</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 uppercase border border-amber-500/30">
                  Pass Show Nhanh
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Thêm show nhận ngoài, show người quen hoặc pass từ thợ khác
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-5 mb-0 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Tên khách & SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Khách hàng / Tên Show *</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="VD: Phú TikTok / Chị Mai Concept"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Số điện thoại / Zalo</span>
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Ngày chụp & Khung giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Ngày Chụp *</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Giờ Bắt Đầu</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Giờ Kết Thúc</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Loại hình & Địa điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Loại Hình Show</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {STANDARD_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Địa Điểm Chụp</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Tại Studio / Landmark 81 / Đà Lạt"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Tài chính: Giá gói, Cọc, Đã thanh toán */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Giá Gói / Cát-sê (đ)</label>
              <input
                type="number"
                value={packagePrice}
                onChange={e => setPackagePrice(e.target.value)}
                step="50000"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Tiền Cọc (đ)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                step="50000"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Đã Thanh Toán (đ)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                step="50000"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-xs focus:border-amber-400"
              />
            </div>
          </div>

          {/* Ghi chú / Pass từ ai */}
          <div className="space-y-1">
            <label className="font-bold text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi Chú Show / Người Pass / Yêu Cầu Thiết Bị</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="VD: Show pass từ anh Nam, yêu cầu mang 85mm + đèn V860iii, chụp tone Hàn Quốc nhẹ nhàng..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 resize-none text-xs"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu show...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tạo Lịch Show Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
