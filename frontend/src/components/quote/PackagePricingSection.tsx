import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageItem } from '../../types';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  Image as ImageIcon,
  Check,
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

  // Lightbox Modal state
  const [lightboxData, setLightboxData] = useState<{
    images: string[];
    currentIndex: number;
    packageName: string;
    packagePrice: number;
  } | null>(null);

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

  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Section Title Header */}
      <div className="text-center sm:text-left space-y-1.5 px-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold tracking-wide uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Bảng Giá Dịch Vụ Niêm Yết</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Chọn Gói Chụp Dành Cho Bạn
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl">
          Khám phá portfolio & hình ảnh thực tế của {studioName}. Chọn gói dịch vụ phù hợp để tự động đồng bộ vào thông tin đặt lịch.
        </p>
      </div>

      {/* 3-Column Bento Grid on Desktop, Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 pb-4 md:pb-0 scrollbar-none">
        {packages.map(pkg => {
          const isSelected = selectedPackageId === pkg.id;
          const depositAmount = Math.round(pkg.price * 0.3);
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
              onClick={() => onSelectPackage(pkg)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center cursor-pointer rounded-3xl h-full flex flex-col justify-between overflow-hidden relative group text-left transition-all duration-300 ${
                isSelected
                  ? 'bg-white dark:bg-zinc-900/90 border-2 border-orange-500 ring-2 ring-orange-500/20 shadow-xl shadow-orange-500/10'
                  : 'bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-orange-500/40 hover:shadow-lg dark:hover:bg-zinc-900/80'
              }`}
            >
              {/* Selected Badge Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1 animate-pulse">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Đang Chọn</span>
                </div>
              )}

              <div className="flex flex-col flex-1">
                {/* ========================================================== */}
                {/* MINI PORTFOLIO CAROUSEL / SLIDER                           */}
                {/* ========================================================== */}
                <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-zinc-950 overflow-hidden group/img">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      src={activeImage}
                      alt={pkg.name}
                      initial={{ opacity: 0.3, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.3 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full object-cover brightness-[0.95] dark:brightness-[0.9] group-hover/img:brightness-100 transition-all duration-500"
                    />
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Nút Xem Phóng To (Lightbox Trigger) */}
                  <button
                    type="button"
                    onClick={e => handleOpenLightbox(pkg, currentImgIdx, e)}
                    className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 hover:border-orange-500 transition-all duration-200 shadow-lg flex items-center gap-1.5 text-[10px] font-bold"
                    title="Phóng to xem chất lượng ảnh gốc"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Phóng To</span>
                  </button>

                  {/* Carousel Controls (Nếu có nhiều ảnh) */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={e => handlePrevImage(pkg.id, images.length, e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 hover:border-orange-500 transition-all opacity-0 group-hover/img:opacity-100 shadow-md"
                        title="Ảnh trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={e => handleNextImage(pkg.id, images.length, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 hover:border-orange-500 transition-all opacity-0 group-hover/img:opacity-100 shadow-md"
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
                                : 'w-2 bg-white/40 hover:bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Badge số ảnh */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
                      <ImageIcon className="w-3 h-3 text-orange-400" />
                      <span>{images.length} ảnh demo</span>
                    </span>
                  </div>
                </div>

                {/* ========================================================== */}
                {/* PACKAGE INFO: Tên -> Giá Cọc (Cam) -> Giá Niêm Yết -> Quyền lợi */}
                {/* ========================================================== */}
                <div className="p-5 space-y-3.5 flex flex-col flex-1">
                  {/* 1. Tên Gói (Bold) */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                      {pkg.name}
                    </h3>
                    {pkg.description && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  {/* 2. Giá Trị Cọc (Highlight màu cam) + 3. Giá Niêm Yết (Xám, chữ nhỏ hơn) */}
                  <div className="p-3.5 rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/15 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Tiền cọc giữ lịch (30%):</span>
                      <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">
                        {formatVND(depositAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <span>Giá trọn gói niêm yết:</span>
                      <span className="font-semibold text-slate-600 dark:text-zinc-400">
                        {formatVND(pkg.price)}
                      </span>
                    </div>
                  </div>

                  {/* 4. Danh Sách Quyền Lợi (Dùng dấu `+` thay vì icon) */}
                  <div className="space-y-2 pt-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 block">
                      Quyền lợi & Sản phẩm đi kèm:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                      {(pkg.features || []).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold text-sm leading-none mt-0.5 select-none flex-shrink-0">+</span>
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Nút "Chọn Gói Này" Đặt Căn Dưới Cùng Thẻ */}
              <div className="p-5 pt-0 mt-auto">
                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  className={`w-full h-11 sm:h-12 min-h-[44px] px-4 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30 font-bold ring-2 ring-orange-500/20'
                      : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 dark:bg-white/5 dark:hover:bg-orange-500/10 dark:text-zinc-200 dark:hover:text-orange-400 border border-slate-200 dark:border-white/10 hover:border-orange-500/30'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                      <span>Đã Chọn Gói Này</span>
                    </>
                  ) : (
                    <>
                      <span>Chọn Gói Này</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* LIGHTBOX / FULLSCREEN IMAGE MODAL WITH FRAMER-MOTION                 */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {lightboxData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxData(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl overflow-hidden p-3 sm:p-6"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center rounded-3xl overflow-hidden bg-slate-950/80 border border-white/15 shadow-2xl"
            >
              {/* Header Lightbox */}
              <div className="w-full px-5 py-3.5 bg-slate-950/90 border-b border-white/10 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {lightboxData.packageName}
                  </span>
                  <span className="text-[11px] text-orange-500 font-bold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                    {formatVND(lightboxData.packagePrice)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {lightboxData.currentIndex + 1} / {lightboxData.images.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLightboxData(null)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/80 text-white transition-all duration-150"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Zoomed Image with transition */}
              <div className="relative w-full h-[65vh] sm:h-[75vh] flex items-center justify-center bg-black/50 p-2 sm:p-4 select-none">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={lightboxData.currentIndex}
                    src={lightboxData.images[lightboxData.currentIndex]}
                    alt={`Preview ${lightboxData.currentIndex}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  />
                </AnimatePresence>

                {/* Left / Right Navigation */}
                {lightboxData.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handleLightboxPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-xl"
                      title="Ảnh trước (Mũi tên trái)"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={handleLightboxNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-xl"
                      title="Ảnh kế tiếp (Mũi tên phải)"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Footer Thumbnail Strip */}
              {lightboxData.images.length > 1 && (
                <div className="w-full px-4 py-3 bg-slate-950/90 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto">
                  {lightboxData.images.map((thumbUrl, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() =>
                        setLightboxData(prev =>
                          prev ? { ...prev, currentIndex: tIdx } : null
                        )
                      }
                      className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        tIdx === lightboxData.currentIndex
                          ? 'border-orange-500 scale-105'
                          : 'border-white/10 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        alt="thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackagePricingSection;
