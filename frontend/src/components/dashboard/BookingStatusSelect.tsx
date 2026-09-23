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
    desc: string;
  }
> = {
  cho_coc: {
    label: 'Chờ cọc',
    badgeBg: 'bg-amber-500/20',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
    cardBg: 'bg-amber-950/25',
    cardBorder: 'border-amber-500/40 hover:border-amber-400',
    desc: 'Đã gửi link báo giá, chờ khách chuyển khoản',
  },
  cho_xac_nhan_coc: {
    label: 'Chờ duyệt bill',
    badgeBg: 'bg-orange-500/20',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    dotColor: 'bg-orange-400',
    cardBg: 'bg-orange-950/30',
    cardBorder: 'border-orange-500/50 hover:border-orange-400',
    desc: 'Khách đã gửi ảnh bill cọc, đang chờ studio duyệt',
  },
  da_chot: {
    label: 'Đã nhận cọc',
    badgeBg: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    cardBg: 'bg-emerald-950/25',
    cardBorder: 'border-emerald-500/40 hover:border-emerald-400',
    desc: 'Đã thu cọc 30%, lịch chụp đã được khóa',
  },
  da_tra_file: {
    label: 'Đã trả file',
    badgeBg: 'bg-sky-500/20',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-500/40',
    dotColor: 'bg-sky-400',
    cardBg: 'bg-sky-950/25',
    cardBorder: 'border-sky-500/40 hover:border-sky-400',
    desc: 'Đã giao ảnh Drive, chờ thu số tiền nợ đọng',
  },
  hoan_thanh: {
    label: 'Hoàn thành',
    badgeBg: 'bg-purple-500/20',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/40',
    dotColor: 'bg-purple-400',
    cardBg: 'bg-purple-950/20',
    cardBorder: 'border-purple-500/30 hover:border-purple-400',
    desc: 'Đã quyết toán 100% dòng tiền & xong show',
  },
  da_huy: {
    label: 'Đã hủy',
    badgeBg: 'bg-rose-500/20',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/40',
    dotColor: 'bg-rose-400',
    cardBg: 'bg-rose-950/20',
    cardBorder: 'border-rose-500/30 hover:border-rose-400',
    desc: 'Lịch chụp đã hủy bỏ',
  },
};

export const BookingStatusSelect: React.FC<Props> = ({
  status,
  onChange,
  size = 'md',
}) => {
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.cho_coc;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={status}
        onChange={e => onChange(e.target.value as BookingStatus)}
        className={`appearance-none cursor-pointer pl-6 pr-6 rounded-lg font-bold border transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-400 ${
          size === 'sm' ? 'py-1 text-[10px]' : 'py-1.5 text-xs'
        } ${current.badgeBg} ${current.textColor} ${current.borderColor} bg-slate-900`}
        title="Bấm để đổi trạng thái lịch chụp"
      >
        <option value="cho_coc" className="bg-slate-900 text-amber-300 font-semibold py-1">
          🟡 Chờ cọc
        </option>
        <option value="da_chot" className="bg-slate-900 text-emerald-300 font-semibold py-1">
          🟢 Đã nhận cọc (Tự tính 30%)
        </option>
        <option value="da_tra_file" className="bg-slate-900 text-sky-300 font-semibold py-1">
          🔵 Đã trả file (Chờ thanh toán)
        </option>
        <option value="hoan_thanh" className="bg-slate-900 text-purple-300 font-semibold py-1">
          🟣 Hoàn thành (Đã thanh toán đủ)
        </option>
      </select>

      {/* Status Dot Indicator */}
      <span
        className={`absolute left-2 w-2 h-2 rounded-full pointer-events-none ${current.dotColor} shadow-sm animate-pulse`}
      />

      {/* Down arrow icon */}
      <ChevronDown className="absolute right-1.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
};
