import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../../types';
import {
  X,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  Eye,
  Archive,
  Clock,
  Trash2,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  completedBookings: CalendarEvent[];
  onSelectBooking?: (booking: CalendarEvent) => void;
  onDeleteBooking?: (booking: CalendarEvent) => void;
}

export const CompletedShootsHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  completedBookings,
  onSelectBooking,
  onDeleteBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'archived' | 'recent'>('all');

  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return completedBookings.filter(b => {
      // 1. Text search
      const matchesSearch =
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.clientPhone && b.clientPhone.includes(searchTerm)) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.sessionType.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filter mode (archived vs recent)
      const dateTimestamp = b.updated_at
        ? new Date(b.updated_at).getTime()
        : b.eventDate
        ? new Date(b.eventDate).getTime()
        : 0;

      const isRecent = dateTimestamp > 0 && now - dateTimestamp <= SEVEN_DAYS_MS;

      if (filterMode === 'archived') return !isRecent;
      if (filterMode === 'recent') return isRecent;
      return true;
    });
  }, [completedBookings, searchTerm, filterMode, now]);

  // Statistics
  const totalRevenue = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.packagePrice || 0), 0);
  }, [completedBookings]);

  const archivedCount = useMemo(() => {
    return completedBookings.filter(b => {
      const ts = b.updated_at
        ? new Date(b.updated_at).getTime()
        : b.eventDate
        ? new Date(b.eventDate).getTime()
        : 0;
      return ts > 0 && now - ts > SEVEN_DAYS_MS;
    }).length;
  }, [completedBookings, now]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-y-auto animate-scaleUp"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-500/5 via-transparent to-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0 shadow-sm">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Lịch Sử Lịch Chụp Hoàn Tất</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  {completedBookings.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ lịch chụp đã hoàn tất & tự động lưu trữ sau 7 ngày để bảng Kanban luôn gọn gàng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên khách, SĐT, loại show, địa điểm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* Filter Mode Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tất cả ({completedBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('archived')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterMode === 'archived'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Lưu trữ (&gt;7 ngày) ({archivedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('recent')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterMode === 'recent'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Gần đây (≤7 ngày) ({completedBookings.length - archivedCount})
              </button>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-mono">
            <span>Hiển thị: <strong className="text-slate-900 dark:text-white">{filteredBookings.length}</strong> kết quả</span>
            <span>Tổng doanh thu hoàn tất: <strong className="text-emerald-600 dark:text-emerald-400">{totalRevenue.toLocaleString('vi-VN')} đ</strong></span>
          </div>
        </div>

        {/* Table / List View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-sm">Không tìm thấy lịch chụp hoàn tất nào</p>
              <p className="text-xs text-slate-500">
                {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Chưa có show chụp nào ở trạng thái Hoàn tất'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBookings.map(b => {
                const updatedTime = b.updated_at
                  ? format(parseISO(b.updated_at), 'dd/MM/yyyy', { locale: vi })
                  : b.eventDate;

                const isArchived = Boolean(
                  b.updated_at && now - new Date(b.updated_at).getTime() > SEVEN_DAYS_MS
                );

                return (
                  <div
                    key={b.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/80 bg-white dark:bg-slate-950/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: Client info & Session badge */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectBooking) {
                              onClose();
                              onSelectBooking(b);
                            }
                          }}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 hover:underline text-left cursor-pointer"
                        >
                          {b.clientName}
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          {b.sessionType}
                        </span>
                        {isArchived ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Đã lưu trữ
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            Hiện trên Kanban
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>Ngày chụp: {b.eventDate}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-500" />
                          <span>Hoàn tất: {updatedTime}</span>
                        </span>
                        {b.location && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{b.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle: Revenue / Financials */}
                    <div className="text-right sm:text-right font-mono flex-shrink-0">
                      <div className="font-bold text-slate-900 dark:text-slate-200 text-xs sm:text-sm">
                        {b.packagePrice.toLocaleString('vi-VN')} đ
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã tất toán 100%</span>
                      </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      {onSelectBooking && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectBooking(b);
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-colors cursor-pointer"
                          title="Xem chi tiết lịch chụp"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteBooking && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteBooking(b);
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hủy / Xóa lịch chụp này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/30">
          <span className="text-slate-500 dark:text-slate-400">
            Các show chụp &gt; 7 ngày được tự động ẩn khỏi bảng Kanban để tối ưu tốc độ & không gian làm việc.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
