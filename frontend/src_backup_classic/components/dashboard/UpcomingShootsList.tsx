import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  MessageSquareQuote, 
  Camera, 
  Trash2, 
  Pencil,
  Search,
  Filter,
  ArrowUpDown,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { CalendarEvent, BookingStatus } from '../../types';
import { BookingStatusSelect, STATUS_CONFIG } from './BookingStatusSelect';
import { generateGoogleCalendarUrl } from '../../lib/calendarIntegration';
import { getCategoryConfig } from '../../utils/categoryConfig';
import { BookingSortOption, sortBookings } from '../../utils/dateSorting';

interface Props {
  events: CalendarEvent[];
  onSelectEventDate: (dateStr: string) => void;
  onSelectBooking?: (booking: CalendarEvent) => void;
  onStatusChange?: (eventId: string, newStatus: BookingStatus) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onOpenReceiptReview?: (booking: CalendarEvent) => void;
  onDeleteBooking?: (booking: CalendarEvent) => void;
  onEditFinancials?: (booking: CalendarEvent) => void;
  onEditCategory?: (booking: CalendarEvent) => void;
}

const DEFAULT_PAGE_SIZE = 10;

export const UpcomingShootsList: React.FC<Props> = ({
  events,
  onSelectEventDate,
  onSelectBooking,
  onStatusChange,
  onOpenDebtReminder,
  onOpenReceiptReview,
  onDeleteBooking,
  onEditFinancials,
  onEditCategory,
}) => {
  // State điều khiển Toolbar
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<BookingSortOption>('smart');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(DEFAULT_PAGE_SIZE);

  // 1. Lọc và Sắp xếp thông minh danh sách lịch chụp
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...events];

    // Lọc theo trạng thái
    if (statusFilter !== 'all') {
      result = result.filter(ev => {
        if (statusFilter === 'cho_coc') {
          return ev.status === 'cho_coc' || ev.status === 'lead' || ev.status === 'cho_xac_nhan_coc';
        }
        if (statusFilter === 'da_chot') {
          return ev.status === 'da_chot' || ev.status === 'deposited';
        }
        if (statusFilter === 'da_chup') {
          return ev.status === 'shot' || ev.status === 'editing' || ev.status === 'da_tra_file' || (ev.status as string) === 'da_chup';
        }
        if (statusFilter === 'hoan_thanh') {
          return ev.status === 'hoan_thanh' || ev.status === 'done';
        }
        return ev.status === statusFilter;
      });
    }

    // Lọc theo ô tìm kiếm nhanh (Tên khách, SĐT, Địa chỉ, Gói)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(ev => {
        const name = (ev.clientName || '').toLowerCase();
        const phone = (ev.clientPhone || '').toLowerCase();
        const loc = (ev.location || '').toLowerCase();
        const cat = (ev.category || ev.sessionType || '').toLowerCase();
        const pkg = (ev.package_type || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || loc.includes(q) || cat.includes(q) || pkg.includes(q);
      });
    }

    // Sắp xếp theo tùy chọn (Mặc định 'smart': hôm nay & tương lai gần nhất lên đầu, quá khứ đẩy về sau)
    return sortBookings(result, sortOption);
  }, [events, searchQuery, sortOption, statusFilter]);

  // Danh sách hiển thị giới hạn theo trang / load more
  const displayedEvents = useMemo(() => {
    return filteredAndSortedEvents.slice(0, visibleCount);
  }, [filteredAndSortedEvents, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedEvents.length;
  const isFiltered = searchQuery.trim() !== '' || statusFilter !== 'all' || sortOption !== 'smart';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortOption('smart');
    setVisibleCount(DEFAULT_PAGE_SIZE);
  };

  return (
    <div className="w-full max-w-7xl mx-auto rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-6 transition-all duration-300">
      
      {/* HEADER KHU VỰC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/40 dark:border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400 block mb-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Dòng Chảy Lịch Trình & Quản Lý Trạng Thái
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Toàn Bộ Lịch Chụp Sắp Tới
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
              title="Đặt lại các bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          )}
          <span className="text-xs text-slate-600 dark:text-white/60 font-mono px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 shadow-sm">
            {filteredAndSortedEvents.length === events.length ? (
              `${events.length} sự kiện`
            ) : (
              <span>
                <strong className="text-amber-600 dark:text-amber-400">{filteredAndSortedEvents.length}</strong> / {events.length}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* THANH CÔNG CỤ (SORTING & FILTERING TOOLBAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-white/50 dark:border-white/10 backdrop-blur-md shadow-sm">
        
        {/* 1. Ô tìm kiếm nhanh theo Tên khách / SĐT / Gói */}
        <div className="sm:col-span-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-amber-500/40 focus-within:border-amber-500 transition-all shadow-inner">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(DEFAULT_PAGE_SIZE);
            }}
            placeholder="Tìm theo tên khách, SĐT, loại hình..."
            className="w-full bg-transparent border-0 outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 p-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex-shrink-0"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Dropdown Sắp xếp */}
        <div className="sm:col-span-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-amber-500/40 focus-within:border-amber-500 transition-all shadow-inner">
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value as BookingSortOption);
              setVisibleCount(DEFAULT_PAGE_SIZE);
            }}
            className="w-full bg-transparent border-0 outline-none text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer p-0"
            title="Chọn tiêu chí sắp xếp lịch chụp"
          >
            <option value="smart" className="dark:bg-slate-900">📅 Sắp tới gần nhất (Ưu tiên hôm nay)</option>
            <option value="furthest" className="dark:bg-slate-900">🗓️ Ngày xa nhất (Tương lai xa)</option>
            <option value="newest" className="dark:bg-slate-900">✨ Mới được tạo (Gần đây nhất)</option>
            <option value="price_desc" className="dark:bg-slate-900">💎 Giá trị hợp đồng cao nhất</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 pointer-events-none" />
        </div>

        {/* 3. Dropdown Lọc trạng thái */}
        <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-amber-500/40 focus-within:border-amber-500 transition-all shadow-inner">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setVisibleCount(DEFAULT_PAGE_SIZE);
            }}
            className="w-full bg-transparent border-0 outline-none text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer p-0"
            title="Lọc lịch chụp theo trạng thái"
          >
            <option value="all" className="dark:bg-slate-900">Tất cả trạng thái</option>
            <option value="cho_coc" className="dark:bg-slate-900">🟡 Mới hỏi (Lead / Chờ cọc)</option>
            <option value="da_chot" className="dark:bg-slate-900">🔵 Đã cọc (Đã chốt lịch)</option>
            <option value="da_chup" className="dark:bg-slate-900">🟣 Đã chụp / Đang sửa</option>
            <option value="hoan_thanh" className="dark:bg-slate-900">🟢 Hoàn tất (Đã trả file)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 pointer-events-none" />
        </div>

      </div>

      {/* DANH SÁCH LỊCH CHỤP */}
      {displayedEvents.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/60 bg-white/40 dark:bg-white/[0.02] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Inbox className="w-6 h-6 opacity-80" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy lịch chụp nào phù hợp
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại các bộ lọc để xem toàn bộ danh sách lịch chụp.
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc & Hiển thị lại tất cả</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedEvents.map(ev => {
            const statusTheme = STATUS_CONFIG[ev.status] || STATUS_CONFIG.cho_coc;

            // Remaining debt calculation
            const effectiveDeposit =
              ev.status === 'da_chot' && (!ev.depositAmount || ev.depositAmount === 0)
                ? Math.round(ev.packagePrice * 0.3)
                : ev.depositAmount;
            const effectivePaid =
              ev.status === 'hoan_thanh'
                ? ev.packagePrice
                : ev.paidAmount && ev.paidAmount > 0
                ? ev.paidAmount
                : effectiveDeposit;
            const remainingDebt = Math.max(0, ev.packagePrice - effectivePaid);

            const isDebtReminderEligible =
              ev.status === 'da_tra_file' && remainingDebt > 0;

            const isDeposit30 =
              ev.packagePrice > 0 && Math.abs(effectiveDeposit - ev.packagePrice * 0.3) < 1000;

            return (
              <div
                key={ev.id}
                className={`rounded-xl border border-gray-200 dark:border-zinc-800 ${statusTheme.accentBorder || 'border-l-4 border-l-blue-500'} bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full p-5 text-xs`}
              >
                {/* Cột 1 (Ngày tháng): flex-shrink-0 w-16 */}
                <div className="flex-shrink-0 w-16">
                  <button
                    type="button"
                    onClick={() => onSelectEventDate(ev.eventDate)}
                    className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/70 flex flex-col items-center justify-center font-mono text-center hover:border-amber-400 dark:hover:border-amber-400 transition-colors shadow-sm"
                    title="Nhấn để xem trên Lịch ngày này"
                  >
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase leading-none font-semibold">
                      Th{ev.eventDate.split('-')[1]}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-50 leading-tight mt-0.5">
                      {ev.eventDate.split('-')[2]}
                    </span>
                  </button>
                </div>

                {/* Cột 2 (Thông tin Khách hàng & Giờ giấc): flex-1 min-w-[200px] */}
                <div className="flex-1 min-w-[200px] min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectBooking && onSelectBooking(ev)}
                      className="font-semibold text-gray-900 dark:text-gray-50 text-base truncate hover:text-amber-600 dark:hover:text-amber-400 hover:underline text-left transition-colors max-w-full"
                      title="Nhấn để xem chi tiết & Gắn thiết bị"
                    >
                      {ev.clientName}
                    </button>
                    {(() => {
                      const catCfg = getCategoryConfig(ev.category || ev.sessionType);
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditCategory) onEditCategory(ev);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer flex-shrink-0 ${catCfg.color}`}
                          title={`Loại hình: ${catCfg.label}${ev.package_type ? ` - Gói: ${ev.package_type}` : ''} (Nhấn để tùy chỉnh)`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${catCfg.dotColor}`} />
                          <span>{catCfg.label}</span>
                          {ev.package_type && (
                            <span className="opacity-75 font-normal">· {ev.package_type}</span>
                          )}
                        </button>
                      );
                    })()}
                    {ev.assignedGears && ev.assignedGears.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold border bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 flex items-center gap-1 flex-shrink-0">
                        <Camera className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>{ev.assignedGears.length} máy/lens</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400 text-xs">
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <span>{ev.startTime} - {ev.endTime}</span>
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0" title={ev.location}>
                      <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </span>
                  </div>

                  {ev.notes && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs italic">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate">{ev.notes}</span>
                    </div>
                  )}

                  {/* Hiển thị chi phí Job Costing nếu có */}
                  {ev.expenses && ev.expenses > 0 && (
                    <div className="pt-1 flex items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                        Chi phí: {ev.expenses.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 font-semibold">
                        Lãi ròng: {(ev.packagePrice - ev.expenses).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>

                {/* Cột 3 (Tài chính tĩnh): flex-shrink-0 w-64 bg-white/5 p-3 rounded-lg dạng flex justify-between */}
                <div className="flex-shrink-0 w-64 bg-gray-50/80 dark:bg-zinc-800/40 p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800 space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-sans">Tổng gói:</span>
                      {onEditFinancials && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditFinancials(ev);
                          }}
                          className="p-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 transition-all hover:scale-110 cursor-pointer"
                          title="Cập nhật tài chính (Giá trị, Cọc, Ghi chú)"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-50 text-right">
                      {ev.packagePrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-sans">Đã cọc:</span>
                    <span className="font-semibold text-right flex items-center gap-1">
                      <span>{effectiveDeposit.toLocaleString('vi-VN')} đ</span>
                      {isDeposit30 && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 font-sans">
                          30%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-sans">Nợ đọng:</span>
                    <span className={`font-semibold text-right ${remainingDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {remainingDebt === 0 ? '0 đ' : `${remainingDebt.toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>
                </div>

                {/* Cột 4 (Thao tác): flex-shrink-0 flex items-center gap-3 */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {onSelectBooking && (
                    <button
                      type="button"
                      onClick={() => onSelectBooking(ev)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                      title="Xem chi tiết & Quản lý thiết bị cho show này"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Gắn Thiết Bị</span>
                    </button>
                  )}
                  {onStatusChange && (
                    <BookingStatusSelect
                      status={ev.status}
                      onChange={newStatus => onStatusChange(ev.id, newStatus)}
                      size="md"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateGoogleCalendarUrl({
                        title: `[Mirmia] Show Chụp ${ev.sessionType} - ${ev.clientName}`,
                        clientName: ev.clientName,
                        sessionType: ev.sessionType,
                        eventDate: ev.eventDate,
                        startTime: ev.startTime,
                        endTime: ev.endTime,
                        location: ev.location,
                        notes: ev.notes,
                        quoteToken: ev.quoteToken,
                        quoteUrl: `${window.location.origin}/quote/${ev.quoteToken || ''}`,
                      });
                      window.open(url, '_blank');
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0 shadow-sm"
                    title="Đồng bộ show này lên Google Calendar"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectEventDate(ev.eventDate)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0 shadow-sm"
                    title="Xem lịch chi tiết ngày này"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {onDeleteBooking && (
                    <button
                      type="button"
                      onClick={() => onDeleteBooking(ev)}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex-shrink-0 cursor-pointer shadow-sm"
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

      {/* FOOTER: PHÂN TRANG & NÚT XEM THÊM (LOAD MORE) */}
      {filteredAndSortedEvents.length > 0 && (
        <div className="pt-4 border-t border-white/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          {/* Thông tin tiến độ hiển thị */}
          <div className="text-slate-500 dark:text-slate-400 font-mono text-center sm:text-left">
            Đang hiển thị <strong className="text-slate-900 dark:text-white font-bold">{displayedEvents.length}</strong> trên tổng số <strong className="text-slate-900 dark:text-white font-bold">{filteredAndSortedEvents.length}</strong> lịch chụp
          </div>

          {/* Các nút tương tác Load More / Thu gọn */}
          <div className="flex items-center gap-2">
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + DEFAULT_PAGE_SIZE)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
              >
                <span>Xem thêm 10 lịch cũ hơn</span>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="opacity-75 font-mono text-[10px]">
                  (+{filteredAndSortedEvents.length - visibleCount})
                </span>
              </button>
            )}

            {hasMore && filteredAndSortedEvents.length > DEFAULT_PAGE_SIZE * 2 && (
              <button
                type="button"
                onClick={() => setVisibleCount(filteredAndSortedEvents.length)}
                className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                title="Tải tất cả các lịch chụp một lần"
              >
                Xem tất cả ({filteredAndSortedEvents.length})
              </button>
            )}

            {visibleCount > DEFAULT_PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setVisibleCount(DEFAULT_PAGE_SIZE)}
                className="px-3 py-2 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Thu gọn danh sách về 10 sự kiện ban đầu"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Thu gọn</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
