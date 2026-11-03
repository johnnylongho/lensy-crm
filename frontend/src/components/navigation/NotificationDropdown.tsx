import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  FolderOpen,
  DollarSign,
  Users,
  Check,
  Send,
  ExternalLink,
  Bot,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { getTelegramConfig } from '../../lib/telegramNotifier';
import { useWorkspace } from '../../context/WorkspaceContext';

export interface AppNotification {
  id: string;
  type: 'urgent' | 'schedule' | 'finance' | 'system';
  title: string;
  message: string;
  timeAgo: string;
  dateKey?: string;
  bookingId?: string;
  actionUrl?: string;
  isRead: boolean;
}

interface Props {
  events?: CalendarEvent[];
  onOpenBookingDetail?: (bookingId: string) => void;
}

export const NotificationDropdown: React.FC<Props> = ({ events: propEvents, onOpenBookingDetail }) => {
  const navigate = useNavigate();
  const { currentStudio } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'schedule' | 'finance'>('all');
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lensy_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy danh sách booking từ props hoặc cache
  const bookings: CalendarEvent[] = useMemo(() => {
    if (propEvents && propEvents.length > 0) return propEvents;
    try {
      const cached = localStorage.getItem('lensy_cached_bookings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }, [propEvents]);

  // Quét và sinh danh sách thông báo thông minh từ tình trạng Studio thực tế
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().substring(0, 10);

    // 1. Quét show hôm nay
    const todayShoots = bookings.filter(b => b.eventDate === todayStr && b.status !== 'cancelled' && b.status !== 'da_huy');
    if (todayShoots.length > 0) {
      list.push({
        id: `today-shoots-${todayStr}`,
        type: 'schedule',
        title: `Hôm nay có ${todayShoots.length} show chụp!`,
        message: todayShoots.map(s => `${s.clientName} (${s.startTime || '08:00'})`).join(', '),
        timeAgo: 'Hôm nay',
        actionUrl: '/dashboard',
        isRead: readIds.includes(`today-shoots-${todayStr}`),
      });
    }

    // 2. Quét show ngày mai để chuẩn bị máy
    const tomorrowShoots = bookings.filter(b => b.eventDate === tomorrowStr && b.status !== 'cancelled' && b.status !== 'da_huy');
    if (tomorrowShoots.length > 0) {
      list.push({
        id: `tomorrow-shoots-${tomorrowStr}`,
        type: 'schedule',
        title: `Ngày mai có ${tomorrowShoots.length} lịch bấm máy`,
        message: `Khách: ${tomorrowShoots.map(s => s.clientName).join(', ')}. Kiểm tra sạc pin & thiết bị!`,
        timeAgo: 'Ngày mai',
        actionUrl: '/dashboard',
        isRead: readIds.includes(`tomorrow-shoots-${tomorrowStr}`),
      });
    }

    // 3. Khách hàng đã khóa phiên chọn ảnh (Proofing Locked) - Cần retouch ngay
    bookings.forEach(b => {
      if (b.proofing_session?.is_locked) {
        const id = `proofing-locked-${b.id}`;
        list.push({
          id,
          type: 'urgent',
          title: `Khách "${b.clientName}" đã chốt chọn ảnh!`,
          message: `Đã chọn ${b.proofing_session.items?.length || 0} ảnh. Sẵn sàng cho khâu hậu kỳ màu sắc.`,
          timeAgo: 'Cần xử lý',
          bookingId: b.id,
          actionUrl: '/dashboard',
          isRead: readIds.includes(id),
        });
      }
    });

    // 4. Show đã chụp xong cần trả file hoặc quá hạn bàn giao
    bookings.forEach(b => {
      if ((b.status === 'shot' || b.status === 'editing') && !b.drive_delivery_link) {
        const eventDateObj = new Date(b.eventDate);
        const diffDays = Math.floor((today.getTime() - eventDateObj.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) {
          const id = `delivery-pending-${b.id}`;
          list.push({
            id,
            type: 'urgent',
            title: `Show "${b.clientName}" chưa bàn giao ảnh!`,
            message: `Đã chụp cách đây ${diffDays} ngày. Vui lòng cập nhật link Google Drive/Pixieset.`,
            timeAgo: `${diffDays} ngày trước`,
            bookingId: b.id,
            actionUrl: '/dashboard',
            isRead: readIds.includes(id),
          });
        }
      }
    });

    // 5. Khách hàng còn nợ tiền sau khi trả ảnh
    const debtShoots = bookings.filter(b => {
      const pkg = Number(b.packagePrice || 0);
      const paid = Number(b.paidAmount || b.depositAmount || 0);
      return (b.status === 'da_tra_file' || b.status === 'done' || b.status === 'hoan_thanh') && pkg > paid;
    });

    if (debtShoots.length > 0) {
      const totalDebt = debtShoots.reduce((acc, s) => acc + (Number(s.packagePrice || 0) - Number(s.paidAmount || s.depositAmount || 0)), 0);
      const id = `client-debt-batch-${todayStr}`;
      list.push({
        id,
        type: 'finance',
        title: `${debtShoots.length} khách chưa quyết toán công nợ`,
        message: `Tổng số tiền chưa thu: ${totalDebt.toLocaleString('vi-VN')} đ. Nhấn gửi Zalo nhắc nợ 1-chạm.`,
        timeAgo: 'Tài chính',
        actionUrl: '/dashboard',
        isRead: readIds.includes(id),
      });
    }

    // 6. Thù lao ê-kíp chưa thanh toán
    let unpaidCrewCount = 0;
    let unpaidCrewTotal = 0;
    bookings.forEach(b => {
      if (Array.isArray(b.crew_assignments)) {
        b.crew_assignments.forEach(c => {
          if (!c.is_paid) {
            unpaidCrewCount++;
            const fee = c.fee_type === 'percent'
              ? Math.round((Number(b.packagePrice || 0) * Number(c.fee || 0)) / 100)
              : Number(c.fee || 0);
            unpaidCrewTotal += fee;
          }
        });
      }
    });

    if (unpaidCrewCount > 0) {
      const id = `unpaid-crew-batch-${todayStr}`;
      list.push({
        id,
        type: 'finance',
        title: `${unpaidCrewCount} khoản thù lao ê-kíp chưa trả`,
        message: `Tổng ${unpaidCrewTotal.toLocaleString('vi-VN')} đ đang chờ quyết toán cho thợ/makeup.`,
        timeAgo: 'Bảng lương',
        actionUrl: '/dashboard/payroll',
        isRead: readIds.includes(id),
      });
    }

    // 7. Cảnh báo cấu hình Telegram Bot
    const telegramConfig = getTelegramConfig(currentStudio?.id);
    if (!telegramConfig.isEnabled || !telegramConfig.botToken.trim()) {
      const id = 'telegram-bot-setup-reminder';
      list.push({
        id,
        type: 'system',
        title: 'Kích hoạt Telegram Bot miễn phí',
        message: 'Kết nối Telegram Bot để nhận thông báo cọc tiền & lịch mới tức thì về điện thoại.',
        timeAgo: 'Gợi ý',
        actionUrl: '/dashboard/studio-settings?tab=integrations',
        isRead: readIds.includes(id),
      });
    }

    return list;
  }, [bookings, readIds, currentStudio?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('lensy_read_notifications', JSON.stringify(allIds));
    } catch (e) {}
  };

  const handleNotificationClick = (item: AppNotification) => {
    // Đánh dấu đã đọc
    if (!readIds.includes(item.id)) {
      const newRead = [...readIds, item.id];
      setReadIds(newRead);
      try {
        localStorage.setItem('lensy_read_notifications', JSON.stringify(newRead));
      } catch (e) {}
    }

    setIsOpen(false);

    if (item.bookingId && onOpenBookingDetail) {
      onOpenBookingDetail(item.bookingId);
    } else if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'schedule':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'finance':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'system':
        return <Bot className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl text-gray-600 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 hover:border-orange-500/30 transition-all cursor-pointer shadow-2xs"
        title="Trung tâm thông báo"
      >
        <Bell className="h-4 w-4 stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-16 right-4 left-4 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 w-auto sm:w-96 rounded-2xl bg-white dark:bg-zinc-950/95 backdrop-blur-2xl border border-gray-200 dark:border-white/10 shadow-[0_12px_40px_0_rgba(0,0,0,0.45)] z-50 text-xs overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-xs">Trung Tâm Thông Báo</h4>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                  {unreadCount > 0 ? `${unreadCount} thông báo cần chú ý` : 'Đã xem hết thông báo'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Đã đọc hết</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-2 border-b border-gray-100 dark:border-zinc-800/60 overflow-x-auto text-[10px] font-semibold bg-white dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-white font-bold'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'urgent'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900'
              }`}
            >
              Khẩn cấp
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('schedule')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'schedule'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900'
              }`}
            >
              Lịch chụp
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('finance')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'finance'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900'
              }`}
            >
              Tài chính
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                <p className="font-semibold text-gray-700 dark:text-zinc-300 text-xs">Mọi thứ đều ổn!</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Không có sự kiện hoặc công nợ nào tồn đọng cần xử lý.
                </p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 hover:bg-orange-50/50 dark:hover:bg-zinc-900/70 ${
                    item.isRead ? 'opacity-65' : 'bg-orange-500/5 font-medium'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800/80 flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="font-bold text-gray-900 dark:text-zinc-100 text-xs truncate">
                        {item.title}
                      </h5>
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 dark:border-zinc-800/60 bg-gray-50/60 dark:bg-zinc-900/40 flex items-center justify-between text-[10px]">
            <span className="text-gray-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Lensy Real-time Scanner</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/dashboard/studio-settings?tab=integrations')}
              className="text-orange-600 dark:text-orange-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Cài đặt Bot</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
