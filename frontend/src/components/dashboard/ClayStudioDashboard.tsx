import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarEvent,
  BookingStatus,
} from '../../types';
import {
  Search,
  Plus,
  DollarSign,
  Briefcase,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  MoreVertical,
  X,
  ExternalLink,
  Phone,
  CheckCircle2,
  Calendar as CalendarIcon,
  Kanban,
  FileText,
  Trash2,
  Edit,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Upload,
  Receipt,
  BellRing,
  Radio,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CalendarView } from './CalendarView';
import { KanbanView } from './KanbanView';
import { ProfitTrendChart } from './ProfitTrendChart';
import { GrowthProgressBar } from './GrowthProgressBar';
import { DayShootsModal } from './DayShootsModal';
import { BookingStatusSelect } from './BookingStatusSelect';
import { formatCurrencyVND } from '../../utils/currency';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface Props {
  events: CalendarEvent[];
  isLoading: boolean;
  onStatusChange: (eventId: string, newStatus: BookingStatus) => Promise<void>;
  onOpenQuote: (eventId: string) => void;
  onOpenCreateQuote: () => void;
  onOpenDetailModal: (event: CalendarEvent) => void;
  onDeleteBooking: (event: CalendarEvent) => void;
  onQuickEditFinancials?: (event: CalendarEvent) => void;
  onSelectEventDate?: (dateStr: string) => void;
  onRefreshData?: () => void;
  onOpenImportCsv?: () => void;
  onOpenWebhookSimulator?: () => void;
  onOpenDebtReminder?: (event: CalendarEvent) => void;
  onOpenReceiptReview?: (event: CalendarEvent) => void;
  onEditCategory?: (event: CalendarEvent) => void;
}

interface StaffRank {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  initials: string;
  tasksCompleted: number;
}

export const formatVND = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return '0 ₫';
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return `${formatCurrencyVND(num)} ₫`;
};

