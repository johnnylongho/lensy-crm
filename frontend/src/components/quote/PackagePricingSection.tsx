import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageItem } from '../../types';
import { getCategoryMeta, PACKAGE_CATEGORIES } from '../dashboard/PackageModal';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Check,
  Tag,
} from 'lucide-react';

interface Props {
  packages: PackageItem[];
  selectedPackageId: string | null;
  onSelectPackage: (pkg: PackageItem) => void;
  studioName?: string;
}

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PackagePricingSection: React.FC<Props> = ({
  packages,
  selectedPackageId,
  onSelectPackage,
  studioName = 'Studio',
}) => {
  // Chỉ số ảnh hiện tại trong slider cho từng gói chụp (map by package id)
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});

  // Active Category Tab: 'all' hoặc category value
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Lightbox Modal state
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    currentIndex: number;
    packageName: string;
    packagePrice: number;
  } | null>(null);

  // 1. Trích xuất danh sách các category hiện có từ data packages tải về
  const categoryStats = useMemo(() => {
    const stats = new Map<string, number>();
    packages.forEach(pkg => {
      const cat = pkg.category || 'studio';
      stats.set(cat, (stats.get(cat) || 0) + 1);
    });
    return stats;
  }, [packages]);

  // Danh sách các categories có sẵn (theo thứ tự ưu tiên của PACKAGE_CATEGORIES)
  const availableCategories = useMemo(() => {
    return PACKAGE_CATEGORIES.filter(cat => categoryStats.has(cat.value));
  }, [categoryStats]);

  // 2. Lọc danh sách gói hiển thị theo Tab được chọn
  const filteredPackages = useMemo(() => {
    if (activeCategory === 'all') return packages;
    return packages.filter(pkg => (pkg.category || 'studio') === activeCategory);
  }, [packages, activeCategory]);

  const handlePrevImage = (pkgId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndices(prev => ({
      ...prev,
      [pkgId]: ((prev[pkgId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  const handleNextImage = (pkgId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndices(prev => ({
      ...prev,
      [pkgId]: ((prev[pkgId] || 0) + 1) % totalImages,
    }));
  };

  const handleOpenLightbox = (
    pkg: PackageItem,
    imageIndex: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!pkg.image_urls || pkg.image_urls.length === 0) return;
    setLightboxData({
      images: pkg.image_urls,
      currentIndex: imageIndex,
      packageName: pkg.name,
      packagePrice: pkg.price,
    });
  };

  const handleLightboxPrev = () => {
    if (!lightboxData) return;
    setLightboxData(prev =>
      prev
        ? {
            ...prev,
            currentIndex:
              (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
          }
        : null
    );
  };

  const handleLightboxNext = () => {
    if (!lightboxData) return;
    setLightboxData(prev =>
      prev
        ? {
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length,
          }
        : null
    );
  };

  // 4. Smart Scroll Behavior: Tự động cuộn mượt xuống Form điền thông tin
  const handleSelectPackageAndScroll = (pkg: PackageItem) => {
    onSelectPackage(pkg);
    setTimeout(() => {
      const formEl = document.getElementById('client-booking-form-wrapper');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Title Header */}
      <div className="text-center sm:text-left space-y-1.5 px-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold tracking-wide uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Bảng Giá Dịch Vụ Niêm Yết</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Chọn Gói Dịch Vụ Dành Cho Bạn
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Khám phá portfolio & hình ảnh thực tế của {studioName}. Chọn gói dịch vụ phù hợp để tự động đồng bộ vào thông tin đặt lịch.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 1. DYNAMIC CATEGORY TABS (BỘ LỌC ĐỘNG - CUỘN NGANG MOBILE-FIRST)     */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none snap-x py-2 mb-6 -mx-1 px-1">
        {/* Tab "Tất Cả" */}
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-tight snap-start shrink-0 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm ${
            activeCategory === 'all'
              ? 'bg-orange-500 text-white shadow-orange-500/25 ring-2 ring-orange-500/30'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>Tất Cả</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeCategory === 'all'
                ? 'bg-white/25 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {packages.length}
          </span>
        </button>

        {/* Các Category Tabs động lấy từ Data */}
        {availableCategories.map(cat => {
          const count = categoryStats.get(cat.value) || 0;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold tracking-tight snap-start shrink-0 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm ${
                isActive
                  ? 'bg-orange-500 text-white shadow-orange-500/25 ring-2 ring-orange-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isActive ? '#ffffff' : cat.accentColor }}
              />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 2. RESPONSIVE PACKAGE GRID (1 CỘT MOBILE, 2 TABLET, 3 DESKTOP)       */}
      {/* ==================================================================== */}
      {filteredPackages.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-200 space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            Không có gói dịch vụ nào trong phân loại này.
          </p>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
          >
            Xem tất cả gói dịch vụ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map(pkg => {
            const isSelected = selectedPackageId === pkg.id;
            const depositAmount = Math.round(pkg.price * 0.3);
            const catMeta = getCategoryMeta(pkg.category);
            const images =
              pkg.image_urls && pkg.image_urls.length > 0
                ? pkg.image_urls
                : [
                    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
                  ];
            const currentImgIdx = imageIndices[pkg.id] || 0;
            const activeImage = images[currentImgIdx] || images[0];

            return (
              <motion.div
                key={pkg.id}
                onClick={() => handleSelectPackageAndScroll(pkg)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`w-full cursor-pointer rounded-3xl h-full flex flex-col justify-between overflow-hidden relative group text-left transition-all duration-300 ${
                  isSelected
                    ? 'bg-white border-2 border-orange-500 ring-4 ring-orange-500/10 shadow-xl shadow-orange-500/10'
                    : 'bg-white border border-slate-200/90 hover:border-orange-500/40 hover:shadow-lg'
                }`}
              >
                {/* Indicator đang chọn */}
                {isSelected && (
                  <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1 animate-pulse">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Đang Chọn</span>
                  </div>
                )}

                <div className="flex flex-col flex-1">
                  {/* ========================================================== */}
                  {/* MINI PORTFOLIO CAROUSEL / SLIDER                            */}
                  {/* ========================================================== */}
                  <div className="relative h-44 sm:h-52 w-full bg-slate-100 overflow-hidden group/img">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImage}
                        src={activeImage}
                        alt={pkg.name}
                        initial={{ opacity: 0.3, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.3 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full object-cover brightness-[0.98] group-hover/img:brightness-100 transition-all duration-500"
                      />
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                    {/* Badge Category trên góc trái ảnh */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[10px] font-extrabold uppercase tracking-wider shadow-sm bg-black/60 text-white border-white/20`}
                      >
                        {catMeta.label}
                      </span>
                    </div>

                    {/* Nút Phóng To Lightbox */}
                    <button
                      type="button"
                      onClick={e => handleOpenLightbox(pkg, currentImgIdx, e)}
                      className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 hover:border-orange-500 transition-all duration-200 shadow-lg flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                      title="Phóng to xem ảnh gốc"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Phóng To</span>
                    </button>

                    {/* Nút lùi/tiến ảnh nếu có nhiều hơn 1 ảnh */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={e => handlePrevImage(pkg.id, images.length, e)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover/img:opacity-100 shadow-md"
                          title="Ảnh trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={e => handleNextImage(pkg.id, images.length, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover/img:opacity-100 shadow-md"
                          title="Ảnh kế tiếp"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Dots Pagination */}
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 z-10">
                          {images.map((_, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`h-2 rounded-full transition-all duration-300 ${
                                dotIdx === currentImgIdx
                                  ? 'w-5 bg-orange-500 shadow-sm shadow-orange-500/80'
                                  : 'w-2 bg-white/50 hover:bg-white/80'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Số lượng ảnh */}
                    <div className="absolute top-3 right-3">
                      {!isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-mono flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-orange-400" />
                          <span>{images.length} ảnh</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* 3. PACKAGE CARD INFO                                       */}
                  {/* ========================================================== */}
                  <div className="p-5 space-y-4 flex flex-col flex-1">
                    {/* Tên Gói & Mô Tả */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    {/* Khối Giá Tiền & Giá Cọc */}
                    <div className="p-3.5 rounded-2xl bg-orange-500/[0.04] border border-orange-500/15 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Tiền cọc giữ lịch (30%):
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-orange-600">
                          {formatVND(depositAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                        <span>Giá trọn gói niêm yết:</span>
                        <span className="font-semibold text-slate-700">
                          {formatVND(pkg.price)}
                        </span>
                      </div>
                    </div>

                    {/* Danh Sách Quyền Lợi */}
                    <div className="space-y-2 pt-1 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Quyền lợi & Sản phẩm đi kèm:
                      </span>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {(pkg.features || []).map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <span className="text-orange-500 font-black text-sm leading-none mt-0.5 select-none shrink-0">
                              +
                            </span>
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* ========================================================== */}
                {/* 4. NÚT "CHỌN GÓI NÀY" TO BẢN NẰM DƯỚI CÙNG                 */}
                {/* ========================================================== */}
                <div className="p-5 pt-0 mt-auto">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleSelectPackageAndScroll(pkg);
                    }}
                    className={`w-full h-12 min-h-[44px] px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-500/20'
                        : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-500/30'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        <span>Đã Chọn Gói Này</span>
                      </>
                    ) : (
                      <>
                        <span>Chọn Gói Này</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* LIGHTBOX MODAL (XEM ẢNH GỐC FULL MÀN HÌNH)                          */}
      {/* ==================================================================== */}
      {lightboxData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Lightbox */}
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-white/10 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {lightboxData.packageName}
                </h3>
                <p className="text-xs text-orange-400 font-bold">
                  {formatVND(lightboxData.packagePrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ảnh Phóng To */}
            <div className="relative w-full max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={lightboxData.images[lightboxData.currentIndex]}
                alt="Lightbox View"
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />

              {lightboxData.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleLightboxPrev}
                    className="absolute left-3 p-3 rounded-full bg-black/60 hover:bg-orange-600 text-white border border-white/20 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLightboxNext}
                    className="absolute right-3 p-3 rounded-full bg-black/60 hover:bg-orange-600 text-white border border-white/20 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Footer Lightbox */}
            <div className="text-center text-xs text-slate-400 pt-3">
              Ảnh {lightboxData.currentIndex + 1} / {lightboxData.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagePricingSection;
