import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PackageItem } from '../../types';
import { MOCK_PACKAGES } from '../../data/mockData';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Search,
  Filter,
  X,
  Copy,
  LayoutGrid,
  List,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Eye,
  EyeOff,
  Star,
  Layers,
  ArrowRight,
} from 'lucide-react';

// Format tiền tệ VNĐ
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Gợi ý gói chụp mẫu nhanh (Quick Presets) cho thợ ảnh
const QUICK_PRESETS: Array<{
  name: string;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
}> = [
  {
    name: 'Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)',
    price: 18000000,
    description: 'Trọn gói chụp ngày cưới với 2 thợ chính, bắt trọn từng khoảnh khắc cảm xúc thăng hoa và đẳng cấp nghệ thuật.',
    features: [
      '2 Thợ chụp chính máy Sony A7 IV + Lens GM cao cấp',
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
    name: 'Chụp Ảnh Gia Đình & Thôi Nôi / Baby',
    price: 4500000,
    description: 'Ghi lại những khoảnh khắc ấm cúng, tự nhiên nhất của gia đình tại nhà riêng hoặc không gian ngoại cảnh thoáng đãng.',
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

// Gợi ý quyền lợi nhanh
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
  'Hỗ trợ trang phục & makeup theo gói',
];

export const PackagesManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);

  // Form Fields
  const [packageName, setPackageName] = useState('');
  const [packagePrice, setPackagePrice] = useState<number | string>('');
  const [packageDesc, setPackageDesc] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ====================================================================
  // 1. FETCH PACKAGES (SUPABASE VỚI MOCK LOCAL FALLBACK)
  // ====================================================================
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('packages')
          .select('*')
          .order('created_at', { ascending: false });

        if (user) {
          query = query.eq('photographer_id', user.id);
        }

        const { data, error } = await query;
        if (error) {
          // Nếu bảng chưa có trong schema Supabase, dùng mock fallback
          if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
            console.warn('[Packages] Bảng packages chưa được migrate trên Supabase. Sử dụng dữ liệu khởi tạo.');
            const localSaved = localStorage.getItem('lensy_packages_local');
            if (localSaved) {
              setPackages(JSON.parse(localSaved));
            } else {
              setPackages(MOCK_PACKAGES);
            }
          } else {
            throw error;
          }
        } else if (data && data.length > 0) {
          // Chuẩn hóa dữ liệu features & image_urls từ Supabase
          const formatted = data.map((pkg: any) => ({
            ...pkg,
            price: Number(pkg.price || 0),
            features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? JSON.parse(pkg.features) : []),
            image_urls: Array.isArray(pkg.image_urls) ? pkg.image_urls : [],
            is_active: pkg.is_active ?? true,
          }));
          setPackages(formatted);
        } else {
          // Chưa có bản ghi nào, kiểm tra local storage hoặc dùng mock
          const localSaved = localStorage.getItem('lensy_packages_local');
          if (localSaved) {
            setPackages(JSON.parse(localSaved));
          } else {
            setPackages(MOCK_PACKAGES);
          }
        }
      } else {
        const localSaved = localStorage.getItem('lensy_packages_local');
        setPackages(localSaved ? JSON.parse(localSaved) : MOCK_PACKAGES);
      }
    } catch (err: any) {
      console.error('Lỗi khi fetch gói dịch vụ:', err);
      const localSaved = localStorage.getItem('lensy_packages_local');
      setPackages(localSaved ? JSON.parse(localSaved) : MOCK_PACKAGES);
      setToast({ type: 'error', message: 'Không thể tải gói từ Supabase: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [user]);

  // Lưu state vào local cache dự phòng
  const saveToLocalCache = (updatedList: PackageItem[]) => {
    localStorage.setItem('lensy_packages_local', JSON.stringify(updatedList));
  };

  // ====================================================================
  // 2. OPEN CREATE / EDIT MODAL
  // ====================================================================
  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setPackageName('');
    setPackagePrice('');
    setPackageDesc('');
    setFeatures([
      'Chụp không giới hạn số lượng file',
      'Chỉnh sửa màu sắc toàn bộ ảnh gốc',
      'Retouch 40 ảnh đẹp nhất',
      'Bàn giao toàn bộ file qua Google Drive',
    ]);
    setNewFeatureText('');
    setImageUrls([
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    ]);
    setNewImageUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setPackageName(pkg.name);
    setPackagePrice(pkg.price);
    setPackageDesc(pkg.description || '');
    setFeatures([...(pkg.features || [])]);
    setNewFeatureText('');
    setImageUrls([...(pkg.image_urls || [])]);
    setNewImageUrl('');
    setIsActive(pkg.is_active);
    setIsModalOpen(true);
  };

  // Áp dụng nhanh Preset
  const handleApplyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setPackageName(preset.name);
    setPackagePrice(preset.price);
    setPackageDesc(preset.description);
    setFeatures([...preset.features]);
    if (preset.imageUrl && !imageUrls.includes(preset.imageUrl)) {
      setImageUrls(prev => [preset.imageUrl, ...prev]);
    }
    setToast({ type: 'success', message: `Đã nạp mẫu: "${preset.name}"` });
  };

  // Thêm quyền lợi mới
  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    if (features.includes(trimmed)) {
      setToast({ type: 'error', message: 'Quyền lợi này đã tồn tại trong danh sách!' });
      return;
    }
    setFeatures(prev => [...prev, trimmed]);
    setNewFeatureText('');
  };

  // Gỡ quyền lợi
  const handleRemoveFeature = (indexToRemove: number) => {
    setFeatures(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Thêm link ảnh bằng URL
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setToast({ type: 'error', message: 'Vui lòng nhập đường link ảnh hợp lệ (bắt đầu bằng https://)!' });
      return;
    }
    setImageUrls(prev => [...prev, trimmed]);
    setNewImageUrl('');
  };

  // Gỡ link ảnh
  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ====================================================================
  // 3. TÍCH HỢP SUPABASE STORAGE UPLOAD ẢNH THAM KHẢO
  // ====================================================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Giới hạn kích thước ảnh 10MB
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB!' });
      return;
    }

    setIsUploading(true);
    try {
      if (isSupabaseConfigured) {
        const fileExt = file.name.split('.').pop();
        const fileName = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${user?.id || 'public'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('package-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // Lấy Public URL
        const { data: publicUrlData } = supabase.storage
          .from('package-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setImageUrls(prev => [...prev, publicUrlData.publicUrl]);
          setToast({ type: 'success', message: 'Tải ảnh lên Supabase Storage thành công!' });
        }
      } else {
        // Mock fallback preview qua FileReader
        const reader = new FileReader();
        reader.onload = event => {
          if (event.target?.result) {
            setImageUrls(prev => [...prev, event.target!.result as string]);
            setToast({ type: 'success', message: 'Đã thêm ảnh tham khảo vào gói!' });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh lên Supabase Storage:', err);
      setToast({ type: 'error', message: 'Không thể upload ảnh: ' + (err.message || 'Lỗi lưu trữ') });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ====================================================================
  // 4. SUBMIT FORM (CREATE / UPDATE PACKAGE)
  // ====================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = packageName.trim();
    if (!trimmedName) {
      setToast({ type: 'error', message: 'Vui lòng nhập tên gói dịch vụ!' });
      return;
    }

    const priceNum = Number(packagePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setToast({ type: 'error', message: 'Vui lòng nhập giá tiền hợp lệ!' });
      return;
    }

    setIsSubmitting(true);
    try {
      const packagePayload = {
        photographer_id: user?.id || 'a1111111-1111-1111-1111-111111111111',
        name: trimmedName,
        price: priceNum,
        description: packageDesc.trim() || null,
        features: features,
        image_urls: imageUrls,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (editingPackage) {
        // CẬP NHẬT GÓI
        let updatedSuccess = false;

        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from('packages')
            .update(packagePayload)
            .eq('id', editingPackage.id);

          if (!error) updatedSuccess = true;
        }

        // Cập nhật local state
        const updatedList = packages.map(pkg =>
          pkg.id === editingPackage.id ? { ...pkg, ...packagePayload } : pkg
        );
        setPackages(updatedList);
        saveToLocalCache(updatedList);

        setToast({ type: 'success', message: `Đã cập nhật gói "${trimmedName}" thành công!` });
      } else {
        // TẠO MỚI GÓI
        const newId = `pkg-${Date.now()}`;
        const newPackageItem: PackageItem = {
          id: newId,
          ...packagePayload,
          description: packagePayload.description || undefined,
          created_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('packages')
            .insert([{ ...packagePayload }])
            .select();

          if (!error && data && data[0]) {
            newPackageItem.id = data[0].id;
          }
        }

        const updatedList = [newPackageItem, ...packages];
        setPackages(updatedList);
        saveToLocalCache(updatedList);

        setToast({ type: 'success', message: `Đã thêm gói dịch vụ mới "${trimmedName}"!` });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu gói:', err);
      setToast({ type: 'error', message: 'Lỗi khi lưu gói: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================================================================
  // 5. TOGGLE TRẠNG THÁI ACTIVE
  // ====================================================================
  const handleToggleActive = async (pkg: PackageItem) => {
    const newStatus = !pkg.is_active;
    const updatedList = packages.map(p =>
      p.id === pkg.id ? { ...p, is_active: newStatus } : p
    );
    setPackages(updatedList);
    saveToLocalCache(updatedList);

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('packages')
          .update({ is_active: newStatus })
          .eq('id', pkg.id);
      }
      setToast({
        type: 'success',
        message: newStatus ? `Đã kích hoạt gói "${pkg.name}"` : `Đã tạm ẩn gói "${pkg.name}"`,
      });
    } catch (err: any) {
      console.error('Lỗi khi đổi trạng thái gói:', err);
    }
  };

  // ====================================================================
  // 6. NHÂN BẢN GÓI (DUPLICATE PACKAGE)
  // ====================================================================
  const handleDuplicate = async (pkg: PackageItem) => {
    const duplicatedName = `${pkg.name} (Bản sao)`;
    const newId = `pkg-${Date.now()}`;
    const duplicatedPkg: PackageItem = {
      ...pkg,
      id: newId,
      name: duplicatedName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('packages')
          .insert([
            {
              photographer_id: user?.id || pkg.photographer_id,
              name: duplicatedName,
              price: pkg.price,
              description: pkg.description,
              features: pkg.features,
              image_urls: pkg.image_urls,
              is_active: pkg.is_active,
            },
          ])
          .select();

        if (!error && data && data[0]) {
          duplicatedPkg.id = data[0].id;
        }
      } catch (err) {
        console.error('Lỗi nhân bản Supabase:', err);
      }
    }

    const updatedList = [duplicatedPkg, ...packages];
    setPackages(updatedList);
    saveToLocalCache(updatedList);
    setToast({ type: 'success', message: `Đã nhân bản gói thành "${duplicatedName}"!` });
  };

  // ====================================================================
  // 7. XÓA GÓI DỊCH VỤ
  // ====================================================================
  const handleDeletePackage = async (pkg: PackageItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${pkg.name}" không? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    const updatedList = packages.filter(p => p.id !== pkg.id);
    setPackages(updatedList);
    saveToLocalCache(updatedList);

    try {
      if (isSupabaseConfigured) {
        await supabase.from('packages').delete().eq('id', pkg.id);
      }
      setToast({ type: 'success', message: `Đã xóa gói "${pkg.name}" thành công!` });
    } catch (err: any) {
      console.error('Lỗi khi xóa gói:', err);
      setToast({ type: 'error', message: 'Không thể xóa gói: ' + err.message });
    }
  };

  // ====================================================================
  // 8. TÍNH TOÁN THỐNG KÊ & LỌC DANH SÁCH
  // ====================================================================
  const totalPackages = packages.length;
  const activePackages = packages.filter(p => p.is_active).length;
  const maxPrice = packages.length > 0 ? Math.max(...packages.map(p => p.price)) : 0;
  const avgPrice =
    packages.length > 0
      ? Math.round(packages.reduce((acc, cur) => acc + cur.price, 0) / packages.length)
      : 0;

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      pkg.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? pkg.is_active
        : !pkg.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TOP HEADER SECTION                                                   */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Quản Lý Gói Dịch Vụ (Packages)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Menu Báo Giá
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Thiết lập bảng giá, phân tầng quyền lợi và hình ảnh mẫu demo hiển thị trên trang đặt lịch công khai.
          </p>
        </div>

        {/* Nút Thêm Gói Mới */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Gói Dịch Vụ Mới</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4 STATS CARDS LIQUID GLASS                                           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Gói Chụp</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{totalPackages}</span>
            <span className="text-xs text-amber-500 font-bold">Gói niêm yết</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Đang Hoạt Động</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{activePackages}</span>
            <span className="text-xs text-slate-400 font-medium">/{totalPackages} gói</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Giá Gói Cao Nhất</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-500">{formatVND(maxPrice)}</span>
            <span className="text-[10px] text-slate-400">Luxury</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Giá Trung Bình</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatVND(avgPrice)}</span>
            <span className="text-[10px] text-slate-400">/ hợp đồng</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TOOLBAR: SEARCH, STATUS FILTER & VIEW TOGGLE                          */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-white/60 dark:border-white/10 backdrop-blur-md">
        <div className="flex flex-1 items-center gap-2">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm gói chụp theo tên, mô tả hoặc quyền lợi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-amber-500/20 text-slate-900 dark:text-amber-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({packages.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Đang hoạt động ({packages.filter(p => p.is_active).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tạm ẩn ({packages.filter(p => !p.is_active).length})
            </button>
          </div>
        </div>

        {/* Chuyển đổi View Lưới / Bảng */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            title="Dạng lưới thẻ"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-white/10 text-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Dạng danh sách bảng"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-white/10 text-amber-500 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PACKAGES CONTENT VIEW (GRID / TABLE)                                 */}
      {/* ==================================================================== */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Đang tải danh sách gói dịch vụ...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/40 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy gói dịch vụ phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
                : 'Bạn chưa tạo gói chụp nào. Hãy bắt đầu bằng cách thêm gói đầu tiên hoặc dùng mẫu có sẵn!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Gói Mới Ngay</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* DẠNG GRID CARDS CHUẨN LIQUID GLASS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map(pkg => {
            const hasImages = pkg.image_urls && pkg.image_urls.length > 0;
            const primaryImage = hasImages
              ? pkg.image_urls[0]
              : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';

            return (
              <div
                key={pkg.id}
                className={`group rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${
                  pkg.is_active
                    ? 'border-white/60 dark:border-white/10 hover:border-amber-500/40 hover:-translate-y-1'
                    : 'border-slate-300 dark:border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Image Cover Banner */}
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-black/30" />

                    {/* Badge Trạng thái & Số lượng ảnh */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border flex items-center gap-1 transition-all ${
                          pkg.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-900/80 text-slate-400 border-slate-700'
                        }`}
                        title="Click để bật/tắt hiển thị gói"
                      >
                        {pkg.is_active ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Hiển thị</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>Tạm ẩn</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {pkg.image_urls && pkg.image_urls.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-slate-200 border border-white/20 text-[10px] font-mono flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{pkg.image_urls.length} ảnh</span>
                        </span>
                      )}
                    </div>

                    {/* Price Tag Overlay ở đáy ảnh */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between">
                      <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                        {formatVND(pkg.price)}
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 border border-amber-500/30">
                        Giá niêm yết
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        <span>Quyền lợi gói ({pkg.features?.length || 0}):</span>
                      </span>

                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {(pkg.features || []).slice(0, 4).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                        {(pkg.features || []).length > 4 && (
                          <li className="text-[11px] text-amber-500 dark:text-amber-400 font-medium pl-3.5">
                            + {(pkg.features || []).length - 4} quyền lợi chi tiết khác...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(pkg)}
                      title="Nhân bản gói này"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-white transition-all text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg)}
                      title="Xóa gói"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-all text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenEditModal(pkg)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DẠNG BẢNG (TABLE VIEW) */
        <div className="rounded-3xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/60 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Gói Dịch Vụ</th>
                  <th className="py-3.5 px-4 font-extrabold">Giá Niêm Yết</th>
                  <th className="py-3.5 px-4 font-extrabold">Số Quyền Lợi</th>
                  <th className="py-3.5 px-4 font-extrabold">Hình Ảnh</th>
                  <th className="py-3.5 px-4 font-extrabold">Trạng Thái</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredPackages.map(pkg => (
                  <tr
                    key={pkg.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-white/10">
                          {pkg.image_urls && pkg.image_urls[0] ? (
                            <img
                              src={pkg.image_urls[0]}
                              alt={pkg.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{pkg.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{pkg.description || 'Chưa có mô tả'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-amber-500">
                      {formatVND(pkg.price)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px]">
                        {pkg.features?.length || 0} mục
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px]">
                        {pkg.image_urls?.length || 0} ảnh
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(pkg)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                          pkg.is_active
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {pkg.is_active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
                        <span>{pkg.is_active ? 'Hiển thị' : 'Tạm ẩn'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDuplicate(pkg)}
                          title="Nhân bản"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(pkg)}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-amber-400 hover:text-amber-300"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg)}
                          title="Xóa"
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL THÊM / SỬA GÓI DỊCH VỤ                                         */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl my-6 rounded-3xl bg-[#080c14] border border-white/15 shadow-2xl p-5 sm:p-7 space-y-6 text-left relative max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {editingPackage ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cấu hình chi tiết bảng giá, quyền lợi và hình ảnh mẫu cho gói chụp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  {QUICK_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-[11px] font-medium text-slate-300 hover:text-amber-300 transition-all"
                    >
                      {preset.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Tên Gói & Giá Tiền */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-200 flex items-center justify-between">
                    <span>Tên Gói Chụp *</span>
                    <span className="text-[10px] text-slate-500 font-normal">Hiển thị nổi bật</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)"
                    value={packageName}
                    onChange={e => setPackageName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200 flex items-center justify-between">
                    <span>Giá Tiền (VNĐ) *</span>
                    {packagePrice !== '' && Number(packagePrice) > 0 && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        {formatVND(Number(packagePrice))}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      step={500000}
                      placeholder="VD: 18000000"
                      value={packagePrice}
                      onChange={e => setPackagePrice(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-mono font-bold"
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
                  placeholder="Mô tả tóm tắt giá trị cảm xúc, phong cách chụp và nhóm khách hàng phù hợp..."
                  value={packageDesc}
                  onChange={e => setPackageDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                />
              </div>

              {/* ================================================================ */}
              {/* DANH SÁCH QUYỀN LỢI (FEATURES)                                  */}
              {/* ================================================================ */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Danh Sách Quyền Lợi & Sản Phẩm Đi Kèm ({features.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Gạch đầu dòng quyền lợi</span>
                </div>

                {/* Input Thêm Quyền Lợi */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nhập quyền lợi mới (VD: 2 Thợ chính Sony A7 IV + Lens GM)..."
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
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>

                {/* Gợi ý thêm nhanh */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 self-center">Gợi ý nhanh:</span>
                  {FEATURE_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!features.includes(sug)) {
                          setFeatures(prev => [...prev, sug]);
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 transition-colors border border-white/5"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                {/* Danh sách đã thêm */}
                <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto">
                  {features.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Chưa có quyền lợi nào được thêm.</p>
                  ) : (
                    features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-white/5 text-slate-200"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs leading-normal">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ================================================================ */}
              {/* HÌNH ẢNH THAM KHẢO (SUPABASE STORAGE + LINK URL)                 */}
              {/* ================================================================ */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span>Hình Ảnh Tham Khảo / Demo ({imageUrls.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Lưu vào Supabase Storage</span>
                </div>

                {/* 2 Cách thêm ảnh: Upload tệp hoặc Dán link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Cách 1: Upload lên Supabase Storage */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>Đang tải lên Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-sky-400" />
                          <span>Tải ảnh từ máy tính</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Cách 2: Nhập Link URL */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="Dán link ảnh (https://...)"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Preview Gallery Ảnh đã chọn */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {imageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden aspect-video bg-slate-900 border border-white/10"
                      >
                        <img
                          src={url}
                          alt={`demo-${idx}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase">
                            Ảnh bìa
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Kích hoạt gói */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200">Hiển Thị Công Khai Gói Chụp</span>
                  <p className="text-[11px] text-slate-400">
                    Bật để gói xuất hiện trên trang đặt lịch của bạn và trong danh sách tạo báo giá.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    isActive ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Nút Hành Động */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingPackage ? 'Cập Nhật Gói' : 'Tạo Gói Dịch Vụ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesManagementPage;