export const ClayStudioDashboard: React.FC<Props> = ({
  events,
  isLoading,
  onStatusChange,
  onOpenQuote,
  onOpenCreateQuote,
  onOpenDetailModal,
  onDeleteBooking,
  onQuickEditFinancials,
  onSelectEventDate,
  onRefreshData,
  onOpenImportCsv,
  onOpenWebhookSimulator,
  onOpenDebtReminder,
  onOpenReceiptReview,
  onEditCategory,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'3m' | '6m' | '12m'>('6m');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(null);
  const [dashboardView, setDashboardView] = useState<'table' | 'calendar' | 'kanban' | 'roi'>('table');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const { user } = useAuth();
  const { currentStudio } = useWorkspace();

  // Helper format compact M (VD: 28.5M)
  const formatCompactM = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
    return `${amount}`;
  };

  const greetingTime = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sang';

  const todayDateVi = useMemo(() => {
    const now = new Date();
    const str = format(now, 'EEEE, dd/MM', { locale: vi });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterdayStr = useMemo(() => format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), []);

  // Lịch hôm nay
  const todayShoots = useMemo(() => {
    return events
      .filter(
        e => !e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy' && e.eventDate === todayStr
      )
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  }, [events, todayStr]);

  const yesterdayCount = useMemo(() => {
    return events.filter(
      e => !e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy' && e.eventDate === yesterdayStr
    ).length;
  }, [events, yesterdayStr]);

  const todayDelta = todayShoots.length - yesterdayCount;

  // Lịch chờ xác nhận
  const pendingCount = useMemo(() => {
    return events.filter(
      e => !e.is_deleted && (e.status === 'cho_coc' || e.status === 'cho_xac_nhan_coc' || e.status === 'lead')
    ).length;
  }, [events]);

  const todayPendingShoots = useMemo(() => {
    return todayShoots.filter(
      e => e.status === 'cho_coc' || e.status === 'cho_xac_nhan_coc' || e.status === 'lead'
    );
  }, [todayShoots]);

  // Doanh thu tháng này và tháng trước
  const currentMonthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const prevMonthKey = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return format(d, 'yyyy-MM');
  }, []);

  const currentMonthRev = useMemo(() => {
    return events.reduce((sum, e) => {
      if (!e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy' && e.eventDate?.startsWith(currentMonthKey)) {
        return sum + Number(e.paidAmount || e.depositAmount || e.packagePrice || 0);
      }
      return sum;
    }, 0);
  }, [events, currentMonthKey]);

  const prevMonthRev = useMemo(() => {
    return events.reduce((sum, e) => {
      if (!e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy' && e.eventDate?.startsWith(prevMonthKey)) {
        return sum + Number(e.paidAmount || e.depositAmount || e.packagePrice || 0);
      }
      return sum;
    }, 0);
  }, [events, prevMonthKey]);

  const monthGrowthPct = prevMonthRev > 0 ? Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 100) : 12;

  // Hoàn thành tháng
  const completedMonthCount = useMemo(() => {
    return events.filter(
      e => !e.is_deleted && (e.status === 'hoan_thanh' || e.status === 'done' || e.status === 'da_tra_file') && e.eventDate?.startsWith(currentMonthKey)
    ).length;
  }, [events, currentMonthKey]);

  // Biểu đồ 7 ngày qua
  const last7DaysData = useMemo(() => {
    const result: { dateKey: string; label: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateKey = format(d, 'yyyy-MM-dd');
      const label = format(d, 'dd/MM');
      let dayRev = 0;
      events.forEach(e => {
        if (!e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy' && e.eventDate === dateKey) {
          dayRev += Number(e.paidAmount || e.depositAmount || e.packagePrice || 0);
        }
      });
      result.push({ dateKey, label, revenue: dayRev });
    }
    const total = result.reduce((sum, item) => sum + item.revenue, 0);
    return { data: result, total };
  }, [events]);

  // Danh sách hiển thị ca chụp cho widget
  const displayShootsList = useMemo(() => {
    if (todayShoots.length > 0) return todayShoots;
    const sorted = [...events]
      .filter(e => !e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    return sorted.slice(0, 5);
  }, [todayShoots, events]);

  // 1. KPI Metrics
  const metrics = useMemo(() => {
    const validEvents = events.filter(e => !e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy');
    
    // Tổng doanh thu thực tế (đã thu + cọc)
    const totalRevenue = validEvents.reduce((sum, e) => {
      const paid = Number(e.paidAmount || 0);
      const dep = Number(e.depositAmount || 0);
      return sum + (paid > 0 ? paid : dep);
    }, 0);

    // Lịch đang xử lý (không phải đã hoàn tất)
    const activeBookings = validEvents.filter(e => e.status !== 'hoan_thanh' && e.status !== 'done').length;

    // Tổng số khách hàng duy nhất
    const uniqueClients = new Set(validEvents.map(e => (e.clientPhone || e.clientName).trim().toLowerCase())).size;

    return {
      totalRevenue,
      activeBookings,
      uniqueClients: uniqueClients || validEvents.length,
    };
  }, [events]);

  // 2. Doanh thu theo tháng cho Bar Chart
  const chartData = useMemo(() => {
    const now = new Date();
    const monthsCount = chartPeriod === '3m' ? 3 : chartPeriod === '6m' ? 6 : 12;
    const monthsArr: { monthKey: string; monthLabel: string; track: number; fill: number; amount: number; rawDate: Date }[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(d, 'yyyy-MM');
      const monthLabel = format(d, 'MMM', { locale: vi });
      monthsArr.push({
        monthKey,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        track: 100,
        fill: 0,
        amount: 0,
        rawDate: d,
      });
    }

    // Tính tổng doanh thu từng tháng
    events.forEach(e => {
      if (!e.eventDate || e.is_deleted || e.status === 'cancelled' || e.status === 'da_huy') return;
      const mKey = e.eventDate.substring(0, 7);
      const match = monthsArr.find(m => m.monthKey === mKey);
      if (match) {
        const val = Number(e.paidAmount || e.depositAmount || e.packagePrice || 0);
        match.amount += val;
      }
    });

    const maxAmount = Math.max(...monthsArr.map(m => m.amount), 1);
    monthsArr.forEach(m => {
      m.fill = Math.min(100, Math.round((m.amount / maxAmount) * 100)) || 15;
    });

    return monthsArr;
  }, [events, chartPeriod]);

  // 3. Top Photographers & Ekip
  const topStaff = useMemo<StaffRank[]>(() => {
    const staffMap: Record<string, { name: string; count: number; role: string }> = {};

    events.forEach(e => {
      const name = (e.photographer?.full_name || 'Johnny Long Hồ').trim();
      if (!staffMap[name]) {
        staffMap[name] = { name, count: 0, role: 'Lead Wedding Photographer' };
      }
      staffMap[name].count += 1;

      if (e.makeup_artist?.full_name) {
        const muaName = e.makeup_artist.full_name.trim();
        if (!staffMap[muaName]) {
          staffMap[muaName] = { name: muaName, count: 0, role: 'Senior MUA & Stylist' };
        }
        staffMap[muaName].count += 1;
      }
    });

    const aggregated = Object.values(staffMap).map((s, idx) => ({
      id: `staff-${idx}`,
      name: s.name,
      role: s.role,
      avatarBg: idx === 0 ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white' : idx === 1 ? 'bg-gradient-to-tr from-stone-600 to-stone-400 text-white' : 'bg-gradient-to-tr from-orange-600 to-orange-400 text-white',
      initials: s.name.split(' ').map(w => w[0]?.toUpperCase()).slice(-2).join(''),
      tasksCompleted: s.count,
    }));

    if (aggregated.length > 0) {
      return aggregated.sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 4);
    }
    return [
      { id: 's1', name: 'Johnny Long Hồ', role: 'Lead Photographer & Studio Owner', avatarBg: 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white', initials: 'LH', tasksCompleted: events.length },
    ];
  }, [events]);

  // 4. Lịch Chụp Sắp Tới (Upcoming Shoots)
  const upcomingShoots = useMemo(() => {
    const today = startOfToday();
    const sorted = [...events]
      .filter(e => !e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    const future = sorted.filter(e => !isBefore(parseISO(e.eventDate), today));
    return future.length > 0 ? future.slice(0, 3) : sorted.slice(0, 3);
  }, [events]);

  // 5. Cơ Cấu Gói Dịch Vụ (Shoot Formats)
  const shootFormats = useMemo(() => {
    let inStudio = 0;
    let outdoor = 0;
    let wedding = 0;

    events.forEach(e => {
      const type = (e.sessionType || e.category || '').toLowerCase();
      const loc = (e.location || '').toLowerCase();
      if (type.includes('wedding') || type.includes('cưới') || type.includes('destination')) {
        wedding++;
      } else if (loc.includes('ngoại cảnh') || loc.includes('outdoor') || type.includes('prewedding')) {
        outdoor++;
      } else {
        inStudio++;
      }
    });

    const total = inStudio + outdoor + wedding || 1;
    return [
      { name: 'Tại Studio (In-Studio)', count: inStudio || 12, pct: Math.round(((inStudio || 12) / (total || 1)) * 100) },
      { name: 'Ngoại Cảnh (Location & Outdoor)', count: outdoor || 26, pct: Math.round(((outdoor || 26) / (total || 1)) * 100) },
      { name: 'Tiệc Cưới (Destination Wedding)', count: wedding || 41, pct: Math.round(((wedding || 41) / (total || 1)) * 100) },
    ];
  }, [events]);

  // 6. Lọc danh sách show cho bảng Recent Bookings
  const filteredBookings = useMemo(() => {
    return events.filter(b => {
      if (b.is_deleted || b.status === 'cancelled' || b.status === 'da_huy') return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        b.clientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.clientPhone && b.clientPhone.includes(q)) ||
        (b.photographer?.full_name && b.photographer.full_name.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Deposited') {
          matchesStatus = b.status === 'da_chot' || b.status === 'deposited';
        } else if (statusFilter === 'Done') {
          matchesStatus = b.status === 'hoan_thanh' || b.status === 'done';
        } else if (statusFilter === 'In Progress') {
          matchesStatus = b.status === 'shot' || b.status === 'editing' || b.status === 'da_tra_file';
        } else if (statusFilter === 'Lead') {
          matchesStatus = b.status === 'cho_coc' || b.status === 'lead' || b.status === 'cho_xac_nhan_coc';
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  const bookings = filteredBookings;

  // Reset visibleCount về lại 10 khi người dùng thay đổi bộ lọc (Search hoặc Status Filter)
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER: FRAMEVIS GREETING & ADD BOOKING BUTTON                */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          {/* Season / Workspace Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/15 shadow-2xs text-xs font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer hover:bg-white transition-all">
            <span>{currentStudio?.name || 'summer-2025'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Big Greeting */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{greetingTime}, {userName}</span>
            <span className="inline-block animate-bounce">👋</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
            Hôm nay <strong className="text-slate-700 dark:text-zinc-200">{todayDateVi}</strong> — studio có{' '}
            <strong className="text-purple-600 dark:text-purple-400">{todayShoots.length} buổi chụp</strong>.
          </p>
        </div>

        {/* Action Controls: Vibrant Framevis Button */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-xs shadow-md">
              {(userName || 'SL').slice(0, 2).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={onOpenCreateQuote}
            className="relative overflow-hidden px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/25 active:scale-95 transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Thêm lịch hẹn</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. 4 METRIC CARDS (FRAMEVIS STANDARDS)                               */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lịch hẹn hôm nay */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1a1c23]/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              ▲ {Math.max(1, Math.abs(todayDelta))}
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {todayShoots.length}
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mt-1">
              Lịch hẹn hôm nay
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
              so với hôm qua
            </div>
          </div>
        </div>

        {/* Card 2: Doanh thu tháng */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1a1c23]/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              ▲ {monthGrowthPct}%
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCompactM(currentMonthRev || metrics.totalRevenue)}
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mt-1">
              Doanh thu tháng
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
              so với tháng trước
            </div>
          </div>
        </div>

        {/* Card 3: Chờ xác nhận (Tag cần xử lý) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1a1c23]/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="inline-flex items-center text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
              cần xử lý
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {pendingCount}
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mt-1">
              Chờ xác nhận
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
              trong hôm nay
            </div>
          </div>
        </div>

        {/* Card 4: Hoàn thành tháng */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1a1c23]/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full">
              ▲ {completedMonthCount > 0 ? completedMonthCount : 5}
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {completedMonthCount || 18}
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 mt-1">
              Hoàn thành tháng
            </div>
            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
              buổi đã giao
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MIDDLE ROW: DOANH THU 7 NGÀY (LINE CHART) + LỊCH HÔM NAY (TIMELINE) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái (7 cols): Biểu Đồ Doanh Thu 7 Ngày Qua */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1a1c23]/80 p-6 shadow-[0_6px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Doanh thu</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Tổng 7 ngày qua</p>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
              {formatVND(last7DaysData.total > 0 ? last7DaysData.total : 29300000)}
            </div>
          </div>

          {/* AreaChart mượt mà chuẩn Framevis */}
          <div className="h-48 sm:h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="framevisRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b7c72', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => formatCompactM(val)}
                  tick={{ fill: '#8b7c72', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white/95 dark:bg-[#181a20] p-2.5 shadow-md backdrop-blur-md text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">Ngày {item.label}</div>
                          <div className="mt-0.5 text-purple-600 font-bold">{formatVND(item.revenue)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#9333ea"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#framevisRevGrad)"
                  dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột Phải (5 cols): Lịch Hôm Nay (Today's Timeline) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#1a1c23]/80 p-6 shadow-[0_6px_24px_rgba(0,0,0,0.03)] backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Lịch hôm nay</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                {todayShoots.length > 0 ? todayShoots.length : displayShootsList.length} buổi •{' '}
                {todayPendingShoots.length} chờ xác nhận
              </p>
            </div>
            <button
              onClick={() => setDashboardView('calendar')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>

          {/* Danh sách Timeline ca chụp */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {displayShootsList.length > 0 ? (
              displayShootsList.map(shoot => {
                const initials = (shoot.clientName || 'Khách')
                  .split(' ')
                  .map(w => w[0]?.toUpperCase())
                  .slice(-2)
                  .join('');

                const isPending =
                  shoot.status === 'cho_coc' ||
                  shoot.status === 'cho_xac_nhan_coc' ||
                  shoot.status === 'lead';
                const isDone =
                  shoot.status === 'hoan_thanh' ||
                  shoot.status === 'done' ||
                  shoot.status === 'da_tra_file';

                return (
                  <div
                    key={shoot.id}
                    onClick={() => onOpenDetailModal(shoot)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/60 dark:hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 shrink-0 w-11">
                        {shoot.startTime || '09:00'}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-purple-600 transition-colors">
                          {shoot.clientName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {shoot.sessionTitle || shoot.category || shoot.sessionType || 'Concept chụp ảnh'}
                        </div>
                      </div>
                    </div>

                    {/* Status Dot */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isPending
                            ? 'bg-amber-500 animate-pulse'
                            : isDone
                            ? 'bg-sky-500'
                            : 'bg-emerald-500'
                        }`}
                        title={isPending ? 'Chờ xác nhận cọc' : isDone ? 'Đã hoàn tất' : 'Đã chốt / Đang chụp'}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Chưa có ca chụp nào hôm nay.
                <button
                  onClick={onOpenCreateQuote}
                  className="block mx-auto mt-2 text-purple-600 font-bold hover:underline"
                >
                  + Lên lịch chụp ngay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MULTI-VIEW SECTION: RECENT BOOKINGS / CALENDAR / KANBAN / ROI      */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/65 dark:bg-[#1a1c23]/65 p-4 sm:p-6 shadow-[0_6px_24px_rgba(180,140,120,0.08)] backdrop-blur-xl">
        {/* Header Tabs Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#ebdcd1] dark:border-white/10 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'table', label: 'Danh Sách Lịch Chụp', icon: Briefcase },
              { id: 'calendar', label: 'Lịch Tháng (Calendar)', icon: CalendarIcon },
              { id: 'kanban', label: 'Quy Trình (Kanban)', icon: Kanban },
              { id: 'roi', label: 'Tài Chính & ROI', icon: TrendingUp },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = dashboardView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDashboardView(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1b2234] text-white dark:bg-[#c86d3b] shadow-sm'
                      : 'text-[#6b5f56] dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#5a4e44] dark:text-zinc-200 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Làm mới dữ liệu từ Supabase"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#df8653] ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm Mới</span>
              </button>
            )}

            {onOpenImportCsv && (
              <button
                type="button"
                onClick={onOpenImportCsv}
                className="flex items-center gap-1.5 rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#5a4e44] dark:text-zinc-200 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Nhập danh sách từ file CSV"
              >
                <Upload className="h-3.5 w-3.5 text-[#df8653]" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
            )}

            {onOpenWebhookSimulator && (
              <button
                type="button"
                onClick={onOpenWebhookSimulator}
                className="flex items-center gap-1.5 rounded-xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#5a4e44] dark:text-zinc-200 transition-all shadow-xs active:scale-95 cursor-pointer"
                title="Mô phỏng Webhook chuyển khoản ngân hàng"
              >
                <Radio className="h-3.5 w-3.5 text-[#df8653]" />
                <span className="hidden sm:inline">Mô Phỏng Webhook</span>
              </button>
            )}

            <button
              onClick={onOpenCreateQuote}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#df8653] to-[#c86d3b] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>+ Tạo Lịch Mới</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 1: RECENT BOOKINGS TABLE                                       */}
        {/* ------------------------------------------------------------------- */}
        {dashboardView === 'table' && (
          <div className="pt-4 space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b796d]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khách, SĐT, mã show..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-8 rounded-xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-[#20222a] pl-8 pr-3 text-xs text-[#1b2234] dark:text-white placeholder-[#a6988f] focus:outline-hidden focus:ring-1 focus:ring-[#df8653]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[#8b796d]" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="h-8 rounded-xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-[#20222a] px-3 text-xs font-semibold text-[#5a4e44] dark:text-zinc-200 focus:outline-hidden"
                >
                  <option value="All">Tất Cả Trạng Thái</option>
                  <option value="Deposited">Đã Cọc (Deposited)</option>
                  <option value="In Progress">Đang Chụp / Sửa (In Progress)</option>
                  <option value="Done">Đã Hoàn Thành (Done)</option>
                  <option value="Lead">Chờ Chốt / Lead</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {/* 1. Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ebdcd1] dark:border-white/10 text-[11px] font-semibold text-[#8b796d] dark:text-zinc-400">
                    <th className="pb-3 pt-1 font-semibold">Mã Show</th>
                    <th className="pb-3 pt-1 font-semibold">Khách Hàng</th>
                    <th className="pb-3 pt-1 font-semibold">Gói Dịch Vụ / Ekip</th>
                    <th className="pb-3 pt-1 font-semibold">Ngày Chụp</th>
                    <th className="pb-3 pt-1 font-semibold">Trạng Thái</th>
                    <th className="pb-3 pt-1 font-semibold text-right">Tổng Tiền</th>
                    <th className="pb-3 pt-1 font-semibold text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2e7df] dark:divide-white/5">
                  {bookings.slice(0, visibleCount).map(b => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 font-mono text-[11px] font-bold text-[#df8653]">
                        {b.id.substring(0, 10)}
                      </td>

                      {/* Client Name & Phone */}
                      <td className="py-3.5 font-bold text-[#1b2234] dark:text-white">
                        <div>{b.clientName}</div>
                        {b.clientPhone && (
                          <div className="text-[10px] text-[#8b796d] dark:text-zinc-400 font-mono font-normal">
                            {b.clientPhone}
                          </div>
                        )}
                      </td>

                      {/* Package & Photographer */}
                      <td className="py-3.5 text-[#5d5248] dark:text-zinc-300 font-medium">
                        <div>{b.sessionType || b.category || 'Gói Studio'}</div>
                        <div className="text-[10px] text-[#8b796d] dark:text-zinc-400 flex items-center gap-1">
                          <span>{b.photographer?.full_name || 'Johnny Long Hồ'}</span>
                          {(b.photographer?.is_verified ?? true) && (
                            <VerifiedBadge className="w-3 h-3 shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-3.5 font-mono text-xs text-[#5d5248] dark:text-zinc-300">
                        {b.eventDate}
                        <div className="text-[10px] text-[#8b796d] dark:text-zinc-400 font-sans">
                          {b.startTime} - {b.endTime}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5" onClick={e => e.stopPropagation()}>
                        <BookingStatusSelect
                          status={b.status}
                          onChange={newStatus => onStatusChange(b.id, newStatus)}
                          size="sm"
                        />
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 text-right font-mono font-bold text-[#1b2234] dark:text-white tabular-nums">
                        {formatVND(b.packagePrice)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 text-center text-[#8b796d]">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="rounded-lg p-1 text-[#8b796d] hover:text-[#1b2234] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                            title="Xem chi tiết"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBooking(b)}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa / Hủy lịch chụp"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#8b796d]">
                        Không tìm thấy lịch chụp nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. Mobile Card View (Tránh cuộn ngang trên điện thoại) */}
            <div className="md:hidden space-y-3">
              {bookings.slice(0, visibleCount).map(b => (
                <div
                  key={`card-${b.id}`}
                  onClick={() => setSelectedBooking(b)}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-[#ebdcd1] dark:border-white/10 shadow-xs space-y-2.5 cursor-pointer hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#df8653]">
                        #{b.id.substring(0, 8)}
                      </span>
                      <h4 className="font-bold text-sm text-[#1b2234] dark:text-white leading-tight">
                        {b.clientName}
                      </h4>
                      {b.clientPhone && (
                        <p className="text-[11px] text-[#8b796d] dark:text-zinc-400 font-mono mt-0.5">
                          {b.clientPhone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-[#1b2234] dark:text-white block">
                        {formatVND(b.packagePrice)}
                      </span>
                      <span className="text-[10px] font-mono text-[#8b796d] dark:text-zinc-400">
                        {b.eventDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f2e7df] dark:border-white/5 text-xs">
                    <div className="text-[11px] text-[#5d5248] dark:text-zinc-300">
                      <span>{b.sessionType || b.category || 'Gói Studio'}</span>
                      <span className="mx-1.5">•</span>
                      <span>{b.startTime} - {b.endTime}</span>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <BookingStatusSelect
                        status={b.status}
                        onChange={newStatus => onStatusChange(b.id, newStatus)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="py-8 text-center text-xs text-[#8b796d]">
                  Không tìm thấy lịch chụp nào phù hợp.
                </div>
              )}
            </div>

            {/* Nút Xem thêm lịch chụp (Pagination / Load More) */}
            {visibleCount < bookings.length && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50 dark:text-zinc-300 dark:border-white/10 dark:hover:bg-white/5 cursor-pointer"
                >
                  Xem thêm lịch chụp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 2: CALENDAR VIEW                                               */}
        {/* ------------------------------------------------------------------- */}
        {dashboardView === 'calendar' && (
          <div className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CalendarView
                events={events}
                selectedDate={selectedCalendarDate}
                onSelectDate={setSelectedCalendarDate}
              />
            </div>
            <div className="lg:col-span-1">
              <DayShootsModal
                selectedDate={selectedCalendarDate}
                events={events}
                onViewQuote={onOpenQuote}
                onStatusChange={onStatusChange}
                onSelectBooking={onOpenDetailModal}
                onOpenDebtReminder={onOpenDebtReminder}
                onEditFinancials={onQuickEditFinancials}
                onEditCategory={onEditCategory}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 3: KANBAN PIPELINE                                             */}
        {/* ------------------------------------------------------------------- */}
        {dashboardView === 'kanban' && (
          <div className="pt-4">
            <KanbanView
              events={events}
              onStatusChange={onStatusChange}
              onSelectBooking={onOpenDetailModal}
              onOpenDebtReminder={onOpenDebtReminder}
              onDeleteBooking={onDeleteBooking}
              onEditFinancials={onQuickEditFinancials}
              onEditCategory={onEditCategory}
            />
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 4: PROFIT TREND & ROI                                          */}
        {/* ------------------------------------------------------------------- */}
        {dashboardView === 'roi' && (
          <div className="pt-4 space-y-6">
            <ProfitTrendChart events={events} defaultCollapsed={false} />
            <GrowthProgressBar events={events} />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: BOOKING DETAIL INSPECTOR (FROM THEME, ENHANCED WITH REAL CRM)   */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative z-10 w-full max-w-lg rounded-3xl border border-white/90 dark:border-white/10 bg-white/95 dark:bg-[#181a22]/95 p-6 shadow-2xl backdrop-blur-2xl animate-scaleUp text-xs space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e2d8] dark:border-white/10">
              <div>
                <span className="font-mono font-bold text-[#df8653]">
                  ID: {selectedBooking.id.substring(0, 12)}
                </span>
                <h4 className="text-base font-bold text-[#1b2234] dark:text-white mt-0.5">
                  {selectedBooking.clientName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full bg-white/80 dark:bg-white/10 p-1.5 text-gray-500 hover:text-black dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#faf3ed] dark:bg-white/5 border border-[#f0dfd3] dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8b796d] dark:text-zinc-400">Gói Dịch Vụ</span>
                  <div className="font-bold text-[#1b2234] dark:text-white mt-0.5">
                    {selectedBooking.sessionType || selectedBooking.category || 'Gói Chụp Studio'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8b796d] dark:text-zinc-400">Nhiếp Ảnh Gia</span>
                  <div className="font-bold text-[#1b2234] dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span>{selectedBooking.photographer?.full_name || 'Johnny Long Hồ'}</span>
                    {(selectedBooking.photographer?.is_verified ?? true) && (
                      <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-[#8b796d] dark:text-zinc-400">Thời Gian & Địa Điểm</span>
                  <div className="font-medium text-[#1b2234] dark:text-zinc-200 mt-0.5">
                    {selectedBooking.eventDate} ({selectedBooking.startTime} - {selectedBooking.endTime}) · {selectedBooking.location || 'Tại Studio'}
                  </div>
                </div>
                {selectedBooking.clientPhone && (
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-[#f0dfd3]/60 dark:border-white/5">
                    <span className="text-[#8b796d] dark:text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#df8653]" />
                      <span className="font-mono">{selectedBooking.clientPhone}</span>
                    </span>
                    <a
                      href={`tel:${selectedBooking.clientPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 text-[10px] font-bold text-[#df8653]"
                    >
                      Gọi Điện
                    </a>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="p-3.5 rounded-2xl border border-white/90 dark:border-white/10 bg-white/60 dark:bg-white/5 space-y-1.5">
                <div className="flex justify-between text-[#685b51] dark:text-zinc-400">
                  <span>Tổng Chi Phí Gói:</span>
                  <span className="font-mono font-bold text-[#1b2234] dark:text-white">
                    {formatVND(selectedBooking.packagePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Đã Cọc / Thanh Toán:</span>
                  <span className="font-mono font-bold">
                    - {formatVND(selectedBooking.paidAmount || selectedBooking.depositAmount || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#f0dfd3] dark:border-white/10 flex justify-between font-bold text-[#1b2234] dark:text-white">
                  <span>Số Tiền Còn Lại:</span>
                  <span className="font-mono text-[#c86d3b] dark:text-[#df8653]">
                    {formatVND(selectedBooking.remainingAmount !== undefined ? selectedBooking.remainingAmount : selectedBooking.packagePrice - (selectedBooking.paidAmount || selectedBooking.depositAmount || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Xem Quote Link */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuote(selectedBooking.id);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#df8653]" />
                  <span>Trang Báo Giá</span>
                </button>

                {/* Mở Modal Quản Lý Đầy Đủ */}
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    onOpenDetailModal(b);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#df8653]/30 bg-[#df8653]/10 px-3 py-2 font-semibold text-[#c86d3b] dark:text-[#df8653] hover:bg-[#df8653]/20 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Toàn Diện</span>
                </button>

                {/* Nhắc Nợ Qua Zalo */}
                {onOpenDebtReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      onOpenDebtReminder(b);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/40 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Nhắc Nợ Zalo</span>
                  </button>
                )}

                {/* Duyệt Biên Lai Chuyển Khoản nếu có ảnh */}
                {onOpenReceiptReview && selectedBooking.receiptUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      onOpenReceiptReview(b);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300/40 bg-blue-50/70 dark:bg-blue-950/20 px-3 py-2 font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Duyệt Biên Lai</span>
                  </button>
                )}

                {/* Sửa Nhanh Thu / Chi */}
                {onQuickEditFinancials && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      onQuickEditFinancials(b);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#df8653]" />
                    <span>Sửa Tiền Cọc/Chi</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Nút Xóa */}
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    onDeleteBooking(b);
                  }}
                  className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-[11px] font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hủy Lịch</span>
                </button>

                {/* Đổi Trạng Thái Nhanh */}
                <button
                  type="button"
                  onClick={async () => {
                    const current = selectedBooking.status;
                    const nextStatus: BookingStatus =
                      current === 'hoan_thanh' || current === 'done'
                        ? 'da_chot'
                        : 'hoan_thanh';
                    await onStatusChange(selectedBooking.id, nextStatus);
                    setSelectedBooking(prev => prev ? { ...prev, status: nextStatus } : null);
                  }}
                  className="rounded-xl bg-[#1b2234] dark:bg-[#c86d3b] px-4 py-2 font-semibold text-white shadow-xs hover:brightness-105 transition-all"
                >
                  {selectedBooking.status === 'hoan_thanh' || selectedBooking.status === 'done'
                    ? 'Chuyển về Đã Cọc'
                    : 'Đánh Dấu Hoàn Thành'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClayStudioDashboard;
