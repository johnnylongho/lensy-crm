import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Trash2,
  ExternalLink,
  Edit,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  QrCode,
  FileText,
  DollarSign,
} from 'lucide-react';
import { CalendarEvent, BookingStatus } from '../../types';
import { formatVND } from '../../utils/finance';
import { STATUS_CONFIG } from './BookingStatusSelect';

interface ShowsTableViewProps {
  events: CalendarEvent[];
  onSelectBooking: (event: CalendarEvent) => void;
  onOpenQuote: (eventId: string) => void;
  onOpenVietQR: (event: CalendarEvent) => void;
  onDeleteBooking?: (event: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => Promise<void>;
}

export const ShowsTableView: React.FC<ShowsTableViewProps> = ({
  events,
  onSelectBooking,
  onOpenQuote,
  onOpenVietQR,
  onDeleteBooking,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.status === 'cancelled' || (e.status as any) === 'da_huy') return false;

      const code = (e.quoteToken || e.id.slice(0, 6)).toLowerCase();
      const matchSearch =
        e.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.clientPhone || '').includes(searchTerm) ||
        code.includes(searchTerm.toLowerCase()) ||
        (e.sessionTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.sessionType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        e.status === statusFilter ||
        (statusFilter === 'cho_coc' && ((e.status as any) === 'lead' || e.status === 'cho_coc')) ||
        (statusFilter === 'da_chot' && ((e.status as any) === 'deposited' || e.status === 'da_chot'));

      return matchSearch && matchStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const getStatusBadge = (status: BookingStatus) => {
    const st = String(status);
    if (st === 'cho_coc' || st === 'cho_xac_nhan_coc' || st === 'lead') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {st === 'cho_xac_nhan_coc' ? 'Chờ duyệt cọc' : 'Chờ cọc'}
        </span>
      );
    }
    if (st === 'da_chot' || st === 'deposited' || st === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Đã cọc / Khóa lịch
        </span>
      );
    }
    if (st === 'shot' || st === 'da_chup') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Đã chụp
        </span>
      );
    }
    if (st === 'editing' || st === 'da_tra_file' || st === 'dang_chinh_sua') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Đang hậu kỳ
        </span>
      );
    }
    if (st === 'done' || st === 'hoan_thanh' || st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-zinc-300 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Hoàn tất
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, mã hợp đồng, gói chụp..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-bold text-slate-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái ({events.length})</option>
            <option value="cho_coc">Chờ cọc</option>
            <option value="da_chot">Đã cọc / Khóa lịch</option>
            <option value="da_chup">Đã chụp</option>
            <option value="dang_chinh_sua">Đang hậu kỳ</option>
            <option value="da_hoan_thanh">Đã hoàn tất</option>
          </select>
        </div>
      </div>

      {/* Shows Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-zinc-800 text-[11px] font-extrabold uppercase text-slate-400 bg-slate-50/50 dark:bg-zinc-800/30">
              <th className="py-3 px-4">MÃ & KHÁCH HÀNG</th>
              <th className="py-3 px-4">GÓI DỊCH VỤ</th>
              <th className="py-3 px-4">THỜI GIAN & ĐỊA ĐIỂM</th>
              <th className="py-3 px-4 text-right">GIÁ TRỊ SHOW</th>
              <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
              <th className="py-3 px-4 text-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  Không tìm thấy lịch chụp nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredEvents.map(event => {
                const code = (event.quoteToken || event.id.slice(0, 6)).toUpperCase();
                return (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition cursor-pointer group"
                    onClick={() => onSelectBooking(event)}
                  >
                    {/* Client & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition flex items-center gap-1.5">
                          <span>{event.clientName}</span>
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
                            #{code}
                          </span>
                          {event.clientPhone && (
                            <span className="text-[11px] text-slate-400">
                              {event.clientPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Package */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300">
                      <div className="font-semibold text-xs">
                        {event.sessionTitle || `Gói Chụp ${event.sessionType?.toUpperCase()}`}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {event.category || event.sessionType}
                      </div>
                    </td>

                    {/* Date, Time & Location */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-xs">
                        <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{event.eventDate} ({event.startTime || '08:00'} - {event.endTime || '12:00'})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {event.location || 'Tại Studio'}
                      </div>
                    </td>

                    {/* Price & Paid */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold font-sans text-slate-900 dark:text-white tabular-nums">
                        {formatVND(event.packagePrice)}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                        Đã thu: {formatVND(event.paidAmount || event.depositAmount || 0)}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(event.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* VietQR Quick Deposit Button */}
                        <button
                          onClick={() => onOpenVietQR(event)}
                          title="Mở mã VietQR thu cọc tức thì"
                          className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-900 text-orange-600 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* View Quote Page */}
                        <button
                          onClick={() => onOpenQuote(event.id)}
                          title="Xem bản báo giá công khai"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        {onDeleteBooking && (
                          <button
                            onClick={() => onDeleteBooking(event)}
                            title="Xóa lịch chụp"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

