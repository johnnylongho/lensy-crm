import React, { useState } from 'react';
import { QuoteData, ProofingSession, ProofingItem } from '../../types';
import {
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  FolderOpen,
  Image as ImageIcon,
  MessageSquare,
  FileCheck2,
  ShieldCheck,
  Send,
  Heart,
  Grid3X3,
  ListOrdered,
  Keyboard,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { VisualProofingGallery } from './VisualProofingGallery';

interface Props {
  quote: QuoteData;
  onProofingUpdated?: (updatedSession: ProofingSession) => void;
}

export const ClientProofingSection: React.FC<Props> = ({ quote, onProofingUpdated }) => {
  const initialSession: ProofingSession = quote.proofing_session || {
    drive_preview_link: quote.drive_delivery_link || '',
    max_selections: 20,
    selected_filenames: [],
    items: [],
    is_locked: false,
  };

  const [session, setSession] = useState<ProofingSession>(initialSession);
  const [quickInput, setQuickInput] = useState('');
  const [singleFilename, setSingleFilename] = useState('');
  const [singleNotes, setSingleNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessToast, setIsSuccessToast] = useState<string | null>(null);
  const [copiedLightroom, setCopiedLightroom] = useState(false);

  // Chế độ xem: 'gallery' (Lưới ảnh thả tim) | 'quickpad' (Nhập mã 4 số đuôi / Dán Zalo)
  const hasPreviewImages = Boolean(session.items && session.items.some(i => i.preview_url || i.thumbnail_url));
  const [viewMode, setViewMode] = useState<'gallery' | 'quickpad'>(hasPreviewImages ? 'gallery' : 'quickpad');

  const previewLink = session.drive_preview_link || quote.drive_delivery_link;
  const maxAllowed = session.max_selections || 20;
  const selectedItems = (session.items || []).filter(i => i.is_selected);
  const currentCount = selectedItems.length;
  const isLocked = Boolean(session.is_locked);
  const progressPercent = Math.min(100, Math.round((currentCount / maxAllowed) * 100));

  // Auto dismiss toast
  const showToast = (msg: string) => {
    setIsSuccessToast(msg);
    setTimeout(() => setIsSuccessToast(null), 3500);
  };

  // Đồng bộ lưu Supabase (Ưu tiên gọi RPC submit_client_proofing_selection, fallback về Direct Update)
  const saveSessionToDb = async (newSession: ProofingSession, markEditing = false) => {
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured && (quote.quoteToken || quote.id)) {
        let rpcSuccess = false;

        // 1. Ưu tiên gọi hàm RPC bảo mật submit_client_proofing_selection
        if (quote.quoteToken) {
          try {
            const { error: rpcError } = await supabase.rpc('submit_client_proofing_selection', {
              p_quote_token: quote.quoteToken,
              p_proofing_session: newSession,
            });
            if (!rpcError) {
              rpcSuccess = true;
            } else {
              console.warn('RPC submit_client_proofing_selection failed, falling back:', rpcError.message);
            }
          } catch (rpcErr) {
            console.warn('Lỗi khi gọi RPC submit_client_proofing_selection:', rpcErr);
          }
        }

        // 2. Fallback về direct update nếu RPC chưa được tạo hoặc gọi thất bại
        if (!rpcSuccess && quote.id) {
          const updatePayload: any = {
            proofing_session: newSession,
            updated_at: new Date().toISOString(),
          };
          if (markEditing && (quote.status === 'shot' || quote.status === 'deposited' || quote.status === 'da_chot')) {
            updatePayload.status = 'editing';
          }

          const { error } = await supabase
            .from('bookings')
            .update(updatePayload)
            .eq('id', quote.id);

          if (error) {
            console.warn('Lỗi lưu proofing_session fallback:', error);
          }
        }
      }
      setSession(newSession);
      if (onProofingUpdated) {
        onProofingUpdated(newSession);
      }
    } catch (err) {
      console.error('Lỗi lưu session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Tap Heart Toggle Selection in Visual Gallery
  const handleToggleSelect = (item: ProofingItem) => {
    if (isLocked) return;
    const existing = session.items || [];
    const isNowSelected = !item.is_selected;

    // Kiểm tra giới hạn số lượng nếu chọn thêm
    if (isNowSelected && currentCount >= maxAllowed) {
      showToast(`⚠️ Bạn đã chọn đủ ${maxAllowed} ảnh theo gói! Hãy bỏ bớt ảnh khác nếu muốn chọn thêm.`);
      return;
    }

    const newItems = existing.map(i =>
      i.id === item.id || i.filename === item.filename
        ? { ...i, is_selected: isNowSelected }
        : i
    );
    const newSelectedFilenames = newItems.filter(i => i.is_selected).map(i => i.filename);

    const updated: ProofingSession = {
      ...session,
      items: newItems,
      selected_filenames: newSelectedFilenames,
    };

    saveSessionToDb(updated);
  };

  // Cập nhật ghi chú sửa ảnh
  const handleUpdateNotes = (item: ProofingItem, notes: string) => {
    const existing = session.items || [];
    const newItems = existing.map(i =>
      i.id === item.id || i.filename === item.filename
        ? { ...i, notes: notes.trim() }
        : i
    );

    const updated: ProofingSession = {
      ...session,
      items: newItems,
    };

    saveSessionToDb(updated);
    showToast(`Đã lưu yêu cầu chỉnh sửa cho ảnh ${item.filename}`);
  };

  // Thêm 1 ảnh lẻ kèm ghi chú
  const handleAddSingleItem = () => {
    const rawName = singleFilename.trim();
    if (!rawName) return;

    // Chuẩn hóa tên file: nếu chỉ gõ 3-5 số đuôi, tự biến thành IMG_xxxx.JPG
    let formatted = rawName.toUpperCase();
    if (/^\d{3,5}$/.test(formatted)) {
      formatted = `IMG_${formatted}.JPG`;
    } else if (!formatted.includes('.')) {
      formatted = `${formatted}.JPG`;
    }

    const existing = session.items || [];
    if (existing.some(i => i.filename.toUpperCase() === formatted)) {
      showToast('⚠️ Mã ảnh này đã có trong danh sách!');
      return;
    }

    if (currentCount >= maxAllowed) {
      showToast(`⚠️ Bạn đã chọn đủ ${maxAllowed} ảnh theo gói!`);
      return;
    }

    const newItem: ProofingItem = {
      id: 'proof-' + Date.now(),
      filename: formatted,
      notes: singleNotes.trim(),
      is_selected: true,
    };

    const newItems = [...existing, newItem];
    const newFilenames = newItems.filter(i => i.is_selected).map(i => i.filename);

    const updated: ProofingSession = {
      ...session,
      items: newItems,
      selected_filenames: newFilenames,
    };

    setSingleFilename('');
    setSingleNotes('');
    saveSessionToDb(updated);
    showToast(`Đã chọn ảnh ${formatted}!`);
  };

  // Bóc tách tự động từ tin nhắn Zalo hoặc danh sách mã số (Smart Zalo & Text Parser)
  const handleAddBatch = () => {
    if (!quickInput.trim()) return;

    // Quét tìm tất cả các token dạng mã ảnh hoặc số nguyên 3-5 chữ số
    const matches = quickInput.match(/(IMG_?\d{3,5}(\.JPG|\.CR3|\.PNG)?)|(\b\d{3,5}\b)/gi);

    if (!matches || matches.length === 0) {
      showToast('Không tìm thấy mã số ảnh hợp lệ trong đoạn văn bản.');
      return;
    }

    const existing = session.items || [];
    const existingSet = new Set(existing.map(i => i.filename.toUpperCase()));
    const addedItems: ProofingItem[] = [];

    matches.forEach(rawToken => {
      let cleaned = rawToken.trim().toUpperCase();
      if (/^\d{3,5}$/.test(cleaned)) {
        cleaned = `IMG_${cleaned}.JPG`;
      } else if (!cleaned.includes('.')) {
        cleaned = `${cleaned}.JPG`;
      }

      if (!existingSet.has(cleaned)) {
        existingSet.add(cleaned);
        addedItems.push({
          id: 'proof-' + Math.random().toString(36).substring(2, 9),
          filename: cleaned,
          is_selected: true,
        });
      }
    });

    if (addedItems.length === 0) {
      showToast('Tất cả các ảnh vừa nhập đã có trong danh sách chọn.');
      return;
    }

    const newItems = [...existing, ...addedItems];
    const newFilenames = newItems.filter(i => i.is_selected).map(i => i.filename);

    const updated: ProofingSession = {
      ...session,
      items: newItems,
      selected_filenames: newFilenames,
    };

    setQuickInput('');
    saveSessionToDb(updated);
    showToast(`Bóc tách thành công ${addedItems.length} ảnh vào danh sách chọn!`);
  };

  // Khóa & Chốt danh sách chọn
  const handleLockSelections = () => {
    if (currentCount === 0) {
      showToast('⚠️ Vui lòng chọn ít nhất 1 ảnh trước khi chốt danh sách!');
      return;
    }

    const updated: ProofingSession = {
      ...session,
      is_locked: true,
      locked_at: new Date().toISOString(),
    };

    saveSessionToDb(updated, true);
    showToast('🎉 Chúc mừng! Bạn đã chốt và gửi danh sách ảnh thành công cho Studio.');
  };

  // Copy Lightroom search query
  const handleCopyLightroomQuery = () => {
    const filenames = selectedItems.map(i => i.filename).join(', ');
    if (!filenames) return;
    navigator.clipboard.writeText(filenames);
    setCopiedLightroom(true);
    setTimeout(() => setCopiedLightroom(false), 2500);
  };

  // Nếu không có link preview và cũng chưa có ảnh nào, ẩn phần này
  if (!previewLink && (session.items?.length || 0) === 0 && !session.max_selections) {
    return null;
  }

  return (
    <div className="rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-[#1c1917] via-[#141211] to-[#0c0a09] border-2 border-purple-500/30 shadow-2xl space-y-6 animate-fadeIn relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border bg-purple-500/10 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Cổng Chọn Ảnh Retouch (Visual Proofing Portal)</span>
            </span>

            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Đã Khóa & Gửi Studio</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                <Unlock className="w-3.5 h-3.5" />
                <span>Đang Mở Chọn Ảnh</span>
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🎨 Chọn Ảnh Để Studio Photoshop & Retouch</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-300">
            Mời <strong className="text-amber-400">{quote.clientName}</strong> lướt thả tim ❤️ những tấm ảnh ưng ý nhất để thợ ảnh tiến hành blend màu và hậu kỳ chi tiết.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex flex-col items-end bg-stone-900/90 px-4 py-2.5 rounded-2xl border border-stone-800 shadow-xl">
          <span className="text-[10px] text-stone-400 uppercase font-semibold flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>Đã Thả Tim Chọn</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black font-mono ${currentCount >= maxAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentCount}
            </span>
            <span className="text-xs text-stone-500 font-mono">/ {maxAllowed} ảnh gói</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & View Switcher */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Tiến độ lựa chọn</span>
            <span className="font-mono font-bold text-stone-200">{currentCount} / {maxAllowed} ảnh ({progressPercent}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-900 border border-stone-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                currentCount >= maxAllowed
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'gallery'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Lưới Ảnh Thả Tim ❤️</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('quickpad')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'quickpad'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Nhập Mã Số / Zalo</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {isSuccessToast && (
        <div className="relative z-10 p-3 rounded-xl bg-purple-950/90 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>{isSuccessToast}</span>
        </div>
      )}

      {/* Link Google Drive mở kho ảnh */}
      {previewLink && (
        <div className="relative z-10 p-3.5 px-4 rounded-2xl bg-stone-900/70 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-stone-300">
              Bạn có thể mở kho Google Drive để xem file dung lượng gốc:
            </span>
          </div>

          <a
            href={previewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
          >
            <span>MỞ GOOGLE DRIVE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 1: LƯỚI ẢNH THẢ TIM (VISUAL PROOFING GALLERY)                  */}
      {/* ==================================================================== */}
      {viewMode === 'gallery' && (
        <div className="relative z-10">
          {(session.items && session.items.length > 0) ? (
            <VisualProofingGallery
              items={session.items}
              maxSelections={maxAllowed}
              isLocked={isLocked}
              onToggleSelect={handleToggleSelect}
              onUpdateNotes={handleUpdateNotes}
            />
          ) : (
            <div className="text-center py-10 rounded-3xl bg-stone-950/40 border border-stone-800 border-dashed space-y-3">
              <ImageIcon className="w-10 h-10 text-stone-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs text-stone-300 font-bold">Chưa có ảnh preview trong Gallery</p>
                <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                  Bạn có thể mở kho Google Drive ở trên và dùng tab <strong>"Nhập Mã Số / Zalo"</strong> để gõ nhanh các mã ảnh bạn muốn chọn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('quickpad')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Chuyển Sang Nhập Mã Nhanh</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODE 2: SMART QUICK-PAD & ZALO BATCH PARSER                        */}
      {/* ==================================================================== */}
      {viewMode === 'quickpad' && (
        <div className="relative z-10 space-y-4">
          {!isLocked ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cách 1: Smart Quick-Pad (Gõ 4 số đuôi) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                    <span>Smart Quick-Pad (Gõ 4 Số Đuôi)</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-normal">Gõ 3421 ➔ Tự ra IMG_3421</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={singleFilename}
                    onChange={e => setSingleFilename(e.target.value)}
                    placeholder="Nhập 4 số đuôi (VD: 3421) hoặc IMG_3421..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-400 font-mono"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSingleItem();
                      }
                    }}
                  />

                  <input
                    type="text"
                    value={singleNotes}
                    onChange={e => setSingleNotes(e.target.value)}
                    placeholder="Yêu cầu sửa (VD: xóa người phía sau, bóp eo nhẹ...)"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300 placeholder-stone-500 focus:outline-none focus:border-purple-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSingleItem();
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleAddSingleItem}
                    disabled={!singleFilename.trim() || isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Vào Danh Sách Chọn</span>
                  </button>
                </div>
              </div>

              {/* Cách 2: Zalo Text & Batch Parser */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dán Tin Nhắn Chat Zalo (Auto Parser)</span>
                  </div>
                  <span className="text-[10px] text-stone-500 lowercase font-normal">Tự lọc số từ tin nhắn</span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={quickInput}
                    onChange={e => setQuickInput(e.target.value)}
                    placeholder="Dán toàn bộ tin nhắn Zalo vào đây...&#10;VD: Em chọn các tấm 3421, 3425 với 3512 nhé anh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 font-mono resize-none"
                  />

                  <button
                    type="button"
                    onClick={handleAddBatch}
                    disabled={!quickInput.trim() || isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Bóc Tách & Thêm Hàng Loạt</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-300 block">Danh sách chọn ảnh đã được khóa gửi cho Studio!</span>
                <span className="text-stone-400">
                  Thời gian chốt: {session.locked_at ? new Date(session.locked_at).toLocaleString('vi-VN') : 'Gần đây'}.
                </span>
              </div>
            </div>
          )}

          {/* Danh Sách Các Ảnh Đã Chọn Dạng Thẻ */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Danh Sách Ảnh Đã Chọn ({selectedItems.length})</span>
              </span>

              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyLightroomQuery}
                  className="text-[11px] text-stone-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all cursor-pointer font-mono"
                  title="Sao chép danh sách mã file"
                >
                  {copiedLightroom ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-stone-400" />
                      <span>Copy mã file</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 rounded-2xl bg-stone-950/40 border border-stone-800 border-dashed space-y-2">
                <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="text-xs text-stone-400 font-medium">Chưa có mã ảnh nào được chọn</p>
                <p className="text-[11px] text-stone-500">Dùng ô nhập 4 số đuôi hoặc dán đoạn chat Zalo bên trên để chọn nhanh</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-start justify-between gap-2 hover:border-stone-700 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center justify-center font-mono flex-shrink-0">
                          {idx + 1}
                        </span>
                        <strong className="text-xs font-mono font-bold text-white truncate block">
                          {item.filename}
                        </strong>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-amber-300/90 flex items-start gap-1 pl-7 line-clamp-2 italic">
                          <MessageSquare className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{item.notes}</span>
                        </p>
                      )}
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item)}
                        className="p-1 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0"
                        title="Bỏ chọn ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Call to Action: Nút Khóa & Gửi Lựa Chọn Cho Studio */}
      {!isLocked && currentCount > 0 && (
        <div className="relative z-10 pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-400 text-center sm:text-left">
            <span>Bạn đã chọn <strong>{currentCount}/{maxAllowed}</strong> ảnh. Bấm nút bên phải để khóa và gửi Studio xử lý.</span>
          </div>

          <button
            type="button"
            onClick={handleLockSelections}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer transform active:scale-95"
          >
            <Lock className="w-4 h-4" />
            <span>KHÓA & GỬI CHỐT ẢNH CHO STUDIO ({currentCount} ẢNH)</span>
          </button>
        </div>
      )}
    </div>
  );
};
