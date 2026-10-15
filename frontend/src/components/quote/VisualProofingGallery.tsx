import React, { useState, useEffect } from 'react';
import { ProofingItem } from '../../types';
import {
  Heart,
  MessageSquare,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  items: ProofingItem[];
  maxSelections: number;
  isLocked: boolean;
  onToggleSelect: (item: ProofingItem) => void;
  onUpdateNotes: (item: ProofingItem, notes: string) => void;
}

export const VisualProofingGallery: React.FC<Props> = ({
  items,
  maxSelections,
  isLocked,
  onToggleSelect,
  onUpdateNotes,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'noted'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const selectedCount = items.filter(i => i.is_selected).length;

  // Lọc danh sách theo filter tab
  const filteredItems = items.filter(item => {
    if (filterMode === 'selected') return item.is_selected;
    if (filterMode === 'noted') return Boolean(item.notes && item.notes.trim());
    return true;
  });

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const handleNextPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  };

  const handlePrevPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredItems.length]);

  const currentLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <div className="space-y-4">
      {/* Gallery Filter & Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-950 border border-stone-800">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Tất Cả ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('selected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'selected'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-stone-400 hover:text-rose-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterMode === 'selected' ? 'fill-white' : 'fill-rose-500/50 text-rose-400'}`} />
            <span>Đã Chọn ({selectedCount}/{maxSelections})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('noted')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'noted'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-amber-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Có Ghi Chú ({items.filter(i => Boolean(i.notes)).length})</span>
          </button>
        </div>

        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Bấm <strong>Trái tim ❤️</strong> để chọn ảnh • Chạm ảnh để xem to</span>
        </div>
      </div>

      {/* Grid Lưới Ảnh Thả Tim (Visual Proofing Grid) */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-stone-950/40 border border-stone-800 border-dashed space-y-2">
          <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
          <p className="text-xs text-stone-400">Không có ảnh nào trong mục lọc này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map((item, index) => {
            const isSelected = item.is_selected;
            const hasNotes = Boolean(item.notes && item.notes.trim());
            const previewSrc = item.preview_url || item.thumbnail_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500';

            return (
              <div
                key={item.id || item.filename}
                className={`group relative rounded-2xl overflow-hidden bg-stone-950 border transition-all duration-300 shadow-lg ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-rose-500/10'
                    : 'border-stone-800/90 hover:border-stone-700'
                }`}
              >
                {/* Photo Thumbnail Container */}
                <div
                  className="relative aspect-[3/4] bg-stone-900 cursor-pointer overflow-hidden"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={previewSrc}
                    alt={item.filename}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Dark gradient overlay for bottom badge legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent pointer-events-none" />

                  {/* Filename Tag at Bottom Left */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-stone-800 shadow-sm truncate max-w-[120px] inline-block">
                      {item.filename}
                    </span>
                  </div>

                  {/* Quick Expand Button Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-stone-950/30 pointer-events-none">
                    <div className="p-2 rounded-full bg-stone-900/80 backdrop-blur-md text-white border border-stone-700 shadow-lg">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Floating Heart Button (Top Right) */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(item);
                  }}
                  className={`absolute top-2 right-2 z-20 p-2.5 rounded-full backdrop-blur-md transition-all transform active:scale-90 cursor-pointer shadow-xl ${
                    isSelected
                      ? 'bg-rose-500 text-white scale-110 shadow-rose-500/40 ring-2 ring-white/50'
                      : 'bg-stone-950/70 text-stone-300 hover:text-white hover:bg-stone-900 border border-stone-700/80'
                  }`}
                  title={isSelected ? 'Bỏ chọn ảnh này' : 'Chọn ảnh này để retouch'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'fill-white stroke-white scale-110' : 'stroke-[2.5]'
                    }`}
                  />
                </button>

                {/* Floating Note Button (Top Left) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNoteItemId(item.id);
                    setTempNoteText(item.notes || '');
                  }}
                  className={`absolute top-2 left-2 z-20 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-md ${
                    hasNotes
                      ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400/50'
                      : 'bg-stone-950/60 text-stone-300 hover:text-white border border-stone-800'
                  }`}
                  title={hasNotes ? `Ghi chú: ${item.notes}` : 'Thêm ghi chú chỉnh sửa'}
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${hasNotes ? 'fill-stone-950' : ''}`} />
                </button>

                {/* Existing Note Snippet (If any) */}
                {hasNotes && (
                  <div className="px-2.5 py-1.5 bg-amber-500/10 border-t border-amber-500/20 text-[10px] text-amber-300 truncate">
                    <span>💬 {item.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Note Editing Popover Modal */}
      {activeNoteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl p-5 bg-stone-900 border border-stone-700 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Yêu Cầu Chỉnh Sửa Riêng</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteItemId(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-300 font-semibold">Ghi chú cho Retoucher:</label>
              <textarea
                rows={3}
                value={tempNoteText}
                onChange={(e) => setTempNoteText(e.target.value)}
                placeholder="VD: Xóa người phía sau, làm sáng mặt, bóp eo nhẹ, chỉnh màu tóc tự nhiên..."
                className="w-full p-3 rounded-2xl bg-stone-950 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 resize-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveNoteItemId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = items.find(i => i.id === activeNoteItemId);
                  if (target) {
                    onUpdateNotes(target, tempNoteText);
                  }
                  setActiveNoteItemId(null);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                Lưu Ghi Chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {currentLightboxItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-xl select-none animate-fadeIn">
          {/* Lightbox Top Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 text-white z-10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm sm:text-base font-bold bg-stone-900/80 px-3 py-1 rounded-xl border border-stone-800">
                {currentLightboxItem.filename}
              </span>
              <span className="text-xs text-stone-400">
                ({(lightboxIndex || 0) + 1} / {filteredItems.length})
              </span>
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              className="p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Center Image with Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700/80 shadow-2xl transition-all cursor-pointer transform hover:scale-110 active:scale-90"
              title="Ảnh trước (Mũi tên trái)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={currentLightboxItem.preview_url || currentLightboxItem.thumbnail_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200'}
              alt={currentLightboxItem.filename}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-all"
            />

            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700/80 shadow-2xl transition-all cursor-pointer transform hover:scale-110 active:scale-90"
              title="Ảnh tiếp theo (Mũi tên phải)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Toolbar (Big Heart Selection & Note) */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-stone-950/90 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
            <div className="text-xs text-stone-300 max-w-md">
              {currentLightboxItem.notes ? (
                <p className="flex items-center gap-1.5 text-amber-300 bg-stone-900/90 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span>Yêu cầu: {currentLightboxItem.notes}</span>
                </p>
              ) : (
                <span className="text-stone-400">Chưa có ghi chú chỉnh sửa cho ảnh này.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveNoteItemId(currentLightboxItem.id);
                  setTempNoteText(currentLightboxItem.notes || '');
                }}
                className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Ghi chú sửa</span>
              </button>

              <button
                type="button"
                disabled={isLocked}
                onClick={() => onToggleSelect(currentLightboxItem)}
                className={`px-6 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all cursor-pointer shadow-2xl transform active:scale-95 ${
                  currentLightboxItem.is_selected
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 ring-2 ring-white/50'
                    : 'bg-stone-900 hover:bg-rose-500/20 text-white border border-stone-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${currentLightboxItem.is_selected ? 'fill-white stroke-white' : ''}`} />
                <span>{currentLightboxItem.is_selected ? 'ĐÃ CHỌN ❤️' : 'CHỌN ẢNH NÀY'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
