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
import { PackagePricingSection } from './PackagePricingSection';
import { ClientProjectJourney } from './ClientProjectJourney';
import { ClientProofingSection } from './ClientProofingSection';
import { ClientDeliverySection } from './ClientDeliverySection';
import { LegalQuoteDocument } from './LegalQuoteDocument';
import { QuoteData, SessionType, PackageItem, Studio } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Phone,
  MessageCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface Props {
  initialQuote?: QuoteData;
  onQuoteStatusChange?: (newStatus: QuoteData['status']) => void;
  onBookingSubmit?: (newBooking: any) => void;
}

// Hàm bổ trợ tạo danh mục quyền lợi & sản phẩm bàn giao mặc định khi không tìm thấy package trong DB
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
            description: 'Hệ thống Body máy ảnh Full-Frame chuyên nghiệp cùng ống kính tiêu cự vàng chụp tiệc & ngoại cảnh.',
          },
          {
            id: 'inc-3',
            title: 'Hậu Kỳ Màu Fine-Art Độc Quyền',
            description: 'Toàn bộ file ảnh được blend màu tone điện ảnh sang trọng.',
          },
          {
            id: 'inc-4',
            title: 'Bàn Giao Siêu Tốc',
            description: 'Trả 30-50 ảnh Highlight trong 24h để đăng MXH. Trả link toàn bộ trong 7 ngày.',
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
            description: 'Hệ máy ảnh Full-Frame chuyên nghiệp cùng ống kính chân dung xóa phông cao cấp.',
          },
          {
            id: 'inc-3',
            title: 'Hậu Kỳ Màu Độc Quyền',
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

const DEFAULT_FALLBACK_QUOTE: QuoteData = {
  id: 'lensy-studio-booking',
  quoteToken: 'booking',
  studioName: 'Lensy Photography Studio',
  studioLogoText: 'LENSY',
  photographerName: 'Lensy Creative Team',
  photographerPhone: '0901234567',
  photographerEmail: 'contact@lensy.vn',
  clientName: 'Khách Hàng',
  clientPhone: '0988 888 888',
  clientEmail: 'khachhang@example.com',
  sessionType: 'wedding',
  sessionTitle: 'Gói Chụp Ảnh Studio & Ngoại Cảnh',
  eventDate: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '12:00',
  location: 'Tại Studio & Ngoại Cảnh',
  packagePrice: 15000000,
  depositPercentage: 30,
  depositAmount: 4500000,
  remainingAmount: 10500000,
  status: 'cho_coc',
  inclusions: [
    {
      id: 'inc-1',
      title: 'Nhiếp Ảnh Gia Chuyên Nghiệp',
      description: 'Chụp không giới hạn và bắt trọn từng khoảnh khắc cảm xúc chân thực nhất.',
    },
    {
      id: 'inc-2',
      title: 'Hệ Máy Full-Frame & Đèn Chuyên Nghiệp',
      description: 'Thiết bị chuyên nghiệp chụp thiếu sáng và kiểm soát ánh sáng cao cấp.',
    },
  ],
  equipmentList: ['Body Canon EOS R', 'Lens Canon RF 85mm f/2', 'Đèn Godox V860iii'],
  deliverables: [
    'Toàn bộ file gốc chất lượng cao',
    'Ảnh chỉnh sửa màu sắc chi tiết',
    'Link Cloud lưu trữ riêng biệt an toàn',
  ],
  validUntil: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  bankInfo: {
    bankName: 'MB Bank',
    accountNumber: '0901234567',
    accountName: 'LENSY STUDIO',
  },
};

export const QuoteView: React.FC<Props> = ({
  initialQuote = DEFAULT_FALLBACK_QUOTE,
  onQuoteStatusChange,
  onBookingSubmit,
}) => {
  const { currentStudio } = useWorkspace();
  const { token, username, slug, id } = useParams<{
    token?: string;
    username?: string;
    slug?: string;
    id?: string;
  }>();

  // Nhận diện thông minh giữa UUID và Slug Studio
  const studioParam = slug || id;
  const isStudioParamUuid = Boolean(
    studioParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studioParam)
  );

  const [quote, setQuote] = useState<QuoteData>(initialQuote);
  const [fetchedStudio, setFetchedStudio] = useState<Studio | null>(null);
  const [photographerId, setPhotographerId] = useState<string | null>(null);
  const [isPhotographerVerified, setIsPhotographerVerified] = useState<boolean>(true);
  const isBookingPage = Boolean(username) || Boolean(studioParam);
  const [isLoading, setIsLoading] = useState(Boolean(token || username || studioParam));
  const [isNotFound, setIsNotFound] = useState(false);
  const [isStudioNotFound, setIsStudioNotFound] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<'deposit' | 'final'>('deposit');
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [verifiedStudio, setVerifiedStudio] = useState<{ name: string; logoUrl?: string } | null>(null);

  // Fetch dynamic studio profile
  useEffect(() => {
    if (!username && !studioParam) return;

    const fetchStudioProfile = async () => {
      setIsLoading(true);
      setIsStudioNotFound(false);
      setIsNotFound(false);

      try {
        if (isSupabaseConfigured) {
          let userData: any = null;
          let studioData: any = null;

          if (studioParam) {
            const studioQuery = supabase.from('studios').select('*');
            const { data: sData } = await (isStudioParamUuid
              ? studioQuery.eq('id', studioParam).maybeSingle()
              : studioQuery.eq('slug', studioParam).maybeSingle());

            if (sData) {
              studioData = sData;
              const { data: uOwner } = await supabase
                .from('users')
                .select('*')
                .eq('id', sData.owner_id)
                .maybeSingle();
              userData = uOwner;
            } else if (isStudioParamUuid) {
              const { data: uData } = await supabase
                .from('users')
                .select('*')
                .eq('id', studioParam)
                .maybeSingle();
              userData = uData;
            }
          } else if (username) {
            const { data: uData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('username', username)
              .maybeSingle();

            if (userError || !uData) {
              setIsStudioNotFound(true);
              setIsLoading(false);
              return;
            }
            userData = uData;

            // ================================================================
            // TÌM VÀ LIÊN KẾT STUDIO CỦA THỢ ẢNH / TÀI KHOẢN NÀY
            // ================================================================
            try {
              // 1. Kiểm tra studio_id trên bản ghi users
              if (uData.studio_id) {
                const { data: sData } = await supabase
                  .from('studios')
                  .select('*')
                  .eq('id', uData.studio_id)
                  .maybeSingle();
                if (sData) studioData = sData;
              }

              // 2. Nếu chưa tìm thấy, kiểm tra xem user có phải chủ Studio (owner_id) không
              if (!studioData) {
                const { data: sOwnerData } = await supabase
                  .from('studios')
                  .select('*')
                  .eq('owner_id', uData.id)
                  .order('created_at', { ascending: false })
                  .maybeSingle();
                if (sOwnerData) studioData = sOwnerData;
              }

              // 3. Nếu vẫn chưa có, kiểm tra bảng studio_members
              if (!studioData) {
                const { data: memberRecord } = await supabase
                  .from('studio_members')
                  .select('studios(*)')
                  .eq('user_id', uData.id)
                  .eq('status', 'approved')
                  .maybeSingle();
                if (memberRecord && (memberRecord as any).studios) {
                  studioData = (memberRecord as any).studios;
                }
              }
            } catch (studioFetchErr) {
              console.warn('[QuoteView] Lỗi truy xuất studio liên kết:', studioFetchErr);
            }

            // 4. Fallback: Nếu đang xem trước trong cùng workspace session
            if (!studioData && currentStudio) {
              studioData = currentStudio;
            }
          }

          if (!userData && !studioData) {
            setIsStudioNotFound(true);
            setIsLoading(false);
            return;
          }

          if (userData) {
            setPhotographerId(userData.id);
            if (userData.is_verified !== undefined) {
              setIsPhotographerVerified(Boolean(userData.is_verified));
            }
          }

          if (studioData) {
            setFetchedStudio(studioData);
          }

          // ================================================================
          // TRÍCH XUẤT CHÍNH XÁC LOGO STUDIO TỪ HỒ SƠ THƯƠNG HIỆU
          // ================================================================
          let resolvedStudioLogo = studioData?.logo_url || studioData?.logo;

          // Kiểm tra cache metadata từ localStorage nếu DB chưa có
          const targetStudioId = studioData?.id || currentStudio?.id;
          if (!resolvedStudioLogo && targetStudioId) {
            try {
              const metaStr = localStorage.getItem(`lensy_studio_meta_${targetStudioId}`);
              if (metaStr) {
                const meta = JSON.parse(metaStr);
                if (meta.logo_url || meta.logo) resolvedStudioLogo = meta.logo_url || meta.logo;
              }
            } catch (e) {}
          }

          if (!resolvedStudioLogo && currentStudio?.logo_url) {
            resolvedStudioLogo = currentStudio.logo_url;
          }

          if (!resolvedStudioLogo) {
            const globalLogo = localStorage.getItem('lensy_current_studio_logo');
            if (globalLogo) resolvedStudioLogo = globalLogo;
          }

          // CHẶN TUYỆT ĐỐI HIỂN THỊ LOGO HỆ THỐNG /lensy-logo.png LÀM LOGO STUDIO
          if (!resolvedStudioLogo || resolvedStudioLogo === '/lensy-logo.png' || resolvedStudioLogo.includes('lensy-logo')) {
            resolvedStudioLogo = '/mirmia-logo.png';
          }

          const displayStudioName = studioData?.name || currentStudio?.name || userData?.studio_name || 'MIRMIA STUDIO & ACADEMY';
          const displayAvatarUrl = resolvedStudioLogo || '/mirmia-logo.png';

          const studioVerifiedInfo: { name: string; logoUrl?: string } | null = (studioData || currentStudio) ? {
            name: studioData?.name || currentStudio?.name || displayStudioName,
            logoUrl: displayAvatarUrl,
          } : null;

          setVerifiedStudio(studioVerifiedInfo);

          setQuote(prev => ({
            ...prev,
            studio_id: studioData?.id || currentStudio?.id || prev.studio_id,
            studioName: displayStudioName,
            studioAvatarUrl: displayAvatarUrl,
            studioCoverUrl:
              studioData?.cover_url ||
              studioData?.cover_image ||
              userData?.cover_image ||
              userData?.cover_url ||
              currentStudio?.cover_url ||
              (typeof window !== 'undefined'
                ? (localStorage.getItem('lensy_studio_cover_' + (studioData?.id || currentStudio?.id)) ||
                   localStorage.getItem('lensy_current_studio_cover'))
                : null) ||
              'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
            studioAddress: studioData?.address || currentStudio?.address || undefined,
            studioTaxCode: studioData?.tax_code || currentStudio?.tax_code || undefined,
            studioPhone: studioData?.phone || currentStudio?.phone || userData?.phone || undefined,
            studioEmail: studioData?.email || currentStudio?.email || userData?.email || undefined,
            photographerName: userData?.full_name || displayStudioName,
            photographerPhone: userData?.phone || studioData?.phone || currentStudio?.phone || '0901234567',
            photographerEmail: userData?.email || studioData?.email || currentStudio?.email || 'contact@lensy.vn',
            bankInfo: {
              bankName: userData?.bank_name || 'MB Bank',
              accountNumber: userData?.bank_account_number || '0901234567',
              accountName: userData?.bank_account_name || userData?.full_name || displayStudioName,
            },
          }));

          // Fetch packages cho studio/thợ ảnh này
          try {
            let pkgList: PackageItem[] = [];
            let pkgQuery = supabase
              .from('packages')
              .select('*')
              .eq('is_active', true)
              .order('price', { ascending: true });

            if (studioData?.id) {
              pkgQuery = pkgQuery.or(`studio_id.eq.${studioData.id},photographer_id.eq.${userData?.id || studioData.owner_id}`);
            } else if (userData?.id) {
              pkgQuery = pkgQuery.eq('photographer_id', userData.id);
            }

            const { data: pkgData, error: pkgError } = await pkgQuery;
            if (!pkgError && pkgData && pkgData.length > 0) {
              pkgList = pkgData.map((p: any) => ({
                ...p,
                price: Number(p.price || 0),
                features: Array.isArray(p.features) ? p.features : (p.features ? JSON.parse(p.features) : []),
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
                is_active: p.is_active ?? true,
              }));
            }
            setPackages(pkgList);
            if (pkgList.length > 0) {
              setSelectedPackage(pkgList[0]);
              setQuote(prev => ({
                ...prev,
                features: pkgList[0].features,
              }));
            }
          } catch (pkgErr) {
            console.warn('Lỗi khi fetch gói dịch vụ:', pkgErr);
          }
        }
      } catch (err) {
        console.error('Lỗi truy vấn Studio:', err);
        setIsStudioNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudioProfile();
  }, [username, studioParam, isStudioParamUuid]);

  // Fetch dynamic quote from Supabase by token
  useEffect(() => {
    if (username || studioParam) return;

    if (!token) {
      if (currentStudio) {
        setQuote(prev => ({
          ...initialQuote,
          studio_id: currentStudio.id,
          studioName: currentStudio.name || initialQuote.studioName,
          studioAvatarUrl: currentStudio.logo_url || initialQuote.studioAvatarUrl,
          studioAddress: currentStudio.address || initialQuote.studioAddress,
          studioTaxCode: currentStudio.tax_code || initialQuote.studioTaxCode,
          studioPhone: currentStudio.phone || initialQuote.photographerPhone,
          studioEmail: currentStudio.email || initialQuote.photographerEmail,
          bankInfo: {
            ...initialQuote.bankInfo,
            accountName: currentStudio.name || initialQuote.bankInfo.accountName,
          },
        }));
      } else {
        setQuote(initialQuote);
      }
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

          // 1. TRUY XUẤT THÔNG TIN STUDIO ĐANG SỞ HỮU BOOKING NÀY (DYNAMIC STUDIO PROFILE)
          let matchedStudio: Studio | null = null;
          if (data.studio_id) {
            try {
              const { data: sData } = await supabase
                .from('studios')
                .select('*')
                .eq('id', data.studio_id)
                .maybeSingle();
              if (sData) matchedStudio = sData as Studio;
            } catch (sErr) {
              console.warn('Lỗi khi fetch studio theo studio_id:', sErr);
            }
          }

          if (!matchedStudio && data.photographer_id) {
            try {
              const { data: sData } = await supabase
                .from('studios')
                .select('*')
                .eq('owner_id', data.photographer_id)
                .maybeSingle();
              if (sData) matchedStudio = sData as Studio;
            } catch (sErr) {
              console.warn('Lỗi khi fetch studio theo photographer_id:', sErr);
            }
          }

          if (matchedStudio) {
            setFetchedStudio(matchedStudio);
          }

          const pkgPrice = Number(data.package_price || 0);
          const depAmount = Number(data.deposit_amount || Math.round(pkgPrice * 0.3));
          const paidAmt = Number(data.paid_amount || 0);
          const remAmt = Number(
            data.remaining_amount !== undefined &&
            data.remaining_amount !== null &&
            Number(data.remaining_amount) > 0 &&
            Number(data.remaining_amount) < pkgPrice
              ? data.remaining_amount
              : Math.max(0, pkgPrice - (paidAmt > 0 ? paidAmt : depAmount))
          );

          const sessionType: SessionType = data.session_type || 'wedding';
          const { inclusions, deliverables } = getDefaultInclusionsAndDeliverables(sessionType);

          // 2. ĐỒNG BỘ DỮ LIỆU GÓI DỊCH VỤ (DYNAMIC DATA MAPPING TỪ BẢNG PACKAGES)
          let dynamicFeatures: string[] = [];
          try {
            let matchedPkg: any = null;

            // Truy xuất từ bảng packages theo package_id nếu có
            if (data.package_id) {
              const { data: pData } = await supabase
                .from('packages')
                .select('*')
                .eq('id', data.package_id)
                .maybeSingle();
              if (pData) matchedPkg = pData;
            }

            // Nếu chưa tìm thấy, truy xuất theo package_type hoặc session_title
            if (!matchedPkg && (data.package_type || data.session_title)) {
              const searchName = data.package_type || data.session_title;
              let pQuery = supabase.from('packages').select('*');
              if (data.photographer_id) {
                pQuery = pQuery.or(`photographer_id.eq.${data.photographer_id},studio_id.eq.${data.studio_id || ''}`);
              }
              const { data: pList } = await pQuery;
              if (pList && pList.length > 0) {
                matchedPkg = pList.find((p: any) =>
                  p.name?.toLowerCase().includes(searchName.toLowerCase()) ||
                  searchName.toLowerCase().includes(p.name?.toLowerCase())
                ) || pList[0];
              }
            }

            // Kiểm tra localStorage cache nếu offline hoặc local state
            if (!matchedPkg) {
              try {
                const localPkgs = JSON.parse(localStorage.getItem('lensy_packages_local') || '[]');
                matchedPkg = localPkgs.find((p: any) =>
                  p.id === data.package_id ||
                  (data.package_type && p.name?.toLowerCase().includes(data.package_type.toLowerCase())) ||
                  (data.session_title && p.name?.toLowerCase().includes(data.session_title.toLowerCase()))
                );
              } catch (localErr) {
                // ignore
              }
            }

            if (matchedPkg) {
              if (Array.isArray(matchedPkg.features)) {
                dynamicFeatures = matchedPkg.features;
              } else if (typeof matchedPkg.features === 'string') {
                try {
                  dynamicFeatures = JSON.parse(matchedPkg.features);
                } catch {
                  dynamicFeatures = [matchedPkg.features];
                }
              }
            }
          } catch (pkgErr) {
            console.warn('Lỗi khi fetch gói dịch vụ cho báo giá:', pkgErr);
          }

          // Trích xuất thiết bị thực tế từ assigned_gears hoặc notes
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          let equipmentList: string[] = [];

          if (data.assigned_gears && Array.isArray(data.assigned_gears) && data.assigned_gears.length > 0) {
            const rawGears: string[] = data.assigned_gears
              .map((g: any) => (typeof g === 'string' ? g : g.name || g.id || ''))
              .filter(Boolean);

            const uuidIds = rawGears.filter(id => UUID_REGEX.test(id));
            const plainNames = rawGears.filter(id => !UUID_REGEX.test(id));

            if (uuidIds.length > 0 && isSupabaseConfigured) {
              try {
                const { data: gearsData } = await supabase
                  .from('gears')
                  .select('id, name')
                  .in('id', uuidIds);

                const gearMap: Record<string, string> = {};
                (gearsData || []).forEach((r: any) => {
                  gearMap[r.id] = r.name;
                });

                const resolvedNames = uuidIds
                  .map(id => gearMap[id])
                  .filter((name): name is string => Boolean(name && !UUID_REGEX.test(name)));

                equipmentList = [...plainNames, ...resolvedNames];
              } catch (gearErr) {
                console.warn('Lỗi khi fetch tên thiết bị từ bảng gears:', gearErr);
                equipmentList = plainNames;
              }
            } else {
              equipmentList = plainNames;
            }
          }

          if (equipmentList.length === 0 && data.notes && data.notes.includes('[Gears:')) {
            const match = data.notes.match(/\[Gears:\s*([^\]]+)\]/);
            if (match && match[1]) {
              equipmentList = match[1]
                .split(';')
                .map((s: string) => s.trim())
                .filter((name: string) => !UUID_REGEX.test(name));
            }
          }

          if (equipmentList.length === 0) {
            equipmentList = [
              'Body Canon EOS R (Full-Frame)',
              'Lens Canon RF 85mm f/2 Macro IS STM',
              'Đèn Studio Godox V860iii & Softbox Tản Sáng',
            ];
          }

          let studioName = matchedStudio?.name || 'Lensy Photography Studio';
          let photogName = matchedStudio?.name || 'Lead Photographer';
          let photogPhone = matchedStudio?.phone || '0901234567';
          let photogEmail = matchedStudio?.email || 'contact@lensy.vn';
          let bankInfo = {
            bankName: 'MB Bank (Ngân Hàng Quân Đội)',
            accountNumber: '0901234567',
            accountName: studioName,
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
                if (!matchedStudio?.phone && userData.phone) photogPhone = userData.phone;
                if (!matchedStudio?.name && userData.studio_name) studioName = userData.studio_name;
                if (userData.full_name) photogName = userData.full_name;
                if (!matchedStudio?.email && userData.email) photogEmail = userData.email;
                if (userData.bank_name) bankInfo.bankName = userData.bank_name;
                if (userData.bank_account_number) bankInfo.accountNumber = userData.bank_account_number;
                if (userData.bank_account_name) bankInfo.accountName = userData.bank_account_name;
                if (userData.is_verified !== undefined) {
                  setIsPhotographerVerified(Boolean(userData.is_verified));
                }
              }
            } catch (userErr) {
              console.warn('Không thể tải thông tin thợ ảnh:', userErr);
            }
          }

          const dynamicQuote: QuoteData = {
            id: data.id,
            quoteToken: data.quote_token,
            studio_id: data.studio_id || matchedStudio?.id,
            studioName: matchedStudio?.name || studioName,
            studioLogoText: matchedStudio?.name?.slice(0, 6)?.toUpperCase() || 'STUDIO',
            studioAvatarUrl: matchedStudio?.logo_url || undefined,
            studioAddress: matchedStudio?.address || undefined,
            studioTaxCode: matchedStudio?.tax_code || undefined,
            studioPhone: matchedStudio?.phone || photogPhone,
            studioEmail: matchedStudio?.email || photogEmail,
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
            features: dynamicFeatures.length > 0 ? dynamicFeatures : undefined,
            inclusions: inclusions,
            equipmentList: equipmentList,
            deliverables: deliverables,
            specialNotes: data.notes?.replace(/\[Gears:[^\]]+\]\s*/, '') || undefined,
            validUntil: '2026-11-15',
            bankInfo: bankInfo,
            drive_delivery_link: data.drive_delivery_link || undefined,
            delivery_date: data.delivery_date || undefined,
            delivery_notes: data.delivery_notes || undefined,
            proofing_session: data.proofing_session || undefined,
          };

          setQuote(dynamicQuote);
        } else {
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
  }, [token, initialQuote, currentStudio]);

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

  // Màn hình Skeleton Loading (Light Mode)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Đang tải Thư Báo Giá...</h3>
            <p className="text-xs text-slate-500">
              Đang xác thực mã bảo mật và tải thông tin lịch chụp từ {quote.studioName || 'Studio'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình 404 Không tìm thấy Studio (/book/:username)
  if (isStudioNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-5 p-6 sm:p-8 rounded-2xl bg-white border border-rose-200 shadow-sm animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">Không Tìm Thấy Studio Này</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tên định danh Studio / Nhiếp ảnh gia{' '}
              <strong className="text-orange-600">@{username}</strong> không tồn tại trong hệ thống. Quý khách vui lòng kiểm tra lại đường dẫn từ thợ ảnh.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book/johnnylongho"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
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
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-5 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Không Tìm Thấy Thư Báo Giá</h3>
            <p className="text-xs text-slate-600">
              Mã liên kết <strong>{token}</strong> không tồn tại hoặc đã hết hiệu lực. Quý khách vui lòng kiểm tra lại đường link hoặc liên hệ trực tiếp với studio.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/quote"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem Thư Báo Giá Mẫu</span>
            </Link>
            <a
              href="tel:0901234567"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline Studio: 0901234567</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const studioCoverUrl =
    quote.studioCoverUrl ||
    (typeof window !== 'undefined' ? (localStorage.getItem('lensy_studio_cover_' + quote.studio_id) || localStorage.getItem('lensy_current_studio_cover')) : null) ||
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80';
  const studioAvatarUrl =
    (quote.studioAvatarUrl && !quote.studioAvatarUrl.includes('lensy-logo.png') && quote.studioAvatarUrl !== '/lensy-logo.png')
      ? quote.studioAvatarUrl
      : (currentStudio?.logo_url || (typeof window !== 'undefined' ? localStorage.getItem('lensy_current_studio_logo') : null) || '/mirmia-logo.png');
  const studioPhone = quote.photographerPhone || '0901234567';
  const cleanStudioPhone = studioPhone.replace(/[^0-9]/g, '');
  const zaloUrl = `https://zalo.me/${cleanStudioPhone}`;
  const phoneUrl = `tel:${cleanStudioPhone}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500/20 flex flex-col relative print:bg-white">
      {/* Print CSS Rules - Ép buộc toàn bộ nội dung nằm trọn trong 1 trang A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm 6mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          .no-print, .print\\:hidden, footer, .fixed {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Dynamic SEO & Open Graph Meta Tags cho Zalo, Facebook, Telegram Preview */}
      {isBookingPage ? (
        <Helmet>
          <title>{`Đặt lịch chụp ảnh | ${quote.studioName}`}</title>
          <meta property="og:title" content={`Báo giá & Đặt lịch - ${quote.studioName}`} />
          <meta
            property="og:description"
            content={`Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}.`}
          />
          <meta property="og:image" content={studioCoverUrl || studioAvatarUrl || '/lensy-logo.png'} />
          <meta
            name="description"
            content={`Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}.`}
          />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`Báo giá & Đặt lịch - ${quote.studioName}`} />
          <meta
            name="twitter:description"
            content={`Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}.`}
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

      {/* Container - Kích thước A4 chuẩn mực (max-w-[210mm] min-h-[297mm]), padding tối ưu khi in */}
      <div className={`w-full mx-auto p-0 sm:p-2 print:p-0 print:m-0 flex-1 pb-16 print:pb-0 overflow-x-hidden ${
        isBookingPage
          ? 'space-y-6 bg-transparent max-w-full'
          : 'max-w-[210mm] min-h-[297mm] bg-white space-y-2.5 print:space-y-1.5 shadow-xl print:shadow-none'
      }`}>
        {isBookingPage ? (
          <>
          {/* Dynamic Studio Banner, Title & Dynamic Greeting */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white animate-fadeIn">
            {/* Studio Cover Image */}
            <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-slate-100">
              <img
                src={studioCoverUrl}
                alt={quote.studioName}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
            </div>

            {/* Studio Logo: Hiển thị hình vuông bo góc sang trọng, viền trắng nổi bật */}
            <div className="relative px-5 sm:px-7 pb-4 pt-0 -mt-14 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white p-1.5 flex-shrink-0 flex items-center justify-center">
                <img
                  src={studioAvatarUrl}
                  alt={quote.studioName}
                  className="w-full h-full object-contain rounded-xl"
                  onError={e => {
                    (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                  }}
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>Studio Profile</span>
                  </div>

                  {verifiedStudio && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold tracking-wide shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verified by {verifiedStudio.name}</span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {quote.studioName}
                </h1>
                {quote.photographerName && (
                  <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <span>Nhiếp ảnh gia chính:</span>
                    <span className="text-slate-900 font-semibold">{quote.photographerName}</span>
                    {isPhotographerVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Standard Greeting */}
            <div className="px-5 sm:px-7 pb-6 pt-2">
              <div className="p-4 sm:p-5 rounded-xl bg-orange-50 border border-orange-100 text-slate-700 text-xs sm:text-sm leading-relaxed">
                Chào mừng bạn đến với <strong className="text-orange-600 font-bold">{quote.studioName}</strong>. Vui lòng để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói chụp phù hợp nhất cho bạn.
              </div>
            </div>
          </div>

          {/* Bảng Giá Dịch Vụ & Mini Portfolio Lightbox */}
          <PackagePricingSection
            packages={packages}
            selectedPackageId={selectedPackage?.id || null}
            onSelectPackage={pkg => {
              setSelectedPackage(pkg);
              setQuote(prev => ({
                ...prev,
                features: pkg.features,
                packagePrice: pkg.price,
                depositAmount: Math.round(pkg.price * 0.3),
                remainingAmount: pkg.price - Math.round(pkg.price * 0.3),
                sessionTitle: pkg.name,
              }));
              const formEl = document.getElementById('client-booking-form-wrapper');
              if (formEl) {
                formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }}
            studioName={quote.studioName}
          />
          </>
        ) : (
          <>
            <LegalQuoteDocument
              quote={quote}
              studio={fetchedStudio || currentStudio}
              onQuoteStatusChange={onQuoteStatusChange}
              onBookingSubmit={onBookingSubmit}
            />

            {/* Client Proofing & Photo Selection Portal (Ẩn khi in ấn báo giá) */}
            {quote.proofing_session && (
              <div className="no-print print:hidden space-y-3 pt-4">
                <ClientProofingSection
                  quote={quote}
                  onProofingUpdated={(updatedSession) => {
                    setQuote(prev => ({
                      ...prev,
                      proofing_session: updatedSession,
                      status: updatedSession.is_locked ? 'editing' : prev.status,
                    }));
                  }}
                />
                <ClientDeliverySection
                  quote={quote}
                  onOpenPaymentModal={() => {
                    setPaymentModalType('final');
                    setIsDepositModalOpen(true);
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Client Booking Submission Form */}
        {isBookingPage && (
          <div id="client-booking-form-wrapper" className="no-print print:hidden scroll-mt-8">
            <ClientBookingForm
              studioName={quote.studioName}
              studioId={quote.studio_id || (id ? id : null)}
              defaultSessionType={quote.sessionType}
              defaultPrice={selectedPackage ? selectedPackage.price : quote.packagePrice}
              defaultDeposit={selectedPackage ? Math.round(selectedPackage.price * 0.3) : quote.depositAmount}
              photographerId={photographerId}
              bankInfo={quote.bankInfo}
              studioPhone={quote.photographerPhone}
              isDynamicBookingPage={isBookingPage}
              packages={packages}
              selectedPackage={selectedPackage}
              onSelectPackage={pkg => {
                setSelectedPackage(pkg);
                setQuote(prev => ({
                  ...prev,
                  features: pkg.features,
                }));
              }}
              onBookingCreated={newBooking => {
                if (onBookingSubmit) onBookingSubmit(newBooking);
              }}
            />
          </div>
        )}

        {/* Photographer Contact Card - CHỈ HIỂN THỊ Ở TRANG BOOKING */}
        {isBookingPage && (
        <div className="no-print print:hidden bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-center space-y-2.5 shadow-sm">
          <h4 className="text-orange-600 font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1.5">
            <span>Hỗ Trợ & Tư Vấn</span>
            {isPhotographerVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
          </h4>
          <p className="text-xs text-slate-500">
            Mọi thắc mắc hoặc yêu cầu riêng, quý khách vui lòng liên hệ:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 text-xs">
            <a
              href={phoneUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-600 font-semibold transition-all duration-200 shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>{studioPhone}</span>
            </a>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0068FF]/10 hover:bg-[#0068FF]/20 border border-[#0068FF]/20 text-[#0068FF] font-semibold transition-all duration-200 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Nhắn Zalo</span>
            </a>
          </div>
        </div>
        )}
      </div>

      {/* Sticky Bottom Bar & Floating Buttons - CHỈ HIỂN THỊ Ở TRANG BOOKING */}
      {isBookingPage && (
        <>
          <footer className="no-print print:hidden sticky bottom-0 z-30 w-full py-2.5 px-4 bg-white/95 backdrop-blur-md border-t border-slate-200 text-center">
            <div className="text-xs sm:text-[11px] text-slate-500 font-medium inline-flex flex-wrap items-center justify-center gap-2 cursor-default select-none">
              <span>{quote.studioName} • Báo Giá & Hợp Đồng Dịch Vụ</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <img src="/lensy-logo.png" alt="Lensy CRM" className="w-4 h-4 object-contain rounded" />
                <span>Powered by Lensy</span>
              </span>
            </div>
          </footer>

          {/* Floating Action Buttons: Chat Zalo & Gọi Điện Nhanh - ẨN KHI IN */}
          <div className="no-print print:hidden fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-40 flex items-center gap-2.5 sm:gap-3 drop-shadow-lg animate-fadeIn">
            {/* Nút Chat Zalo */}
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all duration-200 transform hover:scale-105 active:scale-95 group"
              title={`Chat Zalo với ${quote.photographerName || 'Studio'} (${studioPhone})`}
            >
              <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0068FF] font-black text-[10px] flex items-center justify-center tracking-tighter shadow-sm">
                Z
              </span>
              <span className="tracking-wide">Chat Zalo</span>
            </a>

            {/* Nút Gọi Điện */}
            <a
              href={phoneUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs sm:text-sm font-semibold shadow-md shadow-orange-600/30 transition-all duration-200 transform hover:scale-105 active:scale-95 group"
              title={`Gọi hotline Studio: ${studioPhone}`}
            >
              <Phone className="w-3.5 h-3.5 text-white" />
              <span className="tracking-wide">Gọi Điện</span>
            </a>
          </div>
        </>
      )}

      {/* Deposit QR & Transfer Modal */}
      <DepositModal
        quote={quote}
        isOpen={isDepositModalOpen}
        paymentType={paymentModalType}
        onClose={() => setIsDepositModalOpen(false)}
        onConfirmDeposit={handleConfirmDeposit}
      />
    </div>
  );
};
