import React from 'react';
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
    dotColor: 'bg-yellow-400',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-yellow-400 dark:border-l-yellow-400',
    desc: 'Khách hàng mới gửi yêu cầu từ link đặt lịch',
  },
  deposited: {
    label: 'Đã cọc',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    dotColor: 'bg-blue-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-blue-500 dark:border-l-blue-500',
    desc: 'Đã thu tiền cọc, lịch chụp đã được khóa chắc chắn',
  },
  shot: {
    label: 'Đã chụp',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    textColor: 'text-cyan-800 dark:text-cyan-300',
    borderColor: 'border-cyan-200 dark:border-cyan-800/60',
    dotColor: 'bg-cyan-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-cyan-500 dark:border-l-cyan-400',
    desc: 'Đã bấm máy xong show, sẵn sàng đưa vào hậu kỳ',
  },
  editing: {
    label: 'Đang sửa ảnh',
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
    label: 'Chờ cọc (Lead)',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    dotColor: 'bg-yellow-400',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-yellow-400 dark:border-l-yellow-400',
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
  da_chot: {
    label: 'Đã nhận cọc',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    dotColor: 'bg-blue-500',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-blue-500 dark:border-l-blue-500',
    desc: 'Đã thu cọc, lịch chụp đã được khóa',
  },
  da_tra_file: {
    label: 'Đã trả file',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    textColor: 'text-indigo-800 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800/60',
    dotColor: 'bg-indigo-400',
    cardBg: 'bg-white dark:bg-zinc-900',
    cardBorder: 'border border-gray-200 dark:border-zinc-800',
    accentBorder: 'border-l-4 border-l-indigo-500 dark:border-l-indigo-400',
    desc: 'Đã giao ảnh Drive, chờ thu số tiền nợ đọng',
  },
  hoan_thanh: {
    label: 'Hoàn thành',
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

export const BookingStatusSelect: React.FC<Props> = ({
  status,
  onChange,
  size = 'md',
}) => {
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.lead || STATUS_CONFIG.cho_coc;

  return (
    <div className={`relative inline-flex items-center ${size === 'sm' ? 'max-w-[110px]' : 'max-w-[140px]'}`}>
      <select
        value={status}
        onChange={e => onChange(e.target.value as BookingStatus)}
        className={`appearance-none cursor-pointer pl-5 pr-5 rounded-lg font-bold border transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400 truncate w-full ${
          size === 'sm' ? 'py-1 text-[10px]' : 'py-1.5 text-xs'
        } ${current.badgeBg} ${current.textColor} ${current.borderColor} bg-white dark:bg-slate-900`}
        title="Bấm để đổi trạng thái lịch chụp"
      >
        <option value="lead" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-semibold py-1">
          🟡 Mới hỏi
        </option>
        <option value="deposited" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-semibold py-1">
          🟢 Đã cọc
        </option>
        <option value="shot" className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-semibold py-1">
          📸 Đã chụp
        </option>
        <option value="editing" className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold py-1">
          🎨 Đang sửa
        </option>
        <option value="done" className="bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 font-semibold py-1">
          🟣 Hoàn tất
        </option>
      </select>

      {/* Status Dot Indicator */}
      <span
        className={`absolute left-1.5 w-1.5 h-1.5 rounded-full pointer-events-none ${current.dotColor} shadow-sm animate-pulse`}
      />

      {/* Down arrow icon */}
      <ChevronDown className="absolute right-1 w-3 h-3 text-gray-400 pointer-events-none" />
    </div>
  );
};
