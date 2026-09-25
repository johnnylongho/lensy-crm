import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { QuoteData, SessionType, PackageItem } from '../../types';
import { Calendar, Clock, MapPin, User, Phone, Mail, FileText, Send, Loader2, CheckCircle2, AlertTriangle, Sparkles, Tag, Check } from 'lucide-react';
import { PaymentSuccess } from './PaymentSuccess';

interface Props {
  studioName?: string;
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

    // Lưu nhu cầu chụp và ghi chú vào cột notes
    const cleanNotes = notes.trim();
    const formattedNotes = cleanNotes
      ? `[Nhu cầu: ${shootRequirement}] ${cleanNotes}`
      : `[Nhu cầu: ${shootRequirement}]`;

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

        // 2. Chuẩn bị bản ghi Booking gắn kèm client_id
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
        };

        if (photographerId) {
          newRecord.photographer_id = photographerId;
        }

        if (resolvedClientId) {
          newRecord.client_id = resolvedClientId;
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
        };

        if (photographerId) {
          demoRecord.photographer_id = photographerId;
        }

        console.log('[Supabase Demo Insert with Client CRM]:', demoRecord);
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
