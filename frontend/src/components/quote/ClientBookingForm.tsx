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

    // Lưu nhu cầu chụp và ghi chú vào cột notes
    const cleanNotes = notes.trim();
    let formattedNotes = cleanNotes
      ? `[Nhu cầu: ${shootRequirement}] ${cleanNotes}`
      : `[Nhu cầu: ${shootRequirement}]`;

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
          start_time: '08:00:00',
          end_time: '12:00:00',
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
          start_time: '08:00:00',
          end_time: '12:00:00',
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
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-5">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-sm text-white mb-0.5">
              {toastMessage.type === 'success' ? 'Thành Công!' : 'Không Thể Gửi'}
            </p>
            <p>{toastMessage.text}</p>
          </div>
        </div>
      )}

      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
          {isDynamicBookingPage ? 'Đăng Ký Đặt Lịch & Nhận Tư Vấn' : 'Đăng Ký & Chốt Lịch Chụp'}
        </span>
        <h3 className="text-lg font-bold text-white">
          {studioName ? `Gửi Yêu Cầu Đặt Lịch Tới ${studioName}` : 'Gửi Yêu Cầu Đặt Lịch Chụp'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {studioName
            ? `Điền thông tin buổi chụp của bạn. Ekip ${studioName} sẽ liên hệ tư vấn gói chụp phù hợp nhất.`
            : 'Điền thông tin buổi chụp của bạn. Chúng tôi sẽ liên hệ tư vấn gói chụp phù hợp nhất cho bạn.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Client Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Tên Khách Hàng / Cặp Đôi</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                (Bắt buộc)
              </span>
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="VD: Nguyễn Văn A & Lê Thị B"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Số Điện Thoại (Zalo)</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                (Bắt buộc)
              </span>
            </label>
            <input
              type="tel"
              required
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              placeholder="VD: 0912345678"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Email & Nhu cầu chụp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Nhận File Ảnh</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                (Không bắt buộc)
              </span>
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="khachhang@gmail.com (Tùy chọn)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Nhu Cầu Chụp / Chọn Gói</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                (Bắt buộc)
              </span>
            </label>
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
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-colors"
            >
              {packages && packages.length > 0 && (
                <optgroup label="✨ Gói Dịch Vụ Niêm Yết">
                  {packages.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} — {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p.price)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="📋 Nhu Cầu Tiêu Chuẩn">
                <option value="Chụp Cưới">Chụp Cưới</option>
                <option value="Chụp Pre-Wedding">Chụp Pre-Wedding</option>
                <option value="Chụp Gia đình">Chụp Gia đình</option>
                <option value="Sự kiện">Sự kiện</option>
                <option value="Khác">Khác</option>
              </optgroup>
            </select>

            {/* Selected Package Highlight Badge */}
            {selectedPackage && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-white font-bold line-clamp-1">
                    Gói đã chọn: <span className="text-amber-300">{selectedPackage.name}</span>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-bold flex-shrink-0 ml-2">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(selectedPackage.price)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ngày dự kiến (Date Picker) */}
        <div>
          <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Ngày Dự Kiến Chụp</span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              (Bắt buộc)
            </span>
          </label>
          <input
            type="date"
            required
            value={eventDate}
            min={todayStr}
            onChange={e => setEventDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-colors"
          />
        </div>

        {/* Đội Ngũ Phục Vụ Bạn (MUA Selection) - Tự động hiển thị khi gói có Makeup */}
        {packageIncludesMakeup && (
          <div className="rounded-2xl bg-gradient-to-b from-purple-950/20 via-slate-900/60 to-slate-900/90 border border-fuchsia-500/30 p-4 sm:p-5 space-y-4 animate-fadeIn shadow-lg shadow-fuchsia-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-fuchsia-500/20 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-fuchsia-400" />
                  <span>Đội Ngũ Phục Vụ Bạn</span>
                </div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Chuyên Viên Trang Điểm & Làm Tóc (MUA)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    Đã bao gồm trong gói
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gói dịch vụ đã bao gồm thợ makeup chuyên nghiệp. Bạn có thể để Studio sắp xếp hoặc chỉ định chuyên gia yêu thích.
                </p>
              </div>
            </div>

            {/* Lựa chọn: Để Studio sắp xếp vs Chỉ định thợ Makeup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMakeupOption('studio_assign')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  makeupOption === 'studio_assign'
                    ? 'bg-fuchsia-500/15 border-fuchsia-500 text-white shadow-md shadow-fuchsia-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    makeupOption === 'studio_assign'
                      ? 'border-fuchsia-500 bg-fuchsia-500 text-slate-950'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {makeupOption === 'studio_assign' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Để Studio Sắp Xếp</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Studio sẽ lựa chọn MUA phù hợp nhất với phong cách concept, trang phục và thời gian chụp của bạn.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMakeupOption('custom_mua')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  makeupOption === 'custom_mua'
                    ? 'bg-fuchsia-500/15 border-fuchsia-500 text-white shadow-md shadow-fuchsia-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                    makeupOption === 'custom_mua'
                      ? 'border-fuchsia-500 bg-fuchsia-500 text-slate-950'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {makeupOption === 'custom_mua' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Chỉ Định Thợ Makeup</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-semibold uppercase">
                      Tùy chọn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Khám phá phong cách của từng chuyên viên make-up, xem link portfolio và chỉ định người phụ trách cho show.
                  </p>
                </div>
              </button>
            </div>

            {/* Khi chọn "Chỉ định thợ Makeup" -> Hiển thị danh sách Thợ kèm Avatar, Tên, Style và link Portfolio */}
            {makeupOption === 'custom_mua' ? (
              <div className="space-y-2.5 pt-1 animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Chọn Chuyên Viên Make-up Của Bạn:</span>
                  <span className="text-[10px] text-fuchsia-400 font-normal">Minh bạch hồ sơ & Portfolio</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {muaList.map(mua => {
                    const isSelected = selectedMUAId === mua.id;
                    return (
                      <div
                        key={mua.id}
                        onClick={() => setSelectedMUAId(mua.id)}
                        className={`relative rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-fuchsia-950/40 border-fuchsia-500 ring-1 ring-fuchsia-500/50 shadow-lg shadow-fuchsia-950/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={mua.avatar_url}
                              alt={mua.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-fuchsia-500/40 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs truncate">
                                  {mua.name}
                                </span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
                              </div>
                              <span className="text-[10px] text-fuchsia-300/80 font-medium block">
                                {mua.role}
                              </span>
                              {mua.experience && (
                                <span className="text-[10px] text-slate-500 block">
                                  {mua.experience}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                            <span className="text-fuchsia-400 font-semibold">Phong cách: </span>
                            {mua.specialty}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          {mua.portfolio_url ? (
                            <a
                              href={mua.portfolio_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-fuchsia-400 hover:text-fuchsia-300 hover:underline transition-colors"
                            >
                              <span>Xem Portfolio</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500">Portfolio tại Studio</span>
                          )}

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedMUAId(mua.id);
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-fuchsia-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? 'Đã Chọn' : 'Chọn Thợ'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2 overflow-hidden">
                    {muaList.slice(0, 3).map((m, i) => (
                      <img
                        key={m.id || i}
                        src={m.avatar_url}
                        alt={m.name}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-900 object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-slate-300 text-[11px]">
                    Đội ngũ <strong className="text-white">{muaList.length}+ chuyên gia makeup</strong> chuẩn bị sẵn sàng phục vụ buổi chụp của bạn.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMakeupOption('custom_mua')}
                  className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-semibold underline underline-offset-2 flex-shrink-0 ml-2"
                >
                  Tự chọn thợ ↗
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ghi chú thêm (Textarea) */}
        <div>
          <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Ghi Chú Thêm (Concept, Yêu Cầu Riêng)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ví dụ: Mình muốn chụp phong cách vintage"
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none transition-colors resize-none placeholder-slate-600"
          />
        </div>

        {/* Submit Button with Loading */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Đang gửi thông tin đặt lịch...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-slate-950" />
              <span>Gửi Yêu Cầu Đặt Lịch</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
