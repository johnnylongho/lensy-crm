import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const { token } = useParams<{ token?: string }>();
  const [quote, setQuote] = useState<QuoteData>(initialQuote);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isNotFound, setIsNotFound] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fetch dynamic quote from Supabase by token
  useEffect(() => {
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

          const dynamicQuote: QuoteData = {
            id: data.id,
            quoteToken: data.quote_token,
            studioName: 'MIRMIA STUDIO & ACADEMY',
            studioLogoText: 'MIRMIA',
            photographerName: 'Mirmia Creative Team (Lead Photographer)',
            photographerPhone: '0901234567',
            photographerEmail: 'contact@mirmia.vn',
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
            bankInfo: {
              bankName: 'MB Bank (Ngân Hàng Quân Đội)',
              accountNumber: '0901234567',
              accountName: 'MIRMIA STUDIO',
            },
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
              to="/"
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

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col luxury-gradient">
      {/* Container - Mobile-first width */}
      <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-8 space-y-6 flex-1">
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

        {/* Client Booking Submission Form (Direct Supabase Insert) */}
        <ClientBookingForm
          defaultSessionType={quote.sessionType}
          defaultPrice={quote.packagePrice}
          defaultDeposit={quote.depositAmount}
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
              href={`tel:${quote.photographerPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{quote.photographerPhone}</span>
            </a>
            <a
              href={`https://zalo.me/${quote.photographerPhone.replace(/^0/, '84')}`}
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
