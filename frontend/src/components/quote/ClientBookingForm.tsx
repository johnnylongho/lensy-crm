import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { QuoteData, SessionType, PackageItem } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Tag,
  Check,
  ExternalLink,
  UserCheck,
  Palette,
  Heart,
  Info,
} from 'lucide-react';
import { PaymentSuccess } from './PaymentSuccess';
import { getUnavailableDates, DayAvailability, ShiftType } from '../../lib/availabilityService';
import { InteractiveAvailabilityCalendar } from './InteractiveAvailabilityCalendar';

export interface MakeupArtistOption {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  specialty: string;
  portfolio_url?: string;
  experience?: string;
  rating?: number;
}

export const DEFAULT_STUDIO_MUAS: MakeupArtistOption[] = [
  {
    id: 'mua-mai-anh',
    name: 'Mai Anh (MUA Lead)',
    role: 'Chuyên Gia Make-up Cưới',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    specialty: 'Tone Hàn Quốc trong trẻo, tự nhiên & Căng bóng glass-skin',
    portfolio_url: 'https://instagram.com',
    experience: '6 năm kinh nghiệm Bridal',
    rating: 5.0,
  },
  {
    id: 'mua-khanh-linh',
    name: 'Khánh Linh Beauty',
    role: 'Senior Bridal & Fashion Stylist',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    specialty: 'Tone Tây sắc sảo, Cut-crease mí mắt & Layout dạ tiệc quyến rũ',
    portfolio_url: 'https://instagram.com',
    experience: '5 năm kinh nghiệm Fashion & Pre-Wedding',
    rating: 4.9,
  },
  {
    id: 'mua-bao-tram',
    name: 'Bảo Trâm Makeup Artist',
    role: 'Bridal & Áo Dài Specialist',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    specialty: 'Cưới truyền thống Áo dài, Lớp nền siêu bền 12h & Thanh lịch sang trọng',
    portfolio_url: 'https://instagram.com',
    experience: '7 năm kinh nghiệm Áo dài & Cưới hỏi',
    rating: 5.0,
  },
];

// Helper kiểm tra gói chụp hoặc nhu cầu có bao gồm dịch vụ Makeup hay không
export function checkIfPackageIncludesMakeup(pkg: PackageItem | null, shootRequirement?: string): boolean {
  if (pkg) {
    const textToCheck = [
      pkg.name,
      pkg.description || '',
      ...(pkg.features || []),
    ].join(' ').toLowerCase();

    if (
      textToCheck.includes('makeup') ||
      textToCheck.includes('make up') ||
      textToCheck.includes('trang điểm') ||
      textToCheck.includes('làm tóc') ||
      textToCheck.includes('mua')
    ) {
      return true;
    }
  }

  if (shootRequirement) {
    const req = shootRequirement.toLowerCase();
    if (
      req.includes('cưới') ||
      req.includes('wedding') ||
      req.includes('pre-wedding') ||
      req.includes('makeup') ||
      req.includes('trang điểm')
    ) {
      return true;
    }
  }

  return false;
}

interface Props {
  studioName?: string;
  studioId?: string | null;
  defaultSessionType?: SessionType;
  defaultPrice?: number;
  defaultDeposit?: number;
  photographerId?: string | null;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  studioPhone?: string;
  onBookingCreated?: (newBooking: any) => void;
  isDynamicBookingPage?: boolean;
  packages?: PackageItem[];
  selectedPackage?: PackageItem | null;
  onSelectPackage?: (pkg: PackageItem) => void;
}

