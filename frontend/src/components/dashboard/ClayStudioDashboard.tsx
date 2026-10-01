import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarView } from './CalendarView';
import { KanbanView } from './KanbanView';
import { ProfitTrendChart } from './ProfitTrendChart';
import { GrowthProgressBar } from './GrowthProgressBar';
import { DayShootsModal } from './DayShootsModal';
import { formatCurrencyVND } from '../../utils/currency';

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
      const name = (e.photographer?.full_name || 'Louis Gutkowski').trim();
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

    const defaultStaff: StaffRank[] = [
      { id: 's1', name: 'Louis Gutkowski', role: 'Lead Wedding Photographer', avatarBg: 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white', initials: 'LG', tasksCompleted: 28 },
      { id: 's2', name: 'Marlene Kuhlman', role: 'Senior Portrait & Fashion', avatarBg: 'bg-gradient-to-tr from-stone-600 to-stone-400 text-white', initials: 'MK', tasksCompleted: 24 },
      { id: 's3', name: 'Kristi Lueilwitz', role: 'Commercial & Editorial', avatarBg: 'bg-gradient-to-tr from-orange-600 to-orange-400 text-white', initials: 'KL', tasksCompleted: 19 },
      { id: 's4', name: 'Abel Pollich', role: 'Head MUA & Stylist', avatarBg: 'bg-gradient-to-tr from-zinc-700 to-zinc-500 text-white', initials: 'AP', tasksCompleted: 16 },
    ];

    const aggregated = Object.values(staffMap).map((s, idx) => ({
      id: `staff-${idx}`,
      name: s.name,
      role: s.role,
      avatarBg: idx === 0 ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white' : idx === 1 ? 'bg-gradient-to-tr from-stone-600 to-stone-400 text-white' : 'bg-gradient-to-tr from-orange-600 to-orange-400 text-white',
      initials: s.name.split(' ').map(w => w[0]?.toUpperCase()).slice(-2).join(''),
      tasksCompleted: s.count,
    }));

    if (aggregated.length >= 2) {
      return aggregated.sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 4);
    }
    return defaultStaff;
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

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. TOP 3 METRIC CARDS (FROSTED GLASS WITH CIRCULAR ICONS)             */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Doanh Thu Tổng */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-[#1a1c23]/60 p-4 shadow-[0_4px_20px_rgba(180,140,120,0.08)] backdrop-blur-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f5d9c7] to-[#faeee5] dark:from-[#3a281c] dark:to-[#221c18] text-[#b86333] dark:text-[#df8653] shadow-xs border border-white/90 dark:border-white/10">
            <DollarSign className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#8b796d] dark:text-zinc-400">
              Tổng Doanh Thu
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-[#1b2234] dark:text-white tabular-nums truncate">
              {formatVND(metrics.totalRevenue)}
            </div>
          </div>
        </div>

        {/* Card 2: Lịch Chụp Đang Chạy */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-[#1a1c23]/60 p-4 shadow-[0_4px_20px_rgba(180,140,120,0.08)] backdrop-blur-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f5d9c7] to-[#faeee5] dark:from-[#3a281c] dark:to-[#221c18] text-[#b86333] dark:text-[#df8653] shadow-xs border border-white/90 dark:border-white/10">
            <Briefcase className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#8b796d] dark:text-zinc-400">
              Lịch Đang Chạy
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-[#1b2234] dark:text-white tabular-nums">
              {metrics.activeBookings} shows
            </div>
          </div>
        </div>

        {/* Card 3: Khách Hàng */}
        <div className="flex items-center gap-4 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-[#1a1c23]/60 p-4 shadow-[0_4px_20px_rgba(180,140,120,0.08)] backdrop-blur-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f5d9c7] to-[#faeee5] dark:from-[#3a281c] dark:to-[#221c18] text-[#b86333] dark:text-[#df8653] shadow-xs border border-white/90 dark:border-white/10">
            <Users className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#8b796d] dark:text-zinc-400">
              Hồ Sơ Khách Hàng
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-[#1b2234] dark:text-white tabular-nums">
              {metrics.uniqueClients} khách
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MIDDLE ROW: REVENUE OVERVIEW CHART + DARK "UPCOMING SHOOTS" COLUMN */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Revenue Overview + Top Photographers */}
        <div className="lg:col-span-8 rounded-3xl border border-white/80 dark:border-white/10 bg-white/65 dark:bg-[#1a1c23]/65 p-6 shadow-[0_6px_24px_rgba(180,140,120,0.09)] backdrop-blur-xl flex flex-col justify-between">
          {/* Top Bar của Chart */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1b2234] dark:text-white">
                Doanh Thu & Tăng Trưởng Studio
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1b2234] dark:text-white tracking-tight tabular-nums">
                  {formatVND(metrics.totalRevenue)}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +14.2%
                </span>
              </div>
            </div>

            {/* Filter pills: 3 tháng / 6 tháng / Cả năm */}
            <div className="flex items-center rounded-xl border border-white/90 dark:border-white/10 bg-white/80 dark:bg-[#20222a] p-1 shadow-xs self-start sm:self-auto">
              {(['3m', '6m', '12m'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    chartPeriod === period
                      ? 'bg-[#1b2234] text-white dark:bg-[#c86d3b] shadow-xs'
                      : 'text-[#6b5f56] dark:text-zinc-400 hover:text-[#1b2234] dark:hover:text-white'
                  }`}
                >
                  {period === '3m' ? '3 Tháng' : period === '6m' ? '6 Tháng' : 'Năm Nay'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Chart & Top Performance */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
            {/* Bar Chart (7 cols) */}
            <div className="md:col-span-7 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8b7c72', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={val => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8b7c72', fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-white/80 bg-white/95 dark:bg-[#181a20] p-2.5 shadow-md backdrop-blur-md text-xs">
                            <div className="font-bold text-[#1b2234] dark:text-white">{d.monthLabel}</div>
                            <div className="mt-1 text-[#c86d3b] font-semibold">{formatVND(d.amount)}</div>
                            <div className="text-[11px] text-[#7d7168] dark:text-zinc-400">Tỷ lệ hoàn thành: {d.fill}%</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Background Track Bar */}
                  <Bar
                    dataKey="track"
                    fill="#ece5df"
                    radius={[10, 10, 10, 10]}
                    barSize={14}
                  />
                  {/* Foreground Fill Bar (Terracotta Copper Gradient) */}
                  <Bar
                    dataKey="fill"
                    fill="#df8653"
                    radius={[10, 10, 10, 10]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Photographers & Ekip Card (5 cols) */}
            <div className="md:col-span-5 rounded-2xl border border-white/80 dark:border-white/10 bg-white/85 dark:bg-[#1e2029]/85 p-4 shadow-[0_4px_16px_rgba(180,140,120,0.06)] backdrop-blur-md">
              <div className="text-xs font-bold text-[#1b2234] dark:text-white mb-3 flex items-center justify-between">
                <span>Top Nhiếp Ảnh Gia & Ekip</span>
                <span className="text-[10px] text-[#c86d3b] font-semibold">Tháng này</span>
              </div>
              <div className="space-y-3">
                {topStaff.map((staff, idx) => (
                  <div key={staff.id} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs ${staff.avatarBg}`}
                      >
                        {staff.initials}
                      </div>
                      <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1b2234] dark:bg-[#c86d3b] text-[9px] font-bold text-white">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#1b2234] dark:text-white truncate">
                        {staff.name}
                      </div>
                      <div className="text-[11px] text-[#85766c] dark:text-zinc-400 truncate">
                        {staff.tasksCompleted} show hoàn thành
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Dark Card ("Upcoming Shoots") + Shoot Formats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dark Card ("Upcoming Shoots") */}
          <div className="relative overflow-hidden rounded-3xl bg-[#1b1c20] p-6 text-white shadow-[0_15px_35px_rgba(20,20,30,0.3)] border border-white/10">
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#df8653]/45 to-transparent blur-2xl" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Lịch Chụp Sắp Tới
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#df8653] bg-[#df8653]/15 px-2 py-0.5 rounded-full border border-[#df8653]/25">
                Studio Bays
              </span>
            </div>

            <div className="space-y-4">
              {upcomingShoots.map(shoot => (
                <div
                  key={shoot.id}
                  onClick={() => setSelectedBooking(shoot)}
                  className="group cursor-pointer rounded-2xl p-2.5 -mx-2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#df8653] shrink-0" />
                      <h4 className="text-xs font-semibold text-white group-hover:text-[#df8653] transition-colors truncate max-w-[190px]">
                        {shoot.clientName}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {shoot.eventDate}
                    </span>
                  </div>
                  <div className="pl-3.5 mt-0.5 text-[11px] text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-[#df8653]" />
                    <span>{shoot.startTime} - {shoot.endTime} · {shoot.location}</span>
                  </div>
                  <div className="pl-3.5 mt-2 flex items-center justify-between">
                    <div className="flex items-center -space-x-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]" title={shoot.photographer?.full_name || 'Thợ ảnh'}>
                        {(shoot.photographer?.full_name || 'LG').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-600 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]" title="MUA">
                        MU
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#df8653] font-bold">
                      {formatVND(shoot.packagePrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shoot Formats / Cơ Cấu Dịch Vụ */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-[#1b2234] dark:text-white">
              Cơ Cấu Gói Dịch Vụ
            </h4>

            {shootFormats.map((fmt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-white/70 dark:border-white/10 bg-gradient-to-r from-white/60 to-white/40 dark:from-[#1c1e27] dark:to-[#161820] p-3.5 backdrop-blur-md shadow-xs"
              >
                <div>
                  <div className="text-[11px] text-[#7d6f65] dark:text-zinc-400">{fmt.name}</div>
                  <div className="text-sm font-extrabold text-[#1b2234] dark:text-white tabular-nums">
                    {fmt.count} hợp đồng
                  </div>
                </div>
                <div className="text-base font-extrabold text-[#df8653] tabular-nums">
                  {fmt.pct}%
                </div>
              </div>
            ))}
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
            <div className="overflow-x-auto">
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
                  {filteredBookings.map(b => (
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
                        <div className="text-[10px] text-[#8b796d] dark:text-zinc-400">
                          {b.photographer?.full_name || 'Louis Gutkowski'}
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
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            b.status === 'hoan_thanh' || b.status === 'done'
                              ? 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50'
                              : b.status === 'da_chot' || b.status === 'deposited'
                              ? 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300/50'
                              : 'bg-orange-100/80 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 border border-orange-300/50'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              b.status === 'hoan_thanh' || b.status === 'done'
                                ? 'bg-emerald-600'
                                : b.status === 'da_chot' || b.status === 'deposited'
                                ? 'bg-amber-600'
                                : 'bg-orange-600'
                            }`}
                          />
                          {b.status === 'hoan_thanh' || b.status === 'done'
                            ? 'Hoàn thành'
                            : b.status === 'da_chot' || b.status === 'deposited'
                            ? 'Đã cọc'
                            : b.status === 'shot'
                            ? 'Đã chụp'
                            : b.status === 'editing'
                            ? 'Đang sửa'
                            : 'Chờ cọc'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 text-right font-mono font-bold text-[#1b2234] dark:text-white tabular-nums">
                        {formatVND(b.packagePrice)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 text-center text-[#8b796d]">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                          }}
                          className="rounded-lg p-1 hover:bg-white/80 dark:hover:bg-white/10"
                          title="Xem chi tiết"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#8b796d]">
                        Không tìm thấy lịch chụp nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-white/90 dark:border-white/10 bg-white/95 dark:bg-[#181a22]/95 p-6 shadow-2xl backdrop-blur-2xl animate-scaleUp text-xs space-y-4">
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
                  <div className="font-bold text-[#1b2234] dark:text-white mt-0.5">
                    {selectedBooking.photographer?.full_name || 'Louis Gutkowski'}
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
