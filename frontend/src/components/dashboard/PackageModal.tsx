import React, { useState, useEffect, useRef } from 'react';
import { PackageItem, PackageCategory } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatCurrencyVND, parseCurrencyVND } from '../../utils/currency';
import {
  Package,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Check,
  Tag,
  Camera,
  Compass,
  PartyPopper,
  Palette,
  Shirt,
  Info,
} from 'lucide-react';

export interface CategoryMeta {
  value: PackageCategory;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  activeBg: string;
  activeBorder: string;
  accentColor: string;
}

export const PACKAGE_CATEGORIES: CategoryMeta[] = [
  {
    value: 'studio',
    label: 'Chụp Studio',
    shortLabel: 'Studio',
    description: 'Chụp concept, chân dung, profile, lookbook trong studio',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    activeBg: 'bg-blue-500/15',
    activeBorder: 'border-blue-500 text-blue-400 ring-2 ring-blue-500/30',
    accentColor: '#3b82f6',
  },
  {
    value: 'outdoor',
    label: 'Chụp Ngoại Cảnh',
    shortLabel: 'Ngoại cảnh',
    description: 'Pre-wedding, phong cảnh tự nhiên, dã ngoại, đường phố',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30',
    accentColor: '#10b981',
  },
  {
    value: 'wedding',
    label: 'Ngày Cưới (Wedding)',
    shortLabel: 'Ngày Cưới',
    description: 'Lễ cưới, tiệc cưới, phóng sự cưới ngày trọng đại',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    activeBg: 'bg-rose-500/15',
    activeBorder: 'border-rose-500 text-rose-400 ring-2 ring-rose-500/30',
    accentColor: '#f43f5e',
  },
  {
    value: 'event',
    label: 'Sự Kiện & Phóng Sự',
    shortLabel: 'Sự kiện / Tiệc cưới',
    description: 'Tiệc cưới, phóng sự cưới, hội nghị, gala, sinh nhật, thôi nôi',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    activeBg: 'bg-purple-500/15',
    activeBorder: 'border-purple-500 text-purple-400 ring-2 ring-purple-500/30',
    accentColor: '#a855f7',
  },
  {
    value: 'makeup',
    label: 'Trang Điểm & Styling',
    shortLabel: 'Makeup',
    description: 'Makeup cô dâu, tiệc, lookbook, làm tóc & đổi layout',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30',
    activeBg: 'bg-pink-500/15',
    activeBorder: 'border-pink-500 text-pink-400 ring-2 ring-pink-500/30',
    accentColor: '#ec4899',
  },
  {
    value: 'rental',
    label: 'Cho Thuê Đồ & Thiết Bị',
    shortLabel: 'Cho thuê',
    description: 'Váy cưới, vest, phụ kiện, máy ảnh, ống kính, đèn flash',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    activeBg: 'bg-amber-500/15',
    activeBorder: 'border-amber-500 text-amber-400 ring-2 ring-amber-500/30',
    accentColor: '#f59e0b',
  },
];

export const getCategoryMeta = (category?: string): CategoryMeta => {
  const found = PACKAGE_CATEGORIES.find(c => c.value === category);
  return (
    found || {
      value: 'studio',
      label: 'Chụp Studio',
      shortLabel: 'Studio',
      description: 'Gói chụp dịch vụ',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      activeBg: 'bg-blue-500/15',
      activeBorder: 'border-blue-500 text-blue-400 ring-2 ring-blue-500/30',
      accentColor: '#3b82f6',
    }
  );
};

