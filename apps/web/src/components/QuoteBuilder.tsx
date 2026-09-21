import React, { useState, useEffect } from 'react';
import { Gear, ConflictReport, Booking } from '@lensflow/shared';
import { ConflictAlertBadge } from './ConflictAlertBadge';
import { Camera, Calendar, DollarSign, User, Phone, MapPin, Link2, Plus, Check } from 'lucide-react';

interface Props {
  gears: Gear[];
  onQuoteCreated: (booking: Booking) => void;
}

export const QuoteBuilder: React.FC<Props> = ({ gears, onQuoteCreated }) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [sessionType, setSessionType] = useState<Booking['sessionType']>('wedding');
  const [eventDate, setEventDate] = useState('2026-09-25'); // Default to date with conflict to test
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('14:00');
  const [location, setLocation] = useState('TP. Hồ Chí Minh');
  const [packagePrice, setPackagePrice] = useState(10000000);
  const [depositAmount, setDepositAmount] = useState(3000000);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([
    'gear-sony-a74-1', // Will trigger conflict on 2026-09-25!
    'gear-lens-2470gm2'
  ]);
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Check conflict whenever date or gears change
  useEffect(() => {
    if (!eventDate || selectedGearIds.length === 0) {
      setConflictReport(null);
      return;
    }

    const check = async () => {
      setIsCheckingConflict(true);
      try {
        const res = await fetch('/api/gears/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventDate, selectedGearIds })
        });
        const json = await res.json();
        if (json.success) {
          setConflictReport(json.data);
        }
      } catch (err) {
        console.error('Failed to check conflict:', err);
      } finally {
        setIsCheckingConflict(false);
      }
    };

    const timeout = setTimeout(check, 300);
    return () => clearTimeout(timeout);
  }, [eventDate, selectedGearIds]);

  const toggleGear = (gearId: string) => {
    setSelectedGearIds(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  const handleApplyRentalCost = (cost: number) => {
    setPackagePrice(prev => prev + cost);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          clientEmail,
          sessionType,
          eventDate,
          startTime,
          endTime,
          location,
          packagePrice,
          depositAmount,
          paidAmount: 0,
          assignedGearIds: selectedGearIds,
          workflowStage: 'lead',
          paymentStatus: 'unpaid',
        })
      });
      const json = await res.json();
      if (json.success) {
        onQuoteCreated(json.data);
        setGeneratedLink(`${window.location.origin}/quote/${json.data.quoteToken}`);
      }
    } catch (err) {
      console.error('Failed to create quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-8 shadow-xl">
        <div className="border-b border-slate-800 pb-5 mb-6">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-400" />
            Tạo Báo Giá & Quét Đụng Thiết Bị (Smart Quote)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Hệ thống tự động kiểm tra lịch trùng của Body/Lens/Thợ phụ và đề xuất bù phí thuê ngoài.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Tên Khách Hàng / Cặp Đôi *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="VD: Cặp đôi Minh & Thảo"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Số Điện Thoại (Zalo) *
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="VD: 0987654321"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Date and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày Chụp *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Loại Hình Chụp
              </label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="wedding">Phóng sự cưới (Wedding)</option>
                <option value="prewedding">Pre-wedding</option>
                <option value="portrait">Chân dung (Portrait)</option>
                <option value="lookbook">Thời trang (Lookbook)</option>
                <option value="event">Sự kiện (Event)</option>
                <option value="commercial">Quảng cáo (Commercial)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Địa Điểm Chụp
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="VD: Phim trường Lam Vũ, Q.2"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Tổng Giá Gói Báo Giá (VNĐ)
              </label>
              <input
                type="number"
                step="500000"
                value={packagePrice}
                onChange={e => setPackagePrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-base font-bold text-emerald-400 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Số Tiền Cọc Yêu Cầu (VNĐ)
              </label>
              <input
                type="number"
                step="500000"
                value={depositAmount}
                onChange={e => setDepositAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-base font-bold text-indigo-300 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Gear Selection & Conflict Live Scanner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Gán Thiết Bị & Nhân Sự ({selectedGearIds.length} mục đã chọn)
              </label>
              {isCheckingConflict && (
                <span className="text-xs text-indigo-400 animate-pulse">Đang quét xung đột...</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {gears.map(gear => {
                const isSelected = selectedGearIds.includes(gear.id);
                return (
                  <button
                    key={gear.id}
                    type="button"
                    onClick={() => toggleGear(gear.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white font-medium'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{gear.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {gear.category.toUpperCase()} • Phí thuê bù: {gear.estimatedRentalCost.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Conflict Alert Banner */}
            <ConflictAlertBadge
              report={conflictReport}
              onApplyRentalCost={handleApplyRentalCost}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isSubmitting ? 'Đang khởi tạo...' : 'Tạo Báo Giá & Link Chốt Lịch Cho Khách'}
          </button>
        </form>

        {/* Link Generated Notification */}
        {generatedLink && (
          <div className="mt-6 p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
              <Link2 className="w-4 h-4" /> Link Báo Giá (Quote Link) Dành Cho Khách Đã Sẵn Sàng:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(generatedLink)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
