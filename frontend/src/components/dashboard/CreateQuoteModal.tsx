import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { scanGearConflicts, ConflictScanResult, GearItem } from '../../lib/conflictScanner';
import { SessionType, CalendarEvent } from '../../types';
import { notifyNewBooking, notifyResourceConflict } from '../../lib/telegramNotifier';
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
import { formatCurrencyVND, parseCurrencyVND } from '../../utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingEvents: CalendarEvent[];
  onQuoteCreated: (newEvent: CalendarEvent) => void;
}

export interface DbPackage {
  id: string;
  name: string;
  price: number;
  description?: string;
  features?: string[];
  is_active?: boolean;
}

export interface DbGear {
  id: string;
  name: string;
  type?: string;
  status?: string;
  serial_number?: string;
  rental_cost?: number;
  purchase_price?: number;
}

export const CreateQuoteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  existingEvents,
  onQuoteCreated,
}) => {
  // Workspace & Auth state
  const { currentStudio, isStudioMember } = useWorkspace();
  const { user } = useAuth();

  // Real Database state
  const [packagesList, setPackagesList] = useState<DbPackage[]>([]);
  const [gearsList, setGearsList] = useState<DbGear[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isLoadingGears, setIsLoadingGears] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

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
  const [selectedGears, setSelectedGears] = useState<string[]>([]);
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

  // Tự động nhận diện sessionType từ tên gói
  const detectSessionType = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes('cưới') || norm.includes('wedding')) setSessionType('wedding');
    else if (norm.includes('prewedding') || norm.includes('ngoại cảnh')) setSessionType('prewedding');
    else if (norm.includes('lookbook') || norm.includes('thời trang')) setSessionType('lookbook');
    else if (norm.includes('chân dung') || norm.includes('portrait')) setSessionType('portrait');
    else if (norm.includes('sự kiện') || norm.includes('event')) setSessionType('event');
    else if (norm.includes('thương mại') || norm.includes('commercial')) setSessionType('commercial');
    else setSessionType('portrait');
  };

  // 2. Kéo Dữ liệu Thật từ Database (Fetch Real Data) với AbortController
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    let isMounted = true;

    const fetchRealData = async () => {
      setIsLoadingPackages(true);
      setIsLoadingGears(true);

      try {
        if (!isSupabaseConfigured) {
          setIsLoadingPackages(false);
          setIsLoadingGears(false);
          return;
        }

        // a) Fetch danh sách Packages thực tế của Studio
        let pkgQuery = supabase
          .from('packages')
          .select('id, name, price, description, features, is_active')
          .eq('is_active', true)
          .abortSignal(controller.signal);

        if (currentStudio?.id) {
          pkgQuery = pkgQuery.or(`studio_id.eq.${currentStudio.id},studio_id.is.null`);
        }

        const { data: pkgData, error: pkgError } = await pkgQuery.order('price', { ascending: true });
        if (!pkgError && pkgData && isMounted) {
          const parsedPackages: DbPackage[] = pkgData.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            description: p.description,
            features: Array.isArray(p.features) ? p.features : (p.features ? JSON.parse(p.features) : []),
            is_active: p.is_active,
          }));
          setPackagesList(parsedPackages);

          // Tự động chọn gói đầu tiên nếu chưa chọn
          if (parsedPackages.length > 0 && !selectedPackageId) {
            const first = parsedPackages[0];
            setSelectedPackageId(first.id);
            setSessionTitle(`Gói ${first.name}`);
            setPackagePrice(first.price);
            detectSessionType(first.name);
          }
        }

        // b) Fetch danh sách Gear thực tế trong kho (chỉ lấy các thiết bị có trạng thái khả dụng)
        let gearQuery = supabase
          .from('gears')
          .select('*')
          .neq('status', 'maintenance')
          .neq('status', 'broken')
          .neq('status', 'retired')
          .abortSignal(controller.signal);

        if (currentStudio?.id) {
          gearQuery = gearQuery.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user?.id},studio_id.is.null`);
        } else if (user?.id) {
          gearQuery = gearQuery.or(`photographer_id.eq.${user.id},studio_id.is.null`);
        }

        const { data: gearData, error: gearError } = await gearQuery.order('name', { ascending: true });
        if (!gearError && gearData && isMounted) {
          const parsedGears: DbGear[] = gearData.map((g: any) => ({
            id: g.id,
            name: g.name,
            type: g.type || g.category || 'camera',
            status: g.status || 'active',
            serial_number: g.serial_number || g.model || '',
            rental_cost: Number(g.rental_cost || g.estimated_rental_cost || (g.purchase_price ? Math.round(g.purchase_price * 0.05) : 500000)),
            purchase_price: Number(g.purchase_price || 0),
          }));

          if (parsedGears.length > 0) {
            setGearsList(parsedGears);
          } else {
            // Preset fallback studio tiêu biểu
            setGearsList([
              { id: 'body-sony-a74', name: 'Body Sony Alpha 7 IV (Chính)', type: 'camera', status: 'active', rental_cost: 800000, purchase_price: 52000000 },
              { id: 'lens-2470', name: 'Lens FE 24-70mm F2.8 GM II', type: 'lens', status: 'active', rental_cost: 450000, purchase_price: 49000000 },
              { id: 'lens-70200', name: 'Lens FE 70-200mm F2.8 GM OSS II', type: 'lens', status: 'active', rental_cost: 600000, purchase_price: 65000000 },
              { id: 'flash-ad600', name: 'Đèn Studio Godox AD600 Pro', type: 'lighting', status: 'active', rental_cost: 350000, purchase_price: 16500000 },
              { id: 'gimbal-rs3', name: 'Gimbal DJI RS3 Pro', type: 'accessory', status: 'active', rental_cost: 300000, purchase_price: 18000000 },
            ]);
          }
        } else if (gearError && isMounted) {
          console.warn('[CreateQuoteModal] Lỗi khi tải gears từ Supabase, kích hoạt fallback:', gearError);
          setGearsList([
            { id: 'body-sony-a74', name: 'Body Sony Alpha 7 IV (Chính)', type: 'camera', status: 'active', rental_cost: 800000, purchase_price: 52000000 },
            { id: 'lens-2470', name: 'Lens FE 24-70mm F2.8 GM II', type: 'lens', status: 'active', rental_cost: 450000, purchase_price: 49000000 },
            { id: 'lens-70200', name: 'Lens FE 70-200mm F2.8 GM OSS II', type: 'lens', status: 'active', rental_cost: 600000, purchase_price: 65000000 },
            { id: 'flash-ad600', name: 'Đèn Studio Godox AD600 Pro', type: 'lighting', status: 'active', rental_cost: 350000, purchase_price: 16500000 },
            { id: 'gimbal-rs3', name: 'Gimbal DJI RS3 Pro', type: 'accessory', status: 'active', rental_cost: 300000, purchase_price: 18000000 },
          ]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[CreateQuoteModal] Lỗi khi tải dữ liệu từ Supabase:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPackages(false);
          setIsLoadingGears(false);
        }
      }
    };

    fetchRealData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, currentStudio?.id, user?.id]);

  // Khi chọn một gói chụp thực tế từ Database
  const handleSelectPackage = (pkg: DbPackage) => {
    setSelectedPackageId(pkg.id);
    setSessionTitle(`Gói ${pkg.name}`);
    setPackagePrice(pkg.price);
    detectSessionType(pkg.name);
  };

  // Toggle thiết bị
  const handleToggleGear = (gearId: string) => {
    setSelectedGears(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  // Tính số tiền cọc (30% hoặc theo % chọn)
  const depositAmount = Math.round((packagePrice * depositPercentage) / 100);

  // Mảng thiết bị hỗ trợ quét xung đột
  const customGearsList: GearItem[] = gearsList.map(g => ({
    id: g.id,
    name: g.name,
    category: (g.type === 'lens' ? 'lens' : g.type === 'lighting' ? 'lighting' : 'body') as any,
    rentalCost: g.rental_cost || (g.purchase_price ? Math.round(g.purchase_price * 0.05) : 500000),
  }));

  // Quét xung đột thiết bị theo thời gian thực (USP 1)
  const conflictResult: ConflictScanResult = scanGearConflicts(
    eventDate,
    selectedGears,
    existingEvents,
    undefined,
    customGearsList
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
      .map(id => gearsList.find(g => g.id === id)?.name || id)
      .join('; ');
    const combinedNotes = `[Gears: ${gearNames}] [GearIDs: ${selectedGears.join(',')}] ${notes ? notes : ''}`.trim();

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
      status: 'lead',
      quote_token: quoteToken,
      notes: combinedNotes,
      assigned_gears: selectedGears,
      package_type: packagesList.find(p => p.id === selectedPackageId)?.name || sessionTitle.trim(),
      studio_id: isStudioMember ? null : (currentStudio?.id || null),
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
                      studio_id: currentStudio?.id || null,
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

        // Thực hiện Insert với cơ chế Fallback an toàn cho bookings_status_check
        let insertRes = await supabase
          .from('bookings')
          .insert([newBookingRecord])
          .select()
          .single();

        // Nếu database Supabase có constraint cũ chưa cập nhật, thử fallback status
        if (insertRes.error && (insertRes.error.message?.includes('bookings_status_check') || insertRes.error.code === '23514')) {
          console.warn('[CreateQuoteModal] Phát hiện constraint status, kích hoạt retry fallback...');
          const fallbackStatus = newBookingRecord.status === 'lead' ? 'cho_coc' : 'lead';
          newBookingRecord.status = fallbackStatus;
          insertRes = await supabase
            .from('bookings')
            .insert([newBookingRecord])
            .select()
            .single();
        }

        if (insertRes.error) throw insertRes.error;
        if (insertRes.data) createdId = insertRes.data.id;
      }

      const newCalendarEvent: CalendarEvent = {
        id: createdId,
        clientName: newBookingRecord.client_name,
        clientPhone: newBookingRecord.client_phone,
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
        studio_id: currentStudio?.id,
      };

      onQuoteCreated(newCalendarEvent);

      // Gửi thông báo Telegram tức thì về show mới
      notifyNewBooking(
        {
          clientName: newBookingRecord.client_name,
          clientPhone: newBookingRecord.client_phone,
          eventDate: newBookingRecord.event_date,
          sessionType: newBookingRecord.package_type || newBookingRecord.session_type,
          packagePrice: newBookingRecord.package_price,
          quoteToken: quoteToken,
        },
        currentStudio?.id,
        currentStudio?.name
      );

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-hidden p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col text-zinc-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/90 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Tạo Thư Báo Giá Mới (Quote Generator)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Tự động kiểm tra xung đột thiết bị (USP 1) & xuất link gửi khách
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Màn hình thành công khi đã tạo xong */}
          {createdQuoteData ? (
            <div className="py-6 space-y-6 text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Tạo Thư Báo Giá Thành Công!
                </h4>
                <p className="text-zinc-400">
                  Link báo giá riêng tư đã được tạo cho khách hàng{' '}
                  <strong className="text-amber-400">{createdQuoteData.clientName}</strong>
                </p>
              </div>

              {/* Link Box */}
              <div className="p-3 rounded-xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-between gap-2 max-w-lg mx-auto">
                <span className="font-mono text-[11px] text-amber-300 truncate text-left flex-1">
                  {quoteUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs flex-shrink-0 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20'
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
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center gap-1.5 border border-zinc-700 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-orange-400" />
                  <span>Mở Xem Thử Ngay</span>
                </a>

                <a
                  href={`https://zalo.me/${clientPhone.replace(/^0/, '84')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    navigator.clipboard.writeText(getZaloShareText());
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all"
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
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer font-medium transition-colors"
                >
                  Đóng & Xem Lịch
                </button>
              </div>
            </div>
          ) : (
            /* Form nhập thông tin */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Chọn loại gói chụp thực tế từ Database (Dropdown trên Mobile / Snap-scroll trên Desktop) */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-bold block">
                  1. Chọn Gói Chụp Phù Hợp:
                </label>
                {isLoadingPackages ? (
                  <div className="text-xs text-zinc-400 py-3 italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span>Đang tải danh sách gói chụp...</span>
                  </div>
                ) : packagesList.length > 0 ? (
                  <>
                    {/* Mobile: Thẻ Select (Dropdown) gọn gàng */}
                    <div className="sm:hidden">
                      <select
                        value={selectedPackageId || ''}
                        onChange={e => {
                          const pkg = packagesList.find(p => p.id === e.target.value);
                          if (pkg) handleSelectPackage(pkg);
                        }}
                        className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">-- Bấm để chọn gói chụp mẫu --</option>
                        {packagesList.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} ({pkg.price.toLocaleString('vi-VN')} đ)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Desktop & Tablet: Thanh cuộn ngang snap gọn gàng */}
                    <div className="hidden sm:flex overflow-x-auto snap-x gap-2 pb-1">
                      {packagesList.map(pkg => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleSelectPackage(pkg)}
                          className={`p-2.5 rounded-xl border text-left transition-all snap-start min-w-[170px] shrink-0 cursor-pointer ${
                            selectedPackageId === pkg.id
                              ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/40 text-orange-400 shadow-sm'
                              : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                          }`}
                        >
                          <div className="font-bold text-[11px] truncate text-white" title={pkg.name}>
                            {pkg.name}
                          </div>
                          <div className={`text-[10px] font-mono mt-0.5 ${selectedPackageId === pkg.id ? 'text-amber-300 font-semibold' : 'text-zinc-400'}`}>
                            Từ {pkg.price.toLocaleString('vi-VN')} đ
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-xs">
                    Chưa có gói dịch vụ nào trong hệ thống. Bạn có thể tự nhập tiêu đề và giá gói ở mục bên dưới.
                  </div>
                )}
              </div>

              {/* 2. Thông tin khách hàng & Buổi chụp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-400" /> Tên Khách Hàng / Cặp Đôi *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="VD: Anh Nam & Chị Linh"
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-400" /> Số Điện Thoại (Zalo) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="VD: 0912345678"
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Tiêu Đề Báo Giá (Hiển thị đầu thư)
                  </label>
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={e => setSessionTitle(e.target.value)}
                    placeholder="VD: Gói Phóng Sự Cưới Trọn Gói Luxury"
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" /> Ngày Chụp (Event Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" /> Khung Giờ (Start - End)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-zinc-800/90 border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-mono text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-zinc-800/90 border border-zinc-700 rounded-lg px-2.5 py-2 text-white font-mono text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" /> Địa Điểm Chụp
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="VD: White Palace Hoàng Văn Thụ, Q. Phú Nhuận"
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>
              </div>

              {/* 3. Phân bổ Thiết Bị & Quét Xung Đột (USP 1) */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-200 font-bold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span>3. Thiết Bị & Nhân Sự Sử Dụng:</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Đã chọn {selectedGears.length} mục
                  </span>
                </div>

                {isLoadingGears ? (
                  <p className="text-xs text-zinc-400 py-3 italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span>Đang tải danh sách thiết bị...</span>
                  </p>
                ) : gearsList.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">
                    Chưa có thiết bị nào khả dụng trong kho. Bạn có thể thêm thiết bị trong mục Quản lý Thiết bị.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gearsList.map(gear => {
                      const isChecked = selectedGears.includes(gear.id);
                      return (
                        <label
                          key={gear.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'border-orange-500/60 bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/30'
                              : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleGear(gear.id)}
                            className="rounded border-zinc-600 text-orange-500 focus:ring-0 focus:ring-offset-0 bg-zinc-900"
                          />
                          <span className="truncate text-[11px] font-medium" title={gear.name}>
                            {gear.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

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
                        className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-[11px] transition-all shadow cursor-pointer"
                      >
                        + Tự động cộng vào báo giá
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Giá Gói & Tiền Cọc */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-bold block">
                    Giá Trọn Gói (VNĐ)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    step="any"
                    value={packagePrice ? formatCurrencyVND(packagePrice) : ''}
                    onChange={e => setPackagePrice(parseCurrencyVND(e.target.value))}
                    placeholder="VD: 15.000.000"
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-orange-400 font-mono font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-bold block">
                    Tỷ Lệ Cọc (%)
                  </label>
                  <select
                    value={depositPercentage}
                    onChange={e => setDepositPercentage(Number(e.target.value))}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs"
                  >
                    <option value={20}>20%</option>
                    <option value={30}>30% (Khuyên dùng)</option>
                    <option value={40}>40%</option>
                    <option value={50}>50% (Tiêu chuẩn)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-bold block">
                    Tiền Cọc Cần Chuyển ({depositPercentage}%)
                  </label>
                  <div className="bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-xs flex items-center h-[34px]">
                    {depositAmount.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
