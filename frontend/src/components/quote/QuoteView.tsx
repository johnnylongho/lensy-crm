import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { QuoteHeader } from './QuoteHeader';
import { QuoteSessionInfo } from './QuoteSessionInfo';
import { QuoteInclusions } from './QuoteInclusions';
import { QuoteEquipment } from './QuoteEquipment';
import { QuotePriceSummary } from './QuotePriceSummary';
import { ClientBookingForm } from './ClientBookingForm';
import { DepositModal } from './DepositModal';
import { QuoteData, SessionType } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_QUOTE } from '../../data/mockData';
import {
  Phone,
  MessageCircle,
  Heart,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Props {
  initialQuote?: QuoteData;
  onQuoteStatusChange?: (newStatus: QuoteData['status']) => void;
  onBookingSubmit?: (newBooking: any) => void;
}

// Hàm bổ trợ tạo danh mục quyền lợi & sản phẩm bàn giao mặc định theo loại buổi chụp
function getDefaultInclusionsAndDeliverables(sessionType: SessionType) {
  switch (sessionType) {
    case 'wedding':
      return {
        inclusions: [
          {
            id: 'inc-1',
            title: '02 Thợ Chụp Chuyên Nghiệp',
            description: '01 Thợ chính bắt trọn cảm xúc + 01 Thợ phụ ghi lại khoảnh khắc gia đình & hậu trường.',
          },
          {
            id: 'inc-2',
            title: 'Hệ Máy Full-Frame & Ống Kính Cao Cấp',
            description: 'Sony A7 IV & A7R V cùng hệ ống kính G-Master chuyên chụp thiếu sáng tại sảnh tiệc.',
          },
          {
            id: 'inc-3',
            title: 'Hậu Kỳ Màu Fine-Art Độc Quyền',
            description: 'Toàn bộ file ảnh được blend màu tone điện ảnh sang trọng từ Mirmia Studio.',
          },
          {
            id: 'inc-4',
            title: 'Bàn Giao Siêu Tốc',
            description: 'Trả 30-50 ảnh Highlight trong 24h để cô dâu chú rể đăng MXH. Trả link toàn bộ trong 7 ngày.',
          },
        ],
        deliverables: [
          'Toàn bộ 800 - 1.200 file gốc chất lượng cao nhất',
          '120 file chỉnh sửa màu sắc chi tiết',
          '01 Album Photobook siêu sắc nét 30x30cm (30 trang)',
          '01 USB gỗ khắc tên riêng lưu trữ trọn đời',
          'Link Online Gallery riêng tư bảo mật 1 năm',
        ],
      };
    case 'lookbook':
    case 'commercial':
      return {
        inclusions: [
          {
            id: 'inc-1',
            title: 'Nhiếp Ảnh Gia Thương Mại (Commercial Lead)',
            description: 'Kinh nghiệm định hướng concept, tạo dáng cho mẫu và làm chủ ánh sáng studio chuyên nghiệp.',
          },
          {
            id: 'inc-2',
            title: 'Hệ Thống Đèn Studio Chuyên Nghiệp',
            description: 'Dàn đèn Godox công suất lớn, softbox tản sáng mịn làm nổi bật chất liệu vải và sản phẩm.',
          },
          {
            id: 'inc-3',
            title: 'Retouch Chi Tiết Sản Phẩm & Da',
            description: 'Xử lý nếp nhăn, chuẩn màu pantone theo yêu cầu của Brand.',
          },
        ],
        deliverables: [
          'Toàn bộ file gốc độ phân giải cao (Raw/Jpeg)',
          'Tất cả các layout lookbook đã chỉnh sửa màu & da hoàn thiện',
          'Xuất định dạng tối ưu cho Web / E-commerce & Social Media',
          'Bàn giao link Google Drive tốc độ cao trong 3-5 ngày',
        ],
      };
    default:
      return {
        inclusions: [
          {
            id: 'inc-1',
            title: 'Nhiếp Ảnh Gia Chính (Lead Photographer)',
            description: 'Dẫn dắt tạo dáng tự nhiên, bắt trọn từng khoảnh khắc chân thực và giàu cảm xúc.',
          },
          {
            id: 'inc-2',
            title: 'Thiết Bị Cao Cấp & Đèn Tản Sáng',
            description: 'Hệ máy Sony A7 IV cùng ống kính chân dung xóa phông cao cấp.',
          },
          {
            id: 'inc-3',
            title: 'Hậu Kỳ Màu Độc Quyền Mirmia',
            description: 'Blend màu nghệ thuật độc bản theo từng concept của khách hàng.',
          },
        ],
        deliverables: [
          'Toàn bộ file gốc chụp trong buổi',
          '20-30 file chỉnh sửa màu sắc & da chi tiết',
          'Link Google Drive lưu trữ an toàn trong 1 năm',
        ],
      };
  }
}

export const QuoteView: React.FC<Props> = ({
  initialQuote = MOCK_QUOTE,
  onQuoteStatusChange,
  onBookingSubmit,
}) => {
  const { token, username } = useParams<{ token?: string; username?: string }>();
  const [quote, setQuote] = useState<QuoteData>(initialQuote);
  const [photographerId, setPhotographerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token || username));
  const [isNotFound, setIsNotFound] = useState(false);
  const [isStudioNotFound, setIsStudioNotFound] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fetch dynamic studio profile by username (/book/:username)
  useEffect(() => {
    if (!username) return;

    const fetchStudioByUsername = async () => {
      setIsLoading(true);
      setIsStudioNotFound(false);
      setIsNotFound(false);

      try {
        if (isSupabaseConfigured) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

          if (userError || !userData) {
            console.warn('Không tìm thấy Studio với username:', username, userError);
            setIsStudioNotFound(true);
            setIsLoading(false);
            return;
          }

          setPhotographerId(userData.id);

          setQuote(prev => ({
            ...prev,
            studioName: userData.studio_name || 'MIRMIA STUDIO & ACADEMY',
            studioAvatarUrl: userData.avatar_url || '/mirmia-logo.png',
            studioCoverUrl: userData.cover_image || userData.cover_url || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
            photographerName: userData.full_name || 'Nhiếp Ảnh Gia',
            photographerPhone: userData.phone || '0901234567',
            photographerEmail: userData.email || 'contact@mirmia.vn',
            bankInfo: {
              bankName: userData.bank_name || 'MB Bank',
              accountNumber: userData.bank_account_number || '0901234567',
              accountName: userData.bank_account_name || userData.full_name || 'MIRMIA STUDIO',
            },
          }));
        } else {
          // Demo fallback
          if (username === 'johnnylongho') {
            setPhotographerId('87239d64-5964-47b1-a146-f12f3d41de9e');
            setQuote(prev => ({
              ...prev,
              studioName: 'MIRMIA STUDIO & ACADEMY',
              studioAvatarUrl: '/mirmia-logo.png',
              studioCoverUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
              photographerName: 'Johnny Long Hồ',
              photographerPhone: '0901234567',
            }));
          } else {
            setIsStudioNotFound(true);
          }
        }
      } catch (err) {
        console.error('Lỗi truy vấn Studio:', err);
        setIsStudioNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudioByUsername();
  }, [username]);

  // Fetch dynamic quote from Supabase by token
  useEffect(() => {
    if (username) return; // Nếu đang ở link /book/:username thì không fetch theo token

    if (!token) {
      setQuote(initialQuote);
      setIsLoading(false);
      setIsNotFound(false);
      return;
    }

    // Nếu token trùng với mock data mặc định
    if (token === MOCK_QUOTE.quoteToken) {
      setQuote(MOCK_QUOTE);
      setIsLoading(false);
      setIsNotFound(false);
      return;
    }

    const fetchQuoteByToken = async () => {
      setIsLoading(true);
      setIsNotFound(false);

      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('quote_token', token)
            .single();

          if (error || !data) {
            console.warn('Không tìm thấy booking với token:', token, error);
            setIsNotFound(true);
            return;
          }

          const pkgPrice = Number(data.package_price || 0);
          const depAmount = Number(data.deposit_amount || Math.round(pkgPrice * 0.3));
          const paidAmt = Number(data.paid_amount || 0);
          const remAmt = Number(
            data.remaining_amount !== undefined && data.remaining_amount !== null
              ? data.remaining_amount
              : pkgPrice - paidAmt
          );

          const sessionType: SessionType = data.session_type || 'wedding';
          const { inclusions, deliverables } = getDefaultInclusionsAndDeliverables(sessionType);

          // Trích xuất thiết bị từ notes nếu có
          let equipmentList = [
            'Body Sony Alpha 7 IV (Primary)',
            'Body Sony Alpha 7R V (Backup/Secondary)',
            'Lens FE 24-70mm F2.8 GM II',
            'Lens FE 70-200mm F2.8 GM OSS II',
            'Hệ thống Đèn Flash Godox V1 + AD200 Pro',
          ];

          if (data.notes && data.notes.includes('[Gears:')) {
            const match = data.notes.match(/\[Gears:\s*([^\]]+)\]/);
            if (match && match[1]) {
              equipmentList = match[1].split(';').map((s: string) => s.trim());
            }
          }

          let studioName = 'MIRMIA STUDIO & ACADEMY';
          let photogName = 'Mirmia Creative Team (Lead Photographer)';
          let photogPhone = '0901234567';
          let photogEmail = 'contact@mirmia.vn';
          let bankInfo = {
            bankName: 'MB Bank (Ngân Hàng Quân Đội)',
            accountNumber: '0901234567',
            accountName: 'MIRMIA STUDIO',
          };

          if (data.photographer_id) {
            setPhotographerId(data.photographer_id);
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.photographer_id)
                .maybeSingle();

              if (userData) {
                if (userData.phone) photogPhone = userData.phone;
                if (userData.studio_name) studioName = userData.studio_name;
                if (userData.full_name) photogName = userData.full_name;
                if (userData.email) photogEmail = userData.email;
                if (userData.bank_name) bankInfo.bankName = userData.bank_name;
                if (userData.bank_account_number) bankInfo.accountNumber = userData.bank_account_number;
                if (userData.bank_account_name) bankInfo.accountName = userData.bank_account_name;
              }
            } catch (userErr) {
              console.warn('Không thể tải thông tin thợ ảnh:', userErr);
            }
          }

          const dynamicQuote: QuoteData = {
            id: data.id,
            quoteToken: data.quote_token,
            studioName: studioName,
            studioLogoText: 'MIRMIA',
            photographerName: photogName,
            photographerPhone: photogPhone,
            photographerEmail: photogEmail,
            clientName: data.client_name,
            clientPhone: data.client_phone,
            clientEmail: data.client_email || undefined,
            sessionType: sessionType,
            sessionTitle: data.session_title || `Gói Chụp ${sessionType.toUpperCase()}`,
            eventDate: data.event_date,
            startTime: data.start_time?.substring(0, 5) || '08:00',
            endTime: data.end_time?.substring(0, 5) || '12:00',
            location: data.location || 'Tại Studio',
            packagePrice: pkgPrice,
            depositPercentage: 30,
            depositAmount: depAmount,
            remainingAmount: remAmt,
            status: data.status,
            inclusions: inclusions,
            equipmentList: equipmentList,
            deliverables: deliverables,
            specialNotes: data.notes?.replace(/\[Gears:[^\]]+\]\s*/, '') || undefined,
            validUntil: '2026-11-15',
            bankInfo: bankInfo,
          };

          setQuote(dynamicQuote);
        } else {
          // Demo fallback
          setQuote(initialQuote);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu báo giá:', err);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuoteByToken();
  }, [token, initialQuote]);

  const handleConfirmDeposit = () => {
    const updated: QuoteData = {
      ...quote,
      status: 'da_chot',
    };
    setQuote(updated);
    if (onQuoteStatusChange) {
      onQuoteStatusChange('da_chot');
    }
  };

  // Màn hình Skeleton Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Đang tải Thư Báo Giá...</h3>
            <p className="text-xs text-slate-400">
              Đang xác thực mã bảo mật và tải thông tin lịch chụp từ Mirmia Studio
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình 404 Không tìm thấy Studio (/book/:username)
  if (isStudioNotFound) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-5 p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-rose-500/30 shadow-2xl animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Không Tìm Thấy Studio Này</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tên định danh Studio / Nhiếp ảnh gia{' '}
              <strong className="text-amber-400 font-mono">@{username}</strong> không tồn tại trong hệ thống Lensy CRM. Quý khách vui lòng kiểm tra lại đường dẫn từ thợ ảnh.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book/johnnylongho"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Xem Studio Chính (@johnnylongho)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình 404 Không tìm thấy báo giá
  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-5 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Không Tìm Thấy Thư Báo Giá</h3>
            <p className="text-xs text-slate-400">
              Mã liên kết <strong>{token}</strong> không tồn tại hoặc đã hết hiệu lực. Quý khách vui lòng kiểm tra lại đường link hoặc liên hệ trực tiếp với studio.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/quote"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem Thư Báo Giá Mẫu</span>
            </Link>
            <a
              href="tel:0901234567"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 shadow"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline Studio: 0901234567</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isBookingPage = Boolean(username);
  const studioCoverUrl =
    quote.studioCoverUrl ||
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';
  const studioAvatarUrl = quote.studioAvatarUrl || '/mirmia-logo.png';
  const studioPhone = quote.photographerPhone || '0901234567';
  const cleanStudioPhone = studioPhone.replace(/[^0-9]/g, '');
  const zaloUrl = `https://zalo.me/${cleanStudioPhone}`;
  const phoneUrl = `tel:${cleanStudioPhone}`;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col luxury-gradient relative">
      {/* Dynamic SEO & Open Graph Meta Tags cho Zalo, Facebook, Telegram Preview */}
      {isBookingPage ? (
        <Helmet>
          <title>{`Đặt lịch chụp ảnh | ${quote.studioName}`}</title>
          <meta property="og:title" content={`Báo giá & Đặt lịch - ${quote.studioName}`} />
          <meta
            property="og:description"
            content={`Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}. Nền tảng được cung cấp bởi Lensy.`}
          />
          <meta property="og:image" content={studioCoverUrl || studioAvatarUrl || '/lensy-logo.png'} />
          <meta
            name="description"
            content={`Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}. Nền tảng được cung cấp bởi Lensy.`}
          />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`Báo giá & Đặt lịch - ${quote.studioName}`} />
          <meta
            name="twitter:description"
            content={`Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}. Nền tảng được cung cấp bởi Lensy.`}
          />
          <meta name="twitter:image" content={studioCoverUrl || studioAvatarUrl || '/lensy-logo.png'} />
        </Helmet>
      ) : (
        <Helmet>
          <title>{`Báo giá chụp ảnh | ${quote.clientName || 'Khách hàng'} - ${quote.studioName}`}</title>
          <meta property="og:title" content={`Báo giá & Đặt lịch - ${quote.studioName}`} />
          <meta
            property="og:description"
            content={`Chi tiết báo giá chụp ảnh và lịch chụp dành cho ${quote.clientName || 'quý khách'}.`}
          />
          <meta property="og:image" content={studioCoverUrl || studioAvatarUrl || '/lensy-logo.png'} />
        </Helmet>
      )}

      {/* Container - Mobile-first width */}
      <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-8 space-y-6 flex-1 pb-24">
        {isBookingPage ? (
          /* Dynamic Studio Banner, Title & Dynamic Greeting */
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/90 backdrop-blur-sm animate-fadeIn">
            {/* Studio Cover Image */}
            <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-slate-950">
              <img
                src={studioCoverUrl}
                alt={quote.studioName}
                className="w-full h-full object-cover brightness-[0.7] transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            </div>

            {/* Studio Logo & Title */}
            <div className="relative px-5 sm:px-7 pb-4 pt-0 -mt-14 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-slate-950 p-1 flex-shrink-0">
                <img
                  src={studioAvatarUrl}
                  alt={quote.studioName}
                  className="w-full h-full object-cover rounded-xl"
                  onError={e => {
                    (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                  }}
                />
              </div>
              <div className="space-y-1 flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lensy Studio Profile</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {quote.studioName}
                </h1>
                {quote.photographerName && (
                  <p className="text-xs text-slate-400">
                    Nhiếp ảnh gia chính: <span className="text-slate-200 font-semibold">{quote.photographerName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Standard Greeting */}
            <div className="px-5 sm:px-7 pb-6 pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 text-slate-200 text-xs sm:text-sm leading-relaxed shadow-inner">
                Chào mừng bạn đến với <strong className="text-amber-400 font-bold">{quote.studioName}</strong>. Vui lòng để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói chụp phù hợp nhất cho bạn.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quote Header */}
            <QuoteHeader quote={quote} />

            {/* Session Primary Info */}
            <QuoteSessionInfo quote={quote} />

            {/* Package Inclusions & Deliverables */}
            <QuoteInclusions
              inclusions={quote.inclusions}
              deliverables={quote.deliverables}
            />

            {/* Equipment Guarantee */}
            <QuoteEquipment equipmentList={quote.equipmentList} />

            {/* Price Breakdown & Deposit Trigger */}
            <QuotePriceSummary
              quote={quote}
              onOpenDepositModal={() => setIsDepositModalOpen(true)}
            />
          </>
        )}

        {/* Client Booking Submission Form (Direct Supabase Insert & VietQR Payment) */}
        <ClientBookingForm
          studioName={quote.studioName}
          defaultSessionType={quote.sessionType}
          defaultPrice={quote.packagePrice}
          defaultDeposit={quote.depositAmount}
          photographerId={photographerId}
          bankInfo={quote.bankInfo}
          studioPhone={quote.photographerPhone}
          isDynamicBookingPage={isBookingPage}
          onBookingCreated={newBooking => {
            if (onBookingSubmit) onBookingSubmit(newBooking);
          }}
        />

        {/* Photographer Contact Card */}
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-5 text-center space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Hỗ Trợ & Tư Vấn Trực Tiếp
          </h4>
          <p className="text-xs text-slate-300">
            Có bất kỳ thắc mắc hoặc cần điều chỉnh timeline, quý khách hãy liên hệ với thợ ảnh chính:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <a
              href={phoneUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{studioPhone}</span>
            </a>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-blue-200"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Nhắn Zalo</span>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center py-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <span>
            Lensy CRM • Phát triển bởi <strong>MIRMIA STUDIO & ACADEMY</strong>
          </span>
          <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" />
        </div>
      </div>

      {/* Sticky Bottom Watermark (Dấu chìm dính đáy) */}
      <footer className="sticky bottom-0 z-30 w-full py-2.5 px-4 bg-slate-950/85 backdrop-blur-md border-t border-slate-800/50 text-center">
        <div className="text-xs sm:text-[11px] text-slate-400 opacity-50 hover:opacity-100 transition-opacity duration-300 inline-flex items-center justify-center gap-1 cursor-default select-none">
          <span>⚡ Powered by Lensy - Developed by Mirmia Studio & Academy</span>
        </div>
      </footer>

      {/* Floating Action Buttons: Chat Zalo & Gọi Điện Nhanh (Góc dưới cùng màn hình) */}
      <div className="fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-40 flex items-center gap-2.5 sm:gap-3 drop-shadow-2xl animate-fadeIn">
        {/* Nút Chat Zalo (#0068FF) */}
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all transform hover:scale-105 active:scale-95 group"
          title={`Chat Zalo với ${quote.photographerName || 'Studio'} (${studioPhone})`}
        >
          <span className="w-5 h-5 rounded-full bg-white text-[#0068FF] font-black text-[11px] flex items-center justify-center tracking-tighter shadow-sm">
            Z
          </span>
          <span className="tracking-wide">Chat Zalo</span>
        </a>

        {/* Nút Gọi Điện (Màu xanh lá) */}
        <a
          href={phoneUrl}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/40 hover:shadow-emerald-600/60 transition-all transform hover:scale-105 active:scale-95 group"
          title={`Gọi hotline Studio: ${studioPhone}`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="tracking-wide">Gọi Điện</span>
        </a>
      </div>

      {/* Deposit QR & Transfer Modal */}
      <DepositModal
        quote={quote}
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onConfirmDeposit={handleConfirmDeposit}
      />
    </div>
  );
};