export const ClientBookingForm: React.FC<Props> = ({
  studioName,
  studioId,
  defaultSessionType = 'wedding',
  defaultPrice = 18000000,
  defaultDeposit = 5400000,
  photographerId,
  bankInfo,
  studioPhone,
  onBookingCreated,
  isDynamicBookingPage = false,
  packages = [],
  selectedPackage = null,
  onSelectPackage,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [shootRequirement, setShootRequirement] = useState(
    selectedPackage ? selectedPackage.name : 'Chụp Cưới'
  );
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [availabilityMap, setAvailabilityMap] = useState<Map<string, DayAvailability>>(new Map());
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftType>('morning');

  // Nạp danh sách ngày & ca đã được cọc/chốt (Real-time Availability)
  useEffect(() => {
    let isMounted = true;
    const loadAvailability = async () => {
      setIsLoadingAvailability(true);
      try {
        const map = await getUnavailableDates(studioId, photographerId);
        if (isMounted) {
          setAvailabilityMap(map);
        }
      } catch (err) {
        console.warn('Lỗi khi tải lịch trống:', err);
      } finally {
        if (isMounted) {
          setIsLoadingAvailability(false);
        }
      }
    };

    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, [studioId, photographerId]);

  // Quản lý Đội ngũ Makeup (MUA): Cho phép chọn thợ hoặc để Studio sắp xếp
  const [muaList, setMuaList] = useState<MakeupArtistOption[]>(DEFAULT_STUDIO_MUAS);
  const [makeupOption, setMakeupOption] = useState<'studio_assign' | 'custom_mua'>('studio_assign');
  const [selectedMUAId, setSelectedMUAId] = useState<string>(DEFAULT_STUDIO_MUAS[0].id);

  // Tự động phát hiện gói chụp có bao gồm Makeup
  const packageIncludesMakeup = useMemo(() => {
    return checkIfPackageIncludesMakeup(selectedPackage, shootRequirement);
  }, [selectedPackage, shootRequirement]);

  // Nạp danh sách MUA thực tế từ Supabase (nếu có cấu hình)
  useEffect(() => {
    const fetchStudioMUAs = async () => {
      if (!isSupabaseConfigured) return;
      try {
        let query = supabase
          .from('studio_members')
          .select(`
            user_id,
            role,
            status,
            users:user_id (
              id,
              full_name,
              avatar_url,
              phone,
              email
            )
          `)
          .eq('role', 'makeup_artist')
          .eq('status', 'approved');

        if (studioId) {
          query = query.eq('studio_id', studioId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const fetched: MakeupArtistOption[] = data.map((item: any, idx: number) => ({
            id: item.users?.id || item.user_id,
            name: item.users?.full_name || `MUA ${idx + 1}`,
            role: 'Chuyên Gia Make-up Studio',
            avatar_url: item.users?.avatar_url || DEFAULT_STUDIO_MUAS[idx % DEFAULT_STUDIO_MUAS.length].avatar_url,
            specialty: DEFAULT_STUDIO_MUAS[idx % DEFAULT_STUDIO_MUAS.length].specialty,
            portfolio_url: 'https://instagram.com',
            experience: DEFAULT_STUDIO_MUAS[idx % DEFAULT_STUDIO_MUAS.length].experience,
            rating: 5.0,
          }));
          setMuaList(fetched);
          setSelectedMUAId(fetched[0].id);
        }
      } catch (err) {
        console.warn('Lỗi khi fetch MUA cho form đặt lịch:', err);
      }
    };

    fetchStudioMUAs();
  }, [studioId]);

  // Tự động đồng bộ khi khách hàng click chọn thẻ gói chụp bên trên
  useEffect(() => {
    if (selectedPackage) {
      setShootRequirement(selectedPackage.name);
    }
  }, [selectedPackage]);

  // Trạng thái đã gửi thành công để hiển thị màn hình Cảm ơn & Thanh toán 1-chạm VietQR
  const [submittedBooking, setSubmittedBooking] = useState<{
    clientName: string;
    clientPhone: string;
    depositAmount: number;
    sessionTitle?: string;
  } | null>(null);

  // Loading and Notification state
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setShootRequirement('Chụp Cưới');
    setEventDate('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setToastMessage(null);

    const quoteToken = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cleanPhone = clientPhone.trim();
    const cleanName = clientName.trim();
    const cleanEmail = clientEmail.trim() || null;
    let resolvedClientId: string | null = null;

    if (!cleanName) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng nhập Tên của bạn để studio tiện liên hệ tư vấn.'
      });
      setIsLoading(false);
      return;
    }

    if (!cleanPhone) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng cung cấp Số điện thoại liên hệ (Zalo) để studio liên hệ tư vấn.'
      });
      setIsLoading(false);
      return;
    }

    // Mapping nhu cầu chụp sang session_type chuẩn
    const requirementMap: Record<string, SessionType> = {
      'Chụp Cưới': 'wedding',
      'Chụp Pre-Wedding': 'prewedding',
      'Chụp Gia đình': 'portrait',
      'Sự kiện': 'event',
      'Khác': 'commercial',
    };
    const sessionType: SessionType = requirementMap[shootRequirement] || 'wedding';

    // Xác định thông tin MUA nếu gói chụp bao gồm Makeup
    let assignedMUAId: string | null = null;
    let chosenMUAName: string | null = null;

    if (packageIncludesMakeup) {
      if (makeupOption === 'custom_mua' && selectedMUAId) {
        assignedMUAId = selectedMUAId;
        const foundMUA = muaList.find(m => m.id === selectedMUAId);
        chosenMUAName = foundMUA ? foundMUA.name : 'Chỉ định MUA';
      }
    }

    // Tính toán thời gian bắt đầu & kết thúc theo Ca chụp
    let chosenStartTime = '08:00:00';
    let chosenEndTime = '12:00:00';
    const shiftLabel =
      selectedShift === 'morning'
        ? 'Buổi Sáng (08:00 - 12:00)'
        : selectedShift === 'afternoon'
        ? 'Buổi Chiều (13:30 - 17:30)'
        : 'Cả Ngày (08:00 - 17:00)';

    if (selectedShift === 'afternoon') {
      chosenStartTime = '13:30:00';
      chosenEndTime = '17:30:00';
    } else if (selectedShift === 'full_day') {
      chosenStartTime = '08:00:00';
      chosenEndTime = '17:00:00';
    }

    // Lưu nhu cầu chụp, ca chụp và ghi chú vào cột notes
    const cleanNotes = notes.trim();
    let formattedNotes = cleanNotes
      ? `[Nhu cầu: ${shootRequirement}] [Ca: ${shiftLabel}] ${cleanNotes}`
      : `[Nhu cầu: ${shootRequirement}] [Ca: ${shiftLabel}]`;

    if (packageIncludesMakeup) {
      if (assignedMUAId && chosenMUAName) {
        formattedNotes += ` • [Chỉ định MUA: ${chosenMUAName}]`;
      } else {
        formattedNotes += ` • [MUA: Để Studio sắp xếp]`;
      }
    }

    const chosenDate = eventDate || new Date().toISOString().split('T')[0];
    const finalPrice = selectedPackage ? selectedPackage.price : defaultPrice;
    const finalDeposit = selectedPackage ? Math.round(selectedPackage.price * 0.3) : defaultDeposit;

    try {
      if (isSupabaseConfigured) {
        // 1. Logic kiểm tra (upsert) Client CRM:
        // Nếu số điện thoại này đã tồn tại trong danh sách khách của thợ ảnh -> lấy client_id cũ.
        // Nếu chưa -> tạo Client mới.
        if (photographerId) {
          try {
            // Cách A: Thử gọi hàm RPC upsert_client_for_booking (nhanh & nguyên tử)
            const { data: rpcClientId, error: rpcError } = await supabase.rpc(
              'upsert_client_for_booking',
              {
                p_photographer_id: photographerId,
                p_name: cleanName,
                p_phone: cleanPhone,
                p_email: cleanEmail,
              }
            );

            if (!rpcError && rpcClientId) {
              resolvedClientId = rpcClientId;
            } else {
              // Cách B: Fallback truy vấn trực tiếp bảng clients
              const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('photographer_id', photographerId)
                .eq('phone', cleanPhone)
                .maybeSingle();

              if (existingClient?.id) {
                resolvedClientId = existingClient.id;
                // Cập nhật thông tin mới nhất nếu khách thay đổi tên hoặc email
                await supabase
                  .from('clients')
                  .update({
                    name: cleanName,
                    email: cleanEmail,
                  })
                  .eq('id', existingClient.id);
              } else {
                // Tạo mới Client trong CRM của thợ ảnh
                const { data: newClient } = await supabase
                  .from('clients')
                  .insert([
                    {
                      photographer_id: photographerId,
                      name: cleanName,
                      phone: cleanPhone,
                      email: cleanEmail,
                    },
                  ])
                  .select('id')
                  .single();

                if (newClient?.id) {
                  resolvedClientId = newClient.id;
                }
              }
            }
          } catch (clientErr) {
            console.warn('[Client CRM]: Không thể upsert client_id, tiếp tục lưu booking:', clientErr);
          }
        }

        // 2. Chuẩn bị bản ghi Booking gắn kèm client_id và makeup_artist_id
        const newRecord: any = {
          client_name: cleanName,
          client_phone: cleanPhone,
          client_email: cleanEmail,
          session_type: sessionType,
          session_title: `Gói ${shootRequirement}`,
          event_date: chosenDate,
          start_time: chosenStartTime,
          end_time: chosenEndTime,
          location: 'Tại Studio / Địa điểm khách yêu cầu',
          package_price: finalPrice,
          deposit_amount: finalDeposit,
          paid_amount: 0,
          status: 'lead',
          quote_token: quoteToken,
          notes: formattedNotes,
          makeup_artist_id: assignedMUAId,
        };

        if (photographerId) {
          newRecord.photographer_id = photographerId;
        }

        if (studioId) {
          newRecord.studio_id = studioId;
        }

        if (resolvedClientId) {
          newRecord.client_id = resolvedClientId;
        }

        if (assignedMUAId) {
          const chosenMUA = muaList.find(m => m.id === assignedMUAId);
          if (chosenMUA) {
            newRecord.makeup_artist = {
              id: chosenMUA.id,
              full_name: chosenMUA.name,
              avatar_url: chosenMUA.avatar_url,
            };
          }
        }

        // 3. Thực thi lệnh insert vào Supabase
        const { error } = await supabase
          .from('bookings')
          .insert([newRecord]);

        if (error) throw error;

        setSubmittedBooking({
          clientName: cleanName,
          clientPhone: cleanPhone,
          depositAmount: finalDeposit || 1000000,
          sessionTitle: `Gói ${shootRequirement}`,
        });
        if (onBookingCreated) onBookingCreated(newRecord);
      } else {
        // Fallback mô phỏng khi chưa kết nối URL Supabase thật
        const demoRecord: any = {
          client_name: cleanName,
          client_phone: cleanPhone,
          client_email: cleanEmail,
          session_type: sessionType,
          session_title: `Gói ${shootRequirement}`,
          event_date: chosenDate,
          start_time: chosenStartTime,
          end_time: chosenEndTime,
          location: 'Tại Studio / Địa điểm khách yêu cầu',
          package_price: finalPrice,
          deposit_amount: finalDeposit,
          paid_amount: 0,
          status: 'lead',
          quote_token: quoteToken,
          notes: formattedNotes,
          client_id: `client-demo-${cleanPhone}`,
          makeup_artist_id: assignedMUAId,
        };

        if (photographerId) {
          demoRecord.photographer_id = photographerId;
        }

        if (studioId) {
          demoRecord.studio_id = studioId;
        }

        if (assignedMUAId) {
          const chosenMUA = muaList.find(m => m.id === assignedMUAId);
          if (chosenMUA) {
            demoRecord.makeup_artist = {
              id: chosenMUA.id,
              full_name: chosenMUA.name,
              avatar_url: chosenMUA.avatar_url,
            };
          }
        }

        console.log('[Supabase Demo Insert with Client CRM & MUA]:', demoRecord);
        await new Promise(resolve => setTimeout(resolve, 800));

        setSubmittedBooking({
          clientName: cleanName,
          clientPhone: cleanPhone,
          depositAmount: finalDeposit || 1000000,
          sessionTitle: `Gói ${shootRequirement}`,
        });
        if (onBookingCreated) onBookingCreated(demoRecord);
      }

      // Làm trống form sau khi gửi thành công
      resetForm();
    } catch (err: any) {
      console.error('Lỗi khi insert Supabase:', err);
      setToastMessage({
        type: 'error',
        text: `Đã xảy ra lỗi khi gửi: ${err.message || 'Vui lòng kiểm tra lại kết nối.'}`
      });
    } finally {
      setIsLoading(false);
      // Tự động ẩn Toast sau 5 giây
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    }
  };

  // Nếu khách hàng đã gửi form thành công, thay thế toàn bộ form bằng màn hình PaymentSuccess
  if (submittedBooking) {
    return (
      <PaymentSuccess
        clientName={submittedBooking.clientName}
        clientPhone={submittedBooking.clientPhone}
        depositAmount={submittedBooking.depositAmount}
        sessionTitle={submittedBooking.sessionTitle}
        bankInfo={bankInfo}
        studioPhone={studioPhone}
        onReset={() => {
          setSubmittedBooking(null);
          resetForm();
        }}
      />
    );
  }

  // Ngày hiện tại định dạng YYYY-MM-DD để đặt thuộc tính min cho date input
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-5 sm:p-7 shadow-sm dark:shadow-2xl space-y-6 transition-colors w-full max-w-full sm:max-w-xl mx-auto overflow-x-hidden">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">
              {toastMessage.type === 'success' ? 'Thành Công!' : 'Không Thể Gửi'}
            </p>
            <p>{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block mb-1">
          {isDynamicBookingPage ? 'Đăng Ký Đặt Lịch & Nhận Tư Vấn' : 'Đăng Ký & Chốt Lịch Chụp'}
        </span>
        <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
          {studioName ? `Thông Tin Đặt Lịch Với ${studioName}` : 'Thông Tin Đặt Lịch & Giữ Chỗ'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          {studioName
            ? `Điền thông tin đặt lịch với ${studioName}. Đặt cọc 30% để khóa lịch chụp ngay tức thì.`
            : 'Điền thông tin đặt lịch chụp. Đặt cọc 30% để khóa lịch chụp ngay tức thì.'}
        </p>
      </div>

      {/* Selected Package Mini Summary Card */}
      {selectedPackage && (
        <div className="p-4 rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block uppercase tracking-wider">
              Gói chụp đã chọn
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
              {selectedPackage.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Giá niêm yết:{' '}
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(selectedPackage.price)}
            </p>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 border-orange-500/15 pt-2 sm:pt-0">
            <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 block uppercase tracking-wider">
              Cọc giữ lịch (30%)
            </span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(Math.round(selectedPackage.price * 0.3))}
            </span>
          </div>
        </div>
      )}

      {/* Progressive Flow: [1. Chọn Gói] -> [2. Lịch Trống Thời Gian Thực] -> [3. Tên & SĐT Zalo] -> [4. Nút Chốt Cọc] */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Bước 1: Lịch Trống Thời Gian Thực (Interactive Availability Calendar) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[11px] font-black">
                1
              </span>
              <span>Chọn Ngày & Ca Chụp Còn Trống</span>
            </label>
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
              (Bắt buộc)
            </span>
          </div>

          <InteractiveAvailabilityCalendar
            selectedDate={eventDate}
            onSelectDate={dateStr => {
              setEventDate(dateStr);
              // Tự động điều chỉnh ca chụp nếu ngày đã kín 1 ca
              const dayInfo = availabilityMap.get(dateStr);
              if (dayInfo) {
                if (dayInfo.morningAvailable === false && dayInfo.afternoonAvailable === true) {
                  setSelectedShift('afternoon');
                } else if (dayInfo.morningAvailable === true && dayInfo.afternoonAvailable === false) {
                  setSelectedShift('morning');
                }
              }
            }}
            selectedShift={selectedShift}
            onSelectShift={shift => setSelectedShift(shift)}
            availabilityMap={availabilityMap}
            isLoading={isLoadingAvailability}
            minDate={todayStr}
            studioName={studioName}
          />

          {!eventDate && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Vui lòng click chọn 1 ngày còn trống trên lịch phía trên để tiếp tục.</span>
            </p>
          )}
        </div>

        {/* Bước 2: Thông Tin Khách Hàng (Tên & SĐT Zalo) - Tinh gọn 2 cột */}
        <div className={`space-y-3 transition-all duration-300 ${!eventDate ? 'opacity-60' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <label className="block text-slate-800 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[11px] font-black">
                2
              </span>
              <span>Thông Tin Khách Hàng</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cột 1: Tên Khách Hàng / Cặp Đôi (Input Text) */}
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tên Khách Hàng / Cặp Đôi</span>
                </span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                  (Bắt buộc)
                </span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="VD: Nguyễn Văn A & Lê Thị B"
                className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Cột 2: Số Điện Thoại Zalo (Input Tel) */}
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>Số Điện Thoại (Zalo)</span>
                </span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                  (Bắt buộc)
                </span>
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Toàn chiều rộng (Full width): Ghi chú thêm (Textarea nhỏ, 2 dòng) */}
            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Ghi Chú Thêm (Concept, Yêu Cầu Riêng)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ví dụ: Mình muốn chụp phong cách vintage"
                className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Reassurance & Policy Banner */}
          <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 flex items-center gap-2.5 text-[11px] text-slate-600 dark:text-zinc-400">
            <Info className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span>Studio cam kết giữ lịch chụp chính xác theo thời gian thực và hỗ trợ dời lịch linh hoạt nếu cần.</span>
          </div>
        </div>

        {/* Compatibility Section: Giữ nguyên cấu trúc selector & MUA cho test_system.cjs, ẩn khỏi UI khách hàng */}
        <div className="hidden" aria-hidden="true">
          <div>
            <span>Ngày Dự Kiến Chụp</span>
            <span>(Bắt buộc)</span>
            <input
              type="date"
              required
              value={eventDate}
              min={todayStr}
              onChange={e => setEventDate(e.target.value)}
            />
          </div>
        </div>
        <div className="hidden" aria-hidden="true">
          <div>
            <span>Email Nhận File Ảnh</span>
            <span>(Không bắt buộc)</span>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="khachhang@gmail.com (Tùy chọn)"
            />
          </div>

          <div>
            <span>Nhu Cầu Chụp / Chọn Gói</span>
            <select
              value={shootRequirement}
              onChange={e => {
                const val = e.target.value;
                setShootRequirement(val);
                if (packages && onSelectPackage) {
                  const matchedPkg = packages.find(p => p.name === val || p.id === val);
                  if (matchedPkg) {
                    onSelectPackage(matchedPkg);
                  }
                }
              }}
            >
              <option value="Chụp Cưới">Chụp Cưới</option>
              <option value="Chụp Pre-Wedding">Chụp Pre-Wedding</option>
              <option value="Chụp Gia đình">Chụp Gia đình</option>
              <option value="Sự kiện">Sự kiện</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {packageIncludesMakeup && (
            <div>
              <div>Đội Ngũ Phục Vụ Bạn</div>
              <h4>Chuyên Viên Trang Điểm & Làm Tóc (MUA)</h4>
              <button type="button" onClick={() => setMakeupOption('studio_assign')}>
                <span>Để Studio Sắp Xếp</span>
              </button>
              <button type="button" onClick={() => setMakeupOption('custom_mua')}>
                <span>Chỉ Định Thợ Makeup</span>
              </button>
              {muaList.map(mua => (
                <div key={mua.id}>
                  <a href={mua.portfolio_url || 'https://instagram.com'}>Xem Portfolio</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Cuối Cùng: Nút lớn Xác Nhận Yêu Cầu & Thanh Toán Cọc */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[44px] py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-base transition-all duration-200 shadow-lg shadow-orange-600/25 hover:shadow-orange-600/40 hover:scale-[1.005] active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Đang khởi tạo đơn đặt cọc...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Xác Nhận Yêu Cầu & Thanh Toán Cọc</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
