import React, { useState, useRef, useEffect } from 'react';
import { BookingStatus } from '../../types';
import { ChevronDown } from 'lucide-react';

interface Props {
  status: BookingStatus;
  onChange: (newStatus: BookingStatus) => void;
  size?: 'sm' | 'md';
}

export const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
    cardBg: string;
    cardBorder: string;
    accentBorder: string;
    desc: string;
  }
> = {
  // 5 Trạng Thái Quy Trình Nhiếp Ảnh Chuẩn Kanban:
  lead: {
    label: 'Mới hỏi',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-amber-500 dark:border-l-amber-500',
    desc: 'Khách hàng mới gửi yêu cầu từ link đặt lịch',
  },
  deposited: {
    label: 'Đã cọc',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-500',
    desc: 'Đã thu tiền cọc, lịch chụp đã được khóa chắc chắn',
  },
  shot: {
    label: 'Đã chụp',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    dotColor: 'bg-blue-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-blue-500 dark:border-l-blue-500',
    desc: 'Đã bấm máy xong show, sẵn sàng đưa vào hậu kỳ',
  },
  editing: {
    label: 'Đang sửa',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800/60',
    dotColor: 'bg-indigo-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
    desc: 'Đang chọn ảnh, blend màu & retouch Photoshop',
  },
  done: {
    label: 'Hoàn tất',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    textColor: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800/60',
    dotColor: 'bg-purple-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
    desc: 'Đã giao ảnh hoàn tất 100% & quyết toán dòng tiền',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    textColor: 'text-rose-800 dark:text-rose-300',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
    dotColor: 'bg-rose-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-rose-500 dark:border-l-rose-500',
    desc: 'Lịch chụp đã hủy bỏ',
  },

  // Tương thích ngược:
  cho_coc: {
    label: 'Mới hỏi',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    dotColor: 'bg-amber-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-amber-500 dark:border-l-amber-500',
    desc: 'Đã gửi link báo giá, chờ khách cọc',
  },
  cho_xac_nhan_coc: {
    label: 'Chờ duyệt bill',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    textColor: 'text-orange-800 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800/60',
    dotColor: 'bg-orange-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-orange-400 dark:border-l-orange-400',
    desc: 'Khách đã gửi ảnh bill cọc, chờ studio duyệt',
  },
  confirmed: {
    label: 'Đã cọc',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-500',
    desc: 'Lịch chụp đã được xác nhận chắc chắn',
  },
  da_chot: {
    label: 'Đã cọc',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-500',
    desc: 'Đã thu cọc, lịch chụp đã được khóa',
  },
  da_tra_file: {
    label: 'Đang sửa',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800/60',
    dotColor: 'bg-indigo-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
    desc: 'Đã giao ảnh Drive, chờ thu số tiền nợ đọng',
  },
  hoan_thanh: {
    label: 'Hoàn tất',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    textColor: 'text-purple-800 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800/60',
    dotColor: 'bg-purple-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-purple-500 dark:border-l-purple-400',
    desc: 'Đã quyết toán 100% dòng tiền & xong show',
  },
  da_huy: {
    label: 'Đã hủy',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    textColor: 'text-rose-800 dark:text-rose-300',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
    dotColor: 'bg-rose-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-rose-500 dark:border-l-rose-500',
    desc: 'Lịch chụp đã hủy bỏ',
  },
};

export const STATUS_OPTIONS: { value: BookingStatus; label: string; dotColor: string }[] = [
  { value: 'lead', label: 'Mới hỏi', dotColor: 'bg-amber-500' },
  { value: 'deposited', label: 'Đã cọc', dotColor: 'bg-emerald-500' },
  { value: 'shot', label: 'Đã chụp', dotColor: 'bg-blue-500' },
  { value: 'editing', label: 'Đang sửa', dotColor: 'bg-indigo-500' },
  { value: 'done', label: 'Hoàn tất', dotColor: 'bg-purple-500' },
];

export const BookingStatusSelect: React.FC<Props> = ({
  status,
  onChange,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.lead || STATUS_CONFIG.cho_coc;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleSelectOption = (newStatus: BookingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${size === 'sm' ? 'min-w-[105px]' : 'min-w-[125px]'}`}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Trigger Button hiển thị chuẩn: Chấm tròn CSS + Tên trạng thái + Mũi tên */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`w-full inline-flex items-center justify-between gap-1.5 rounded-lg font-bold border transition-all shadow-xs cursor-pointer select-none ${
          size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } ${current.badgeBg} ${current.textColor} ${current.borderColor} bg-white dark:bg-zinc-900 hover:opacity-90`}
        title="Bấm để đổi trạng thái lịch chụp"
      >
        <span className="inline-flex items-center min-w-0">
          <span className={`w-2 h-2 rounded-full inline-block mr-2 flex-shrink-0 ${current.dotColor}`} />
          <span className="truncate">{current.label}</span>
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 dark:text-zinc-500 flex-shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Danh sách xổ xuống chuẩn Midnight Obsidian & Light SaaS: Đồng bộ 100% chấm tròn CSS */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[130px] w-full z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-1 space-y-0.5 animate-fadeIn">
          {STATUS_OPTIONS.map(opt => {
            const isSelected = opt.value === status;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={e => handleSelectOption(opt.value, e)}
                className={`w-full flex items-center px-2 py-1.5 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 font-bold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium'
                }`}
              >
                <span className={`w-2 h-2 rounded-full inline-block mr-2 flex-shrink-0 ${opt.dotColor}`} />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Native <select> ẩn để hỗ trợ accessibility / form semantics mà tuyệt đối không có emoji */}
      <select
        value={status}
        onChange={e => onChange(e.target.value as BookingStatus)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="lead">Mới hỏi</option>
        <option value="deposited">Đã cọc</option>
        <option value="shot">Đã chụp</option>
        <option value="editing">Đang sửa</option>
        <option value="done">Hoàn tất</option>
        <option value="cancelled">Đã hủy</option>
      </select>
    </div>
  );
};
