import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PackageItem, PackageCategory } from '../../types';
import {
  PackageModal,
  PACKAGE_CATEGORIES,
  getCategoryMeta,
} from './PackageModal';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  X,
  Copy,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Tag,
} from 'lucide-react';

// Format tiền tệ VNĐ
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PackagesManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { currentStudio } = useWorkspace();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PackageCategory>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (currentStudio && user?.id) {
          query = query.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user.id}`);
        } else if (currentStudio) {
          query = query.eq('studio_id', currentStudio.id);
        } else if (user?.id) {
          query = query.eq('photographer_id', user.id);
        }

        let { data, error } = await query;

        // Fallback nếu schema DB chưa có cột studio_id
        if (error && error.message?.includes('studio_id')) {
          console.warn('[Packages] Cột studio_id chưa có trong DB, thử lại query đơn giản:', error.message);
          let simpleQuery = supabase
            .from('packages')
            .select('*')
            .order('created_at', { ascending: false });
          if (user?.id) simpleQuery = simpleQuery.eq('photographer_id', user.id);
          const simpleRes = await simpleQuery;
          data = simpleRes.data;
          error = simpleRes.error;
        }

        if (error) {
          if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
            console.warn('[Packages] Bảng packages chưa được migrate trên Supabase. Sử dụng dữ liệu khởi tạo.');
            const localSaved = localStorage.getItem('lensy_packages_local');
            if (localSaved) {
              setPackages(JSON.parse(localSaved));
            } else {
              setPackages([]);
            }
          } else {
            throw error;
          }
        } else if (data && data.length > 0) {
          // Chuẩn hóa dữ liệu category, features & image_urls từ Supabase
          const formatted = data.map((pkg: any) => ({
            ...pkg,
            category: pkg.category || 'studio',
            price: Number(pkg.price || 0),
            features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? JSON.parse(pkg.features) : []),
            image_urls: Array.isArray(pkg.image_urls) ? pkg.image_urls : [],
            is_active: pkg.is_active ?? true,
          }));
          setPackages(formatted);
          saveToLocalCache(formatted);
        } else {
          const localSaved = localStorage.getItem('lensy_packages_local');
          if (localSaved) {
            setPackages(JSON.parse(localSaved));
          } else {
            setPackages([]);
          }
        }
      } else {
        const localSaved = localStorage.getItem('lensy_packages_local');
        setPackages(localSaved ? JSON.parse(localSaved) : []);
      }
    } catch (err: any) {
      console.error('Lỗi khi fetch gói dịch vụ:', err);
      const localSaved = localStorage.getItem('lensy_packages_local');
      setPackages(localSaved ? JSON.parse(localSaved) : []);
      setToast({ type: 'error', message: 'Không thể tải gói từ Supabase: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setPackages([]);
    fetchPackages();
    return () => {
      setPackages([]);
    };
  }, [user, currentStudio]);

  // Lưu state vào local cache dự phòng
  const saveToLocalCache = (updatedList: PackageItem[]) => {
    localStorage.setItem('lensy_packages_local', JSON.stringify(updatedList));
  };

  // ====================================================================
  // 2. OPEN CREATE / EDIT MODAL
  // ====================================================================
  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pkg: PackageItem) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  // ====================================================================
  // 3. SUBMIT FORM (CREATE / UPDATE PACKAGE)
  // ====================================================================
  const handleSavePackage = async (payload: {
    name: string;
    price: number;
    category: PackageCategory;
    description: string | null;
    features: string[];
    image_urls: string[];
    is_active: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      // 1. Xác thực ID người dùng chính xác
      let effectiveUserId = user?.id;
      if (!effectiveUserId && isSupabaseConfigured) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          effectiveUserId = authData?.user?.id;
        } catch (authErr) {
          console.warn('[Packages] Không thể lấy auth user:', authErr);
        }
      }

      const packagePayload: any = {
        name: payload.name.trim(),
        price: payload.price,
        category: payload.category || 'studio',
        description: payload.description ? payload.description.trim() : null,
        features: payload.features || [],
        image_urls: payload.image_urls || [],
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      };

      if (effectiveUserId) {
        packagePayload.photographer_id = effectiveUserId;
      }
      if (currentStudio?.id) {
        packagePayload.studio_id = currentStudio.id;
      }

      if (editingPackage) {
        // CẬP NHẬT GÓI
        if (isSupabaseConfigured) {
          let updatePayload = { ...packagePayload };
          let { error } = await supabase
            .from('packages')
            .update(updatePayload)
            .eq('id', editingPackage.id);

          // Tự động fallback nếu DB thiếu cột category hoặc studio_id
          if (error) {
            console.warn('[Packages] Fallback update khi DB thiếu cột:', error.message);
            if (error.message.includes('category')) delete updatePayload.category;
            if (error.message.includes('studio_id')) delete updatePayload.studio_id;
            const retryRes = await supabase
              .from('packages')
              .update(updatePayload)
              .eq('id', editingPackage.id);
            error = retryRes.error;
          }

          if (error) {
            throw new Error(`Không thể cập nhật gói vào cơ sở dữ liệu: ${error.message}`);
          }
        }

        // Cập nhật local state
        const updatedList = packages.map(pkg =>
          pkg.id === editingPackage.id ? { ...pkg, ...packagePayload } : pkg
        );
        setPackages(updatedList);
        saveToLocalCache(updatedList);

        setToast({ type: 'success', message: `Đã cập nhật gói "${payload.name}" thành công!` });
      } else {
        // TẠO MỚI GÓI
        const newId = `pkg-${Date.now()}`;
        const newPackageItem: PackageItem = {
          id: newId,
          ...packagePayload,
          category: payload.category, // Đảm bảo luôn giữ category trên client
          description: packagePayload.description || undefined,
          created_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured) {
          let insertPayload = { ...packagePayload };
          let { data, error } = await supabase
            .from('packages')
            .insert([insertPayload])
            .select();

          // Tự động fallback retry nếu schema DB chưa có cột category hoặc studio_id
          if (error) {
            console.warn('[Packages] Fallback insert khi DB thiếu cột mở rộng:', error.message);
            if (error.message.includes('category')) delete insertPayload.category;
            if (error.message.includes('studio_id')) delete insertPayload.studio_id;

            const retryRes = await supabase
              .from('packages')
              .insert([insertPayload])
              .select();
            data = retryRes.data;
            error = retryRes.error;
          }

          if (error) {
            throw new Error(`Không thể lưu gói vào cơ sở dữ liệu: ${error.message}`);
          }

          if (data && data[0]) {
            newPackageItem.id = data[0].id;
          }
        }

        const updatedList = [newPackageItem, ...packages];
        setPackages(updatedList);
        saveToLocalCache(updatedList);

        // Tự động chuyển bộ lọc về 'all' nếu người dùng đang lọc danh mục khác để thấy gói vừa thêm
        if (categoryFilter !== 'all' && categoryFilter !== payload.category) {
          setCategoryFilter('all');
        }

        setToast({ type: 'success', message: `Đã thêm gói dịch vụ mới "${payload.name}" thành công!` });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi khi lưu gói:', err);
      setToast({ type: 'error', message: err.message || 'Lỗi khi lưu gói dịch vụ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================================================================
  // 4. TOGGLE TRẠNG THÁI ACTIVE
  // ====================================================================
  const handleToggleActive = async (pkg: PackageItem) => {
    const newStatus = !pkg.is_active;
    const updatedList = packages.map(p =>
      p.id === pkg.id ? { ...p, is_active: newStatus } : p
    );
    setPackages(updatedList);
    saveToLocalCache(updatedList);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('packages')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('id', pkg.id);
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
      }
    }

    setToast({
      type: 'success',
      message: `Đã ${newStatus ? 'hiển thị' : 'tạm ẩn'} gói "${pkg.name}"!`,
    });
  };

  // ====================================================================
  // 5. NHÂN BẢN GÓI (DUPLICATE PACKAGE)
  // ====================================================================
  const handleDuplicate = async (pkg: PackageItem) => {
    const duplicatedName = `${pkg.name} (Bản sao)`;
    const newId = `pkg-${Date.now()}`;
    const duplicatedPkg: PackageItem = {
      ...pkg,
      id: newId,
      name: duplicatedName,
      category: pkg.category || 'studio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        let duplicatePayload: any = {
          name: duplicatedName,
          price: pkg.price,
          category: pkg.category || 'studio',
          description: pkg.description,
          features: pkg.features,
          image_urls: pkg.image_urls,
          is_active: pkg.is_active,
        };
        if (user?.id || pkg.photographer_id) {
          duplicatePayload.photographer_id = user?.id || pkg.photographer_id;
        }
        if (currentStudio?.id || pkg.studio_id) {
          duplicatePayload.studio_id = currentStudio?.id || pkg.studio_id;
        }

        let { data, error } = await supabase
          .from('packages')
          .insert([duplicatePayload])
          .select();

        if (error) {
          if (error.message.includes('category')) delete duplicatePayload.category;
          if (error.message.includes('studio_id')) delete duplicatePayload.studio_id;
          const retryRes = await supabase.from('packages').insert([duplicatePayload]).select();
          data = retryRes.data;
        }

        if (data && data[0]) {
          duplicatedPkg.id = data[0].id;
        }
      } catch (err) {
        console.error('Lỗi nhân bản Supabase:', err);
      }
    }

    const updatedList = [duplicatedPkg, ...packages];
    setPackages(updatedList);
    saveToLocalCache(updatedList);
    setToast({ type: 'success', message: `Đã nhân bản gói "${pkg.name}"!` });
  };

  // ====================================================================
  // 6. XÓA GÓI DỊCH VỤ (DELETE PACKAGE)
  // ====================================================================
  const handleDeletePackage = async (pkg: PackageItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn gói "${pkg.name}"?`)) {
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('packages').delete().eq('id', pkg.id);
        if (error) throw error;
      }

      const updatedList = packages.filter(p => p.id !== pkg.id);
      setPackages(updatedList);
      saveToLocalCache(updatedList);

      setToast({ type: 'success', message: `Đã xóa gói "${pkg.name}" thành công!` });
    } catch (err: any) {
      console.error('Lỗi xóa gói:', err);
      setToast({ type: 'error', message: 'Không thể xóa gói: ' + err.message });
    }
  };

  // ====================================================================
  // STATS & FILTERED LIST
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

    const matchesCategory =
      categoryFilter === 'all'
        ? true
        : (pkg.category || 'studio') === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full flex flex-col gap-6 pb-16"
    >
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Thiết lập bảng giá, phân loại danh mục dịch vụ và quyền lợi hiển thị trên trang đặt lịch công khai.
        </p>

        {/* Nút Thêm Gói Mới */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Thêm Gói Dịch Vụ Mới</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4 STATS CARDS LIQUID GLASS                                           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-all space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Tổng Gói Dịch Vụ</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">{totalPackages}</span>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">Gói niêm yết</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-all space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Đang Hoạt Động</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{activePackages}</span>
            <span className="text-xs text-slate-400 font-medium">/{totalPackages} gói</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-all space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Giá Gói Cao Nhất</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-orange-600 dark:text-orange-400 tracking-tight tabular-nums">{formatVND(maxPrice)}</span>
            <span className="text-[10px] text-slate-400">Luxury</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-all space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Giá Trung Bình</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">{formatVND(avgPrice)}</span>
            <span className="text-[10px] text-slate-400">/ hợp đồng</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TOOLBAR: SEARCH, CATEGORY FILTER, STATUS FILTER & VIEW TOGGLE         */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, mô tả hoặc quyền lợi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
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

          {/* Lọc danh mục dịch vụ (Category Filter Dropdown) */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/60 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-700 dark:text-slate-300">
              <Tag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                  Tất cả phân loại ({packages.length})
                </option>
                {PACKAGE_CATEGORIES.map(cat => {
                  const count = packages.filter(p => (p.category || 'studio') === cat.value).length;
                  return (
                    <option key={cat.value} value={cat.value} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                      {cat.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Lọc trạng thái (Status Filter Tabs) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all font-bold ${
                statusFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all font-bold ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600'
              }`}
            >
              Hoạt động ({packages.filter(p => p.is_active).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition-all font-bold ${
                statusFilter === 'inactive'
                  ? 'bg-zinc-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tạm ẩn ({packages.filter(p => !p.is_active).length})
            </button>
          </div>
        </div>

        {/* Chuyển đổi View Lưới / Bảng */}
        <div className="flex items-center gap-1 self-end lg:self-auto bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            title="Dạng lưới thẻ"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Dạng danh sách bảng"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
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
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Đang tải danh sách gói dịch vụ...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-slate-200/80 dark:border-zinc-800 space-y-4">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 text-orange-500 mx-auto flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy gói dịch vụ phù hợp</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Thử thay đổi bộ lọc phân loại hoặc từ khóa tìm kiếm.'
                : 'Bạn chưa tạo gói dịch vụ nào. Hãy bắt đầu bằng cách thêm gói đầu tiên!'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Gói Mới Ngay</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* DẠNG GRID CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map(pkg => {
            const hasImages = pkg.image_urls && pkg.image_urls.length > 0;
            const primaryImage = hasImages
              ? pkg.image_urls[0]
              : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
            const catMeta = getCategoryMeta(pkg.category);

            return (
              <div
                key={pkg.id}
                className={`group rounded-2xl bg-white dark:bg-zinc-900 border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  pkg.is_active
                    ? 'border-slate-200/80 dark:border-zinc-800 hover:border-orange-500/40 hover:-translate-y-0.5'
                    : 'border-slate-200/50 dark:border-zinc-800/50 opacity-70 hover:opacity-100'
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

                    {/* Badge Category & Trạng thái */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-sm ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>

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
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-zinc-900/75 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-extrabold uppercase font-mono text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">Gói Dịch Vụ</th>
                  <th className="py-3.5 px-4 font-extrabold">Phân Loại</th>
                  <th className="py-3.5 px-4 font-extrabold">Giá Niêm Yết</th>
                  <th className="py-3.5 px-4 font-extrabold">Số Quyền Lợi</th>
                  <th className="py-3.5 px-4 font-extrabold">Hình Ảnh</th>
                  <th className="py-3.5 px-4 font-extrabold">Trạng Thái</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredPackages.map(pkg => {
                  const catMeta = getCategoryMeta(pkg.category);
                  return (
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
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1.5 ${catMeta.badgeClass}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: catMeta.accentColor }}
                          />
                          <span>{catMeta.label}</span>
                        </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL THÊM / SỬA GÓI DỊCH VỤ (PACKAGE MODAL)                         */}
      {/* ==================================================================== */}
      <PackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingPackage={editingPackage}
        onSave={handleSavePackage}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
};
