import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { STUDIO_GEARS, scanGearConflicts, ConflictScanResult } from '../../lib/conflictScanner';
import { SessionType, CalendarEvent } from '../../types';
import {
  X,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Camera,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingEvents: CalendarEvent[];
  onQuoteCreated: (newEvent: CalendarEvent) => void;
}

const SESSION_PRESETS: { type: SessionType; label: string; defaultPrice: number; defaultGears: string[] }[] = [
  {
    type: 'wedding',
    label: 'Phóng Sự Cưới (Wedding)',
    defaultPrice: 18000000,
    defaultGears: ['body-sony-a74', 'body-sony-a7rv', 'lens-2470', 'lens-70200', 'flash-godox', 'crew-second-shooter'],
  },
  {
    type: 'prewedding',
    label: 'Ảnh Cưới Ngoại Cảnh (Pre-wedding)',
    defaultPrice: 15000000,
    defaultGears: ['body-sony-a74', 'lens-2470', 'lens-50', 'crew-makeup'],
  },
  {
    type: 'lookbook',
    label: 'Lookbook Thời Trang (Fashion)',
    defaultPrice: 8000000,
    defaultGears: ['body-sony-a7rv', 'lens-2470', 'lens-50', 'flash-godox'],
  },
  {
    type: 'portrait',
    label: 'Chân Dung Profile / Nghệ Thuật',
    defaultPrice: 4500000,
    defaultGears: ['body-sony-a74', 'lens-50'],
  },
  {
    type: 'event',
    label: 'Sự Kiện & Khai Trương',
    defaultPrice: 10000000,
    defaultGears: ['body-sony-a74', 'lens-2470', 'flash-godox'],
  },
  {
    type: 'commercial',
    label: 'Thương Mại & Quảng Cáo (Brand)',
    defaultPrice: 20000000,
    defaultGears: ['body-sony-a7rv', 'lens-2470', 'lens-70200', 'flash-godox', 'crew-second-shooter'],
  },
];