// Gợi ý gói chụp mẫu nhanh
export const QUICK_PRESETS = [
  {
    name: 'Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)',
    category: 'event' as PackageCategory,
    price: 18000000,
    description: 'Trọn gói chụp ngày cưới với 2 thợ chính, bắt trọn từng khoảnh khắc cảm xúc thăng hoa và đẳng cấp nghệ thuật.',
    features: [
      '2 Thợ chụp chính máy Full-Frame cao cấp + Lens chuyên dụng',
      'Chụp không giới hạn số lượng file trong buổi lễ & tiệc',
      'Chỉnh sửa màu toàn bộ ảnh gốc (blend màu chuẩn Studio)',
      'Retouch chi tiết 80 ảnh chân dung cô dâu chú rể & gia đình',
      'Tặng 01 photobook mở phẳng 30x30cm (40 trang) bìa da cao cấp',
      'Tặng 02 ảnh cổng ép gỗ pha lê 60x90cm',
      'Bàn giao toàn bộ file qua Google Drive dung lượng vĩnh viễn',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Chụp Pre-Wedding Ngoại Cảnh & Phim Trường',
    category: 'outdoor' as PackageCategory,
    price: 14500000,
    description: 'Buổi chụp lãng mạn ngoại cảnh hoặc phim trường chuyên nghiệp, hỗ trợ stylist và hướng dẫn tạo dáng tự nhiên.',
    features: [
      '01 Thợ chụp chính + 01 Thợ phụ đánh sáng chuyên nghiệp',
      'Miễn phí 02 trang phục cưới cao cấp & 01 vest chú rể',
      'Trang điểm & làm tóc thay đổi 03 layout theo concept',
      'Retouch chuyên sâu 50 ảnh đẹp nhất',
      'Tặng 01 album phóng sự mở phẳng 25x35cm',
      'Tặng 01 ảnh cổng pha lê cao cấp 60x90cm',
      'Xe đưa đón ekip và vé vào phim trường',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Lookbook Thời Trang & Portrait Doanh Nhân',
    category: 'studio' as PackageCategory,
    price: 8500000,
    description: 'Chuyên nghiệp cho các thương hiệu thời trang, lookbook bộ sưu tập hoặc bộ ảnh xây dựng thương hiệu cá nhân doanh nhân.',
    features: [
      'Chụp tại studio với hệ thống đèn Profoto / Godox chuyên dụng',
      'Chụp tối đa 4 concept hoặc 15 bộ trang phục',
      'Retouch chi tiết chuẩn tạp chí cho 25 ảnh xuất sắc nhất',
      'Bàn giao file nén tối ưu hiển thị web & social media',
      'Hỗ trợ chỉnh sửa nhanh lấy gấp trong 48h',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Makeup Cô Dâu & Hair Styling Ngày Cưới',
    category: 'makeup' as PackageCategory,
    price: 3500000,
    description: 'Gói Trang điểm & Làm tóc chuyên nghiệp tận nơi ngày cưới, mỹ phẩm cao cấp chính hãng và hỗ trợ đổi layout.',
    features: [
      'Trang điểm cô dâu tone sang trọng hoặc trong trẻo theo phong cách cá nhân',
      'Làm tóc chuyên nghiệp phù hợp với dáng mặt và váy cưới',
      'Sử dụng 100% mỹ phẩm High-End (Dior, Chanel, NARS, MAC)',
      'Hỗ trợ dặm phấn & thay đổi layout trước giờ khai tiệc',
      'Tặng kèm hoa cài tóc hoặc vương miện đính đá cao cấp',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Chụp Ảnh Gia Đình & Thôi Nôi / Baby',
    category: 'studio' as PackageCategory,
    price: 4500000,
    description: 'Ghi lại những khoảnh khắc ấm cúng, tự nhiên nhất của gia đình tại studio hoặc không gian thoáng đãng.',
    features: [
      'Thời gian chụp: 2 - 3 tiếng thoải mái cho bé nghỉ ngơi',
      'Chụp không giới hạn số lượng ảnh',
      'Retouch 30 ảnh đẹp nhất của gia đình và bé',
      'Tặng 01 ảnh ép gỗ để bàn 20x30cm',
      'Bàn giao toàn bộ file gốc độ phân giải cao',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&w=1200&q=80',
  },
];

const FEATURE_SUGGESTIONS = [
  '2 Thợ chụp chính Full-frame',
  '1 Thợ chính + 1 Thợ phụ đánh sáng',
  'Chụp không giới hạn file gốc',
  'Chỉnh sửa màu toàn bộ file',
  'Retouch 50 ảnh chân dung',
  'Tặng Photobook 30x30cm bìa da',
  'Tặng 02 ảnh cổng ép pha lê 60x90cm',
  'Bàn giao ảnh qua Google Drive',
  'Trả 30 ảnh highlight trong 24h',
  'Trang điểm & làm tóc chuyên nghiệp',
  'Hỗ trợ trang phục & phụ kiện concept',
];

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPackage: PackageItem | null;
  onSave: (payload: {
    name: string;
    price: number;
    category: PackageCategory;
    description: string | null;
    features: string[];
    image_urls: string[];
    is_active: boolean;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  editingPackage,
  onSave,
  isSubmitting = false,
}) => {
  // Form fields
  const [packageName, setPackageName] = useState('');
  const [packagePrice, setPackagePrice] = useState<number | string>('');
  const [packageCategory, setPackageCategory] = useState<PackageCategory>('studio');
  const [packageDesc, setPackageDesc] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local toast error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingPackage) {
      setPackageName(editingPackage.name || '');
      setPackagePrice(editingPackage.price || '');
      setPackageCategory(
        (editingPackage.category as PackageCategory) || 'studio'
      );
      setPackageDesc(editingPackage.description || '');
      setFeatures([...(editingPackage.features || [])]);
      setImageUrls([...(editingPackage.image_urls || [])]);
      setIsActive(editingPackage.is_active ?? true);
    } else {
      setPackageName('');
      setPackagePrice('');
      setPackageCategory('studio');
      setPackageDesc('');
      setFeatures([
        'Chụp không giới hạn số lượng file',
        'Chỉnh sửa màu sắc toàn bộ ảnh gốc',
        'Retouch 40 ảnh đẹp nhất',
        'Bàn giao toàn bộ file qua Google Drive',
      ]);
      setImageUrls([
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      ]);
      setIsActive(true);
    }
    setNewFeatureText('');
    setNewImageUrl('');
    setErrorMessage(null);
  }, [editingPackage, isOpen]);

  if (!isOpen) return null;

  // Áp dụng Preset
  const handleApplyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setPackageName(preset.name);
    setPackagePrice(preset.price);
    setPackageCategory(preset.category);
    setPackageDesc(preset.description);
    setFeatures([...preset.features]);
    if (preset.imageUrl && !imageUrls.includes(preset.imageUrl)) {
      setImageUrls(prev => [preset.imageUrl, ...prev]);
    }
  };

  // Thêm quyền lợi
  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    if (features.includes(trimmed)) {
      setErrorMessage('Quyền lợi này đã tồn tại trong danh sách!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setFeatures(prev => [...prev, trimmed]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (indexToRemove: number) => {
    setFeatures(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Thêm ảnh từ URL
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setErrorMessage('Vui lòng nhập đường link ảnh hợp lệ (bắt đầu bằng https://)!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (imageUrls.includes(trimmed)) {
      setErrorMessage('Đường dẫn ảnh này đã có trong danh sách!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setImageUrls(prev => [...prev, trimmed]);
    setNewImageUrl('');
  };

  // Tải ảnh trực tiếp lên Supabase
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chỉ chọn tệp hình ảnh (.jpg, .png, .webp)!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsUploading(true);
    try {
      if (isSupabaseConfigured) {
        const fileExt = file.name.split('.').pop();
        const fileName = `package_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `packages/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('package-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('package-images')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          setImageUrls(prev => [publicUrlData.publicUrl, ...prev]);
        }
      } else {
        const dummyUrl = URL.createObjectURL(file);
        setImageUrls(prev => [dummyUrl, ...prev]);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh lên:', err);
      setErrorMessage('Lỗi khi tải ảnh lên Storage: ' + (err.message || 'Thử lại'));
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = packageName.trim();
    if (!trimmedName) {
      setErrorMessage('Vui lòng nhập tên gói dịch vụ!');
      return;
    }

    const priceNum = Number(packagePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Vui lòng nhập giá tiền hợp lệ!');
      return;
    }

    if (!packageCategory) {
      setErrorMessage('Vui lòng chọn Phân Loại Dịch Vụ cho gói!');
      return;
    }

    await onSave({
      name: trimmedName,
      price: priceNum,
      category: packageCategory,
      description: packageDesc.trim() || null,
      features: features,
      image_urls: imageUrls,
      is_active: isActive,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-hidden p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-3xl rounded-3xl bg-[#080c14] border border-white/15 shadow-2xl p-5 sm:p-7 space-y-6 text-left max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {editingPackage ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới'}
              </h2>
              <p className="text-xs text-slate-400">
                Cấu hình phân loại, bảng giá, quyền lợi và hình ảnh mẫu cho gói dịch vụ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert nếu có */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Presets Bar (Khi thêm mới) */}
        {!editingPackage && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                Mẫu gợi ý nhanh cho Studio:
              </span>
              <span className="text-[10px] text-slate-400">Click để tự động điền</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset, idx) => {
                const meta = getCategoryMeta(preset.category);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-[11px] font-medium text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.accentColor }} />
                    <span>{preset.name.split('(')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Form chính */}
        <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
          {/* ================================================================ */}
          {/* PHÂN LOẠI DỊCH VỤ (CATEGORY) - BẮT BUỘC                          */}
          {/* ================================================================ */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Loại Dịch Vụ (Category) *</span>
              </label>
              <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                <Info className="w-3 h-3" />
                Dùng để lọc trên trang Đặt Lịch & Quản Trị
              </span>
            </div>

            {/* Grid 5 thẻ Category */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {PACKAGE_CATEGORIES.map(cat => {
                const isSelected = packageCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setPackageCategory(cat.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between relative cursor-pointer ${
                      isSelected
                        ? `${cat.activeBorder} ${cat.activeBg} shadow-md`
                        : 'border-white/10 bg-slate-900/60 hover:border-white/20 hover:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-slate-200">
                        {cat.label}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Select dropdown fallback cho accessibility */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Hoặc chọn nhanh từ danh sách:</span>
              <select
                required
                value={packageCategory}
                onChange={e => setPackageCategory(e.target.value as PackageCategory)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/15 text-white text-[11px] focus:outline-none focus:border-amber-500 font-medium"
              >
                {PACKAGE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label} ({c.shortLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tên Gói & Giá Tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-200 flex items-center justify-between">
                <span>Tên Gói Dịch Vụ *</span>
                <span className="text-[10px] text-slate-500 font-normal">Hiển thị nổi bật</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Phóng Sự Cưới Cao Cấp hoặc Makeup Cô Dâu Luxury"
                value={packageName}
                onChange={e => setPackageName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-200 flex items-center justify-between">
                <span>Giá Tiền (VNĐ) *</span>
                {packagePrice !== '' && Number(packagePrice) > 0 && (
                  <span className="text-[10px] text-amber-400 font-sans font-bold">
                    {formatVND(Number(packagePrice))}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="VD: 18.000.000"
                  value={packagePrice ? formatCurrencyVND(packagePrice) : ''}
                  onChange={e => setPackagePrice(parseCurrencyVND(e.target.value).toString())}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-sans font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  ₫
                </span>
              </div>
            </div>
          </div>

          {/* Mô tả ngắn */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200">Mô Tả Ngắn Gói Dịch Vụ</label>
            <textarea
              rows={2}
              placeholder="Mô tả tóm tắt giá trị cảm xúc, phong cách chụp hoặc dịch vụ trang điểm phù hợp..."
              value={packageDesc}
              onChange={e => setPackageDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
            />
          </div>

          {/* DANH SÁCH QUYỀN LỢI (FEATURES) */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Danh Sách Quyền Lợi & Sản Phẩm Đi Kèm ({features.length})</span>
              </label>
              <span className="text-[10px] text-slate-400">Hiển thị dạng checklist</span>
            </div>

            {/* Ô thêm quyền lợi */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Retouch 40 ảnh đẹp nhất, Makeup 2 layout..."
                value={newFeatureText}
                onChange={e => setNewFeatureText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all shrink-0"
              >
                <span>Thêm</span>
              </button>
            </div>

            {/* Gợi ý quyền lợi nhanh */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 self-center">Gợi ý nhanh:</span>
              {FEATURE_SUGGESTIONS.slice(0, 5).map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!features.includes(sug)) {
                      setFeatures(prev => [...prev, sug]);
                    }
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] transition-all"
                >
                  + {sug}
                </button>
              ))}
            </div>

            {/* Danh sách các item quyền lợi đã thêm */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 pt-1">
              {features.length === 0 ? (
                <p className="text-slate-500 italic text-[11px] py-1 text-center">Chưa có quyền lợi nào. Hãy thêm ít nhất 2 - 3 quyền lợi để tăng tính thuyết phục!</p>
              ) : (
                features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/5 text-slate-300 text-xs group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HÌNH ẢNH MINH HỌA GÓI */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Hình Ảnh Minh Họa ({imageUrls.length})</span>
              </label>
              <span className="text-[10px] text-slate-400">Tối đa 10 ảnh mẫu</span>
            </div>

            {/* 2 Cách thêm ảnh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Tải tệp từ máy tính */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleUploadImageFile}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Đang tải lên Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tải ảnh từ máy tính (Tối đa 10MB)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dán URL ảnh */}
              <div className="flex gap-1.5">
                <input
                  type="url"
                  placeholder="Hoặc dán URL: https://..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Image Gallery Preview */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-white/10 group"
                  >
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[8px] uppercase">
                        Ảnh bìa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trạng thái Kích hoạt */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div>
              <p className="font-bold text-slate-200">Kích Hoạt Gói Ngay Lập Tức</p>
              <p className="text-[11px] text-slate-400">
                Khi kích hoạt, gói dịch vụ sẽ hiển thị trên trang Đặt lịch công khai cho khách hàng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isActive ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>{editingPackage ? 'Cập Nhật Gói' : 'Tạo Gói Dịch Vụ'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