export const CreateQuoteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  existingEvents,
  onQuoteCreated,
}) => {
  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('wedding');
  const [sessionTitle, setSessionTitle] = useState('Gói Phóng Sự Cưới Cao Cấp');
  const [eventDate, setEventDate] = useState('2026-10-20');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('13:30');
  const [location, setLocation] = useState('');
  const [packagePrice, setPackagePrice] = useState(18000000);
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [selectedGears, setSelectedGears] = useState<string[]>([
    'body-sony-a74',
    'lens-2470',
    'lens-70200',
    'flash-godox',
  ]);
  const [notes, setNotes] = useState('');

  // Status & Success state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdQuoteData, setCreatedQuoteData] = useState<{
    token: string;
    clientName: string;
    sessionTitle: string;
    price: number;
    deposit: number;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Khi thay đổi loại gói chụp -> cập nhật gợi ý tiêu đề, giá và thiết bị
  const handleSelectSessionType = (type: SessionType) => {
    setSessionType(type);
    const preset = SESSION_PRESETS.find(p => p.type === type);
    if (preset) {
      setSessionTitle(`Gói ${preset.label}`);
      setPackagePrice(preset.defaultPrice);
      setSelectedGears(preset.defaultGears);
    }
  };

  // Toggle thiết bị
  const handleToggleGear = (gearId: string) => {
    setSelectedGears(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  // Tính số tiền cọc (30% hoặc theo % chọn)
  const depositAmount = Math.round((packagePrice * depositPercentage) / 100);

  // Quét xung đột thiết bị theo thời gian thực (USP 1)
  const conflictResult: ConflictScanResult = scanGearConflicts(
    eventDate,
    selectedGears,
    existingEvents
  );

  // Xử lý tự động cộng phí thuê ngoài khi bị đụng thiết bị
  const handleApplyRentalCost = () => {
    if (conflictResult.totalAdditionalRentalCost > 0) {
      setPackagePrice(prev => prev + conflictResult.totalAdditionalRentalCost);
      const conflictNames = conflictResult.conflicts.map(c => c.gear.name).join(', ');
      setNotes(prev =>
        prev
          ? `${prev}\n[Phụ phí thuê thiết bị ngoài thay thế: ${conflictNames}]`
          : `[Phụ phí thuê thiết bị ngoài thay thế: ${conflictNames}]`
      );
    }
  };

  // Gửi tạo báo giá mới
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Tên và Số điện thoại khách hàng.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Sinh quote token độc nhất
    const cleanClientCode = clientName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 16);
    const quoteToken = `q-${cleanClientCode}-${Date.now().toString().slice(-5)}`;

    // Tạo chuỗi ghi chú kèm danh sách thiết bị để hỗ trợ Conflict Scanner
    const gearNames = selectedGears
      .map(id => STUDIO_GEARS.find(g => g.id === id)?.name || id)
      .join('; ');
    const combinedNotes = `[Gears: ${gearNames}] ${notes ? notes : ''}`.trim();

    const newBookingRecord: any = {
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: clientEmail.trim() || null,
      session_type: sessionType,
      session_title: sessionTitle.trim(),
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      location: location.trim() || 'Tại Studio / Địa điểm theo yêu cầu',
      package_price: packagePrice,
      deposit_amount: depositAmount,
      paid_amount: 0,
      status: 'cho_coc',
      quote_token: quoteToken,
      notes: combinedNotes,
    };

    try {
      let createdId = `ev-${Date.now()}`;

      if (isSupabaseConfigured) {
        // Tự động gán photographer_id & upsert client_id vào Client CRM
        try {
          const { data: authData } = await supabase.auth.getUser();
          const photographerId = authData?.user?.id;

          if (photographerId) {
            newBookingRecord.photographer_id = photographerId;

            const { data: rpcClientId, error: rpcError } = await supabase.rpc(
              'upsert_client_for_booking',
              {
                p_photographer_id: photographerId,
                p_name: newBookingRecord.client_name,
                p_phone: newBookingRecord.client_phone,
                p_email: newBookingRecord.client_email,
              }
            );

            if (!rpcError && rpcClientId) {
              newBookingRecord.client_id = rpcClientId;
            } else {
              const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('photographer_id', photographerId)
                .eq('phone', newBookingRecord.client_phone)
                .maybeSingle();

              if (existingClient?.id) {
                newBookingRecord.client_id = existingClient.id;
              } else {
                const { data: newClient } = await supabase
                  .from('clients')
                  .insert([
                    {
                      photographer_id: photographerId,
                      name: newBookingRecord.client_name,
                      phone: newBookingRecord.client_phone,
                      email: newBookingRecord.client_email,
                    },
                  ])
                  .select('id')
                  .single();

                if (newClient?.id) {
                  newBookingRecord.client_id = newClient.id;
                }
              }
            }
          }
        } catch (crmErr) {
          console.warn('[CreateQuoteModal]: Bỏ qua bước Client CRM do lỗi:', crmErr);
        }

        const { data, error } = await supabase
          .from('bookings')
          .insert([newBookingRecord])
          .select()
          .single();

        if (error) throw error;
        if (data) createdId = data.id;
      }

      const newCalendarEvent: CalendarEvent = {
        id: createdId,
        clientName: newBookingRecord.client_name,
        sessionType: newBookingRecord.session_type,
        eventDate: newBookingRecord.event_date,
        startTime: newBookingRecord.start_time.substring(0, 5),
        endTime: newBookingRecord.end_time.substring(0, 5),
        location: newBookingRecord.location,
        status: 'cho_coc',
        packagePrice: newBookingRecord.package_price,
        depositAmount: newBookingRecord.deposit_amount,
        paidAmount: 0,
        remainingAmount: newBookingRecord.package_price,
      };

      onQuoteCreated(newCalendarEvent);
      setCreatedQuoteData({
        token: quoteToken,
        clientName: clientName.trim(),
        sessionTitle: sessionTitle.trim(),
        price: packagePrice,
        deposit: depositAmount,
      });
    } catch (err: any) {
      console.error('Lỗi khi tạo báo giá trên Supabase:', err);
      setErrorMessage(err.message || 'Không thể tạo báo giá. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const quoteUrl = createdQuoteData
    ? `${window.location.origin}/quote/${createdQuoteData.token}`
    : '';

  const handleCopyLink = () => {
    if (!quoteUrl) return;
    navigator.clipboard.writeText(quoteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const getZaloShareText = () => {
    if (!createdQuoteData) return '';
    return `Chào ${createdQuoteData.clientName}! Mirmia Studio & Academy gửi bạn Thư Báo Giá & Chi Tiết Lịch Chụp "${createdQuoteData.sessionTitle}":\n🔗 Link xem chi tiết & xác nhận giữ lịch: ${quoteUrl}\nTổng chi phí: ${createdQuoteData.price.toLocaleString('vi-VN')} đ (Cọc giữ lịch 30%: ${createdQuoteData.deposit.toLocaleString('vi-VN')} đ).\nBạn kiểm tra link trên và phản hồi sớm giúp Studio nhé!`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c1220] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Tạo Thư Báo Giá Mới (Quote Generator)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tự động kiểm tra xung đột thiết bị (USP 1) & xuất link gửi khách
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Màn hình thành công khi đã tạo xong */}
          {createdQuoteData ? (
            <div className="py-6 space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Tạo Thư Báo Giá Thành Công!
                </h4>
                <p className="text-slate-400">
                  Link báo giá riêng tư đã được tạo cho khách hàng{' '}
                  <strong className="text-amber-400">{createdQuoteData.clientName}</strong>
                </p>
              </div>

              {/* Link Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 max-w-lg mx-auto">
                <span className="font-mono text-[11px] text-amber-300 truncate text-left flex-1">
                  {quoteUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs flex-shrink-0 ${
                    isCopied
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Đã Copy!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Actions Button */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={`/quote/${createdQuoteData.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  <span>Mở Xem Thử Ngay</span>
                </a>

                <a
                  href={`https://zalo.me/${clientPhone.replace(/^0/, '84')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    navigator.clipboard.writeText(getZaloShareText());
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Gửi Zalo (Tự copy tin nhắn)</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedQuoteData(null);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  Đóng & Xem Lịch
                </button>
              </div>
            </div>
          ) : (
            /* Form nhập thông tin */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Chọn loại gói chụp */}
              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">
                  1. Chọn Gói Chụp Phù Hợp:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SESSION_PRESETS.map(preset => (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => handleSelectSessionType(preset.type)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        sessionType === preset.type
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">{preset.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Từ {preset.defaultPrice.toLocaleString('vi-VN')} đ
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Thông tin khách hàng & Buổi chụp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Tên Khách Hàng / Cặp Đôi *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="VD: Anh Nam & Chị Linh"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Số Điện Thoại (Zalo) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tiêu Đề Báo Giá (Hiển thị đầu thư)
                  </label>
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={e => setSessionTitle(e.target.value)}
                    placeholder="VD: Gói Phóng Sự Cưới Trọn Gói Luxury"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ngày Chụp (Event Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Khung Giờ (Start - End)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono text-center focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white font-mono text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Địa Điểm Chụp
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="VD: White Palace Hoàng Văn Thụ, Q. Phú Nhuận"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* 3. Phân bổ Thiết Bị & Quét Xung Đột (USP 1) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>3. Thiết Bị & Nhân Sự Sử Dụng:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Đã chọn {selectedGears.length} mục
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STUDIO_GEARS.map(gear => {
                    const isChecked = selectedGears.includes(gear.id);
                    return (
                      <label
                        key={gear.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleGear(gear.id)}
                          className="rounded border-slate-700 text-indigo-500 focus:ring-0"
                        />
                        <span className="truncate text-[11px] font-medium">{gear.name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* CẢNH BÁO XUNG ĐỘT (RED FLAG BANNER - USP 1) */}
                {conflictResult.hasConflict && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                      <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
                      <span>CẢNH BÁO ĐỤNG THIẾT BỊ / NHÂN SỰ CÙNG NGÀY {eventDate}:</span>
                    </div>

                    <ul className="space-y-1 text-[11px] pl-6 list-disc">
                      {conflictResult.conflicts.map((c, i) => (
                        <li key={i}>
                          <strong className="text-rose-100">{c.gear.name}</strong> đã được xếp cho
                          show{' '}
                          <span className="font-bold text-amber-300">
                            "{c.conflictingBooking.clientName}"
                          </span>{' '}
                          (Chi phí thuê ngoài ước tính: {c.gear.rentalCost.toLocaleString('vi-VN')} đ)
                        </li>
                      ))}
                    </ul>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-rose-300">
                        Tổng phụ phí phát sinh: +
                        {conflictResult.totalAdditionalRentalCost.toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyRentalCost}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] transition-all shadow"
                      >
                        + Tự động cộng vào báo giá
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Giá Gói & Tiền Cọc */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] font-bold block">
                    Giá Trọn Gói (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={500000}
                    value={packagePrice}
                    onChange={e => setPackagePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] font-bold block">
                    Tỷ Lệ Cọc (%)
                  </label>
                  <select
                    value={depositPercentage}
                    onChange={e => setDepositPercentage(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value={20}>20%</option>
                    <option value={30}>30% (Khuyên dùng)</option>
                    <option value={40}>40%</option>
                    <option value={50}>50% (Tiêu chuẩn)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] font-bold block">
                    Tiền Cọc Cần Chuyển (30%)
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold">
                    {depositAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo & Xuất Link Báo Giá</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
