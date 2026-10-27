import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Copy,
  KeyRound,
  ShieldCheck,
  Building2,
  Crown,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CalendarView } from './CalendarView';
import { KanbanView } from './KanbanView';
import { ProfitTrendChart } from './ProfitTrendChart';
import { GrowthProgressBar } from './GrowthProgressBar';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(null);
  const [dashboardView, setDashboardView] = useState<'table' | 'calendar' | 'kanban' | 'roi'>('table');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentStudio, isStudioAdmin, isStudioMember, isFreelancer, accountType, switchAccountType } = useWorkspace();
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isCopiedInviteCode, setIsCopiedInviteCode] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // State thời gian thực (tự động cập nhật mỗi phút)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Hàm lấy chuỗi YYYY-MM-DD theo giờ địa phương
  const getLocalDateString = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Chuẩn hóa bất kỳ chuỗi eventDate nào về YYYY-MM-DD
  const normalizeEventDate = (dateVal?: string | null): string => {
    if (!dateVal) return '';
    if (dateVal.length >= 10 && dateVal.includes('-')) {
      return dateVal.substring(0, 10);
    }
    return dateVal;
  };

  // Hàm tính doanh thu thực thu của một event (tiền thực tế đã thu)
  const getEventActualRevenue = (e: CalendarEvent): number => {
    const paid = Number(e.paidAmount || 0);
    const dep = Number(e.depositAmount || 0);
    if (paid > 0) return paid;
    if (dep > 0) return dep;
    const s = String(e.status);
    if (s === 'hoan_thanh' || s === 'done' || s === 'da_tra_file' || s === 'shot' || s === 'da_chup') {
      return Number(e.packagePrice || 0);
    }
    return 0;
  };

  const todayDateVi = useMemo(() => {
    const str = format(currentDate, 'EEEE, dd/MM/yyyy', { locale: vi });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [currentDate]);

  const todayStr = useMemo(() => getLocalDateString(currentDate), [currentDate]);

  // Danh sách sự kiện hợp lệ (không bị hủy hoặc xóa)
  const validEvents = useMemo(() => {
    return events.filter(e => !e.is_deleted && e.status !== 'cancelled' && e.status !== 'da_huy');
  }, [events]);

  // Lịch hôm nay CHÍNH XÁC theo thời gian thực
  const todayShoots = useMemo(() => {
    return validEvents
      .filter(e => normalizeEventDate(e.eventDate) === todayStr)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  }, [validEvents, todayStr]);

  // Lịch chờ xác nhận cọc
  const pendingCount = useMemo(() => {
    return validEvents.filter(
      e => e.status === 'cho_coc' || e.status === 'cho_xac_nhan_coc' || e.status === 'lead'
    ).length;
  }, [validEvents]);

  // Doanh thu tháng này và tổng show trong tháng
  const currentMonthKey = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);

  const monthEvents = useMemo(() => {
    return validEvents.filter(e => normalizeEventDate(e.eventDate).startsWith(currentMonthKey));
  }, [validEvents, currentMonthKey]);

  // Hoàn thành trong tháng
  const completedMonthCount = useMemo(() => {
    return monthEvents.filter(
      e => e.status === 'hoan_thanh' || e.status === 'done' || e.status === 'da_tra_file'
    ).length;
  }, [monthEvents]);

  const monthCompletionPct = monthEvents.length > 0
    ? Math.round((completedMonthCount / monthEvents.length) * 100)
    : 100;

  // Tính toán chỉ số Tài Chính & Dòng Tiền Toàn Diện (Bento Executive Metrics)
  const financialMetrics = useMemo(() => {
    // 1. Doanh thu thực thu (tiền thật đã vào tài khoản/thu cọc)
    const totalActualRevenue = validEvents.reduce((sum, e) => sum + getEventActualRevenue(e), 0);

    // 2. Tổng giá trị toàn bộ hợp đồng
    const totalContractValue = validEvents.reduce((sum, e) => sum + Number(e.packagePrice || 0), 0);

    // 3. Tổng chi phí show (Job Costing)
    const totalExpenses = validEvents.reduce((sum, e) => sum + Number(e.expenses || 0), 0);

    // 4. Lợi nhuận ròng (Net Profit - Tiền thật bỏ túi sau trừ chi phí)
    const totalNetProfit = totalActualRevenue - totalExpenses;

    // 5. Tỷ lệ biên lợi nhuận ròng
    const netMargin = totalActualRevenue > 0
      ? Math.round((totalNetProfit / totalActualRevenue) * 100)
      : 0;

    // 6. Tỷ lệ tiền đã thu / Tổng giá trị hợp đồng
    const contractCollectionRatio = totalContractValue > 0
      ? Math.min(100, Math.round((totalActualRevenue / totalContractValue) * 100))
      : 0;

    // 7. Tổng công nợ còn lại cần thu hồi
    const totalDebt = validEvents.reduce((sum, e) => {
      const pkg = Number(e.packagePrice || 0);
      const paid = Number(e.paidAmount || e.depositAmount || 0);
      const rem = e.remainingAmount !== undefined && e.remainingAmount !== null
        ? Number(e.remainingAmount)
        : Math.max(0, pkg - paid);
      return sum + rem;
    }, 0);

    return {
      totalActualRevenue,
      totalContractValue,
      totalExpenses,
      totalNetProfit,
      netMargin,
      contractCollectionRatio,
      totalDebt,
    };
  }, [validEvents]);

  // Lọc danh sách show cho bảng Recent Bookings
  const filteredBookings = useMemo(() => {
    return validEvents.filter(b => {
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
  }, [validEvents, searchQuery, statusFilter]);

  const bookings = filteredBookings;

  // Reset visibleCount về lại 10 khi người dùng thay đổi bộ lọc
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. LENSY COMMAND CENTER UTILITY STRIP (RBAC & SYNC CONTROLS)          */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* Workspace Identifier & Quick Switcher Pill */}
        <div className="relative inline-block" ref={workspaceDropdownRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-2xs text-xs font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer transition-all"
            title="Nhấn để xem thông tin Studio và đổi góc nhìn vai trò"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              LENSY COMMAND CENTER:
            </span>
            {isStudioAdmin ? (
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {currentStudio?.name || 'Studio Workspace'} (Quản Lý)
              </span>
            ) : isStudioMember ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {currentStudio?.name || 'Studio Workspace'} (Ekip)
              </span>
            ) : (
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Freelancer Solo (Cá Nhân)
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Popover */}
          {isWorkspaceDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-4 z-50 text-xs space-y-3 animate-fadeIn text-left">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {currentStudio?.name || 'MIRMIA STUDIO'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    isStudioAdmin
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                      : isStudioMember
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {isStudioAdmin ? 'Manager' : isStudioMember ? 'Member' : 'Solo'}
                  </span>
                </div>

                {/* Mã mời Studio */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">Mã mời Ekip:</div>
                    <div className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                      {currentStudio?.invite_code || 'MIRMIA-VIP88'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const code = currentStudio?.invite_code || 'MIRMIA-VIP88';
                      await navigator.clipboard.writeText(code);
                      setIsCopiedInviteCode(true);
                      setTimeout(() => setIsCopiedInviteCode(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                    title="Sao chép mã mời"
                  >
                    {isCopiedInviteCode ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedInviteCode ? 'Đã copy' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Phím tắt Điều Hướng */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceDropdownOpen(false);
                    navigate('/dashboard/studio-settings');
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-orange-500" />
                  <span>Quản Trị Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceDropdownOpen(false);
                    navigate('/dashboard/settings');
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Hồ Sơ Cài Đặt</span>
                </button>
              </div>

              {/* Role Switcher Trực Tiếp */}
              <div className="p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-2">
                <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 block tracking-wider">
                  Chuyển Nhanh Góc Nhìn (RBAC):
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchAccountType?.('freelancer');
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                      isFreelancer
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700'
                    }`}
                  >
                    Solo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchAccountType?.('manager');
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                      isStudioAdmin
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700'
                    }`}
                  >
                    Quản Lý
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchAccountType?.('member');
                      setIsWorkspaceDropdownOpen(false);
                    }}
                    className={`p-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                      isStudioMember
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700'
                    }`}
                  >
                    Ekip
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real-time System Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <span>{todayDateVi}</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Trực Tuyến
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BENTO EXECUTIVE STRIP (5-COLUMN EXECUTIVE METRICS MATRIX)          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
        {/* Khối 1 (2 cột): TRUNG TÂM DÒNG TIỀN & LỢI NHUẬN RÒNG */}
        <div className="sm:col-span-2 lg:col-span-2 rounded-xl bg-white bg-gradient-to-br from-orange-50/50 via-white to-white dark:bg-zinc-900 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 border border-orange-500 dark:border-orange-500/30 p-4 sm:p-5 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-2.5">
          <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-orange-600 dark:text-orange-400">
                {isStudioMember ? 'TIẾN ĐỘ TÁC CHIẾN EKIP' : 'TRUNG TÂM DÒNG TIỀN THỰC THU'}
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400 border border-orange-300/80 dark:border-orange-500/30 uppercase">
                {isStudioMember ? 'Ekip KPI' : 'Net Profit'}
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight pt-0.5">
              {isStudioMember
                ? `${validEvents.filter(e => e.status === 'shot' || e.status === 'editing' || e.status === 'da_tra_file').length} Ca Đang Tác Chiến`
                : formatVND(financialMetrics.totalActualRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans line-clamp-1">
              {isStudioMember
                ? 'Tổng số ca chụp và hậu kỳ được phân bổ cho ekip'
                : 'Dòng tiền thực tế đã thu vào tài khoản (đã cọc & quyết toán)'}
            </p>
          </div>

          {/* Thanh phân bổ so với Tổng Giá Trị Hợp Đồng */}
          {!isStudioMember ? (
            <div className="space-y-1.5 relative z-10 pt-0.5">
              <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${financialMetrics.contractCollectionRatio}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-zinc-400">
                  Đã thu: <strong className="text-slate-900 dark:text-white">{financialMetrics.contractCollectionRatio}%</strong>
                </span>
                <span className="text-slate-500 dark:text-zinc-400">
                  Tổng HĐ: <strong className="text-slate-900 dark:text-white">{formatVND(financialMetrics.totalContractValue)}</strong>
                </span>
              </div>

              {/* Lợi nhuận ròng (Net Profit) thực tế sau trừ chi phí */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Lợi Nhuận Ròng (Thực thu):</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base">
                    +{formatVND(financialMetrics.totalNetProfit)}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-500 font-bold">
                    ({financialMetrics.netMargin}%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Trạng thái hoạt động:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Sẵn sàng nhận show</span>
            </div>
          )}
        </div>

        {/* Khối 2 (1 cột): CA CHỤP HÔM NAY */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 border-l-4 border-l-orange-500 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                CA CHỤP HÔM NAY
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300">
                {format(currentDate, 'dd/MM')}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight pt-0.5">
              {todayShoots.length}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {todayShoots.length > 0 ? 'Buổi chụp trong ngày' : 'Trống lịch hôm nay'}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
            {todayShoots.length > 0 ? (
              <div className="text-[11px] text-slate-600 dark:text-zinc-400 truncate">
                <span className="font-bold text-orange-600 dark:text-orange-400 font-mono mr-1">
                  {todayShoots[0].startTime || '08:00'}:
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {todayShoots[0].clientName}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateQuote}
                className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer block text-xs"
              >
                + Lên lịch chụp ngay
              </button>
            )}
          </div>
        </div>

        {/* Khối 3 (1 cột): CỌC & CÔNG NỢ CẦN THU */}
        <div className={`rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 border-l-4 ${
          financialMetrics.totalDebt > 0 ? 'border-l-rose-500' : 'border-l-emerald-500'
        } p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3`}>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                CỌC & CÔNG NỢ
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                pendingCount > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {pendingCount > 0 ? 'CẦN CHỐT' : 'ỔN ĐỊNH'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight pt-0.5">
              {pendingCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Khách chờ chốt cọc
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
            {financialMetrics.totalDebt > 0 ? (
              <div className="text-[11px] font-mono flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-sans">Nợ đọng:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  {formatVND(financialMetrics.totalDebt)}
                </span>
              </div>
            ) : (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Đã thu đủ 100%
              </span>
            )}
          </div>
        </div>

        {/* Khối 4 (1 cột): HOÀN THÀNH & HIỆU SUẤT THÁNG */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 border-l-4 border-l-amber-500 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                HIỆU SUẤT THÁNG
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300">
                {format(currentDate, 'MM/yyyy')}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight pt-0.5">
              {completedMonthCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Show đã giao file
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-zinc-400">Tỷ lệ hoàn thành:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {monthCompletionPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TODAY'S TIMELINE BAR (CHỈ HIỂN THỊ KHI CÓ SHOW HÔM NAY)             */}
      {/* ===================================================================== */}
      {todayShoots.length > 0 && (
        <div className="rounded-xl bg-orange-50/50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                LỊCH TRÌNH TÁC CHIẾN HÔM NAY ({todayShoots.length} CA CHỤP)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              {todayDateVi}
            </span>
          </div>

          {/* Dải thẻ nằm ngang gọn gàng cho các ca chụp hôm nay */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {todayShoots.map(shoot => (
              <div
                key={`today-${shoot.id}`}
                onClick={() => onOpenDetailModal(shoot)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 shadow-sm hover:border-orange-500/50 transition-all cursor-pointer shrink-0 min-w-[260px]"
              >
                <div className="text-center font-mono shrink-0 pr-3 border-r border-slate-100 dark:border-white/10">
                  <div className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {shoot.startTime || '08:00'}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {shoot.endTime || '12:00'}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {shoot.clientName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {shoot.sessionTitle || shoot.sessionType || 'Gói Studio'} · {shoot.location || 'Studio'}
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 shrink-0 uppercase">
                  {shoot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. WORKFLOW DISPATCH CENTER (TABS NAVIGATION & DIRECT WORKSPACE)      */}
      {/* ===================================================================== */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 shadow-sm">
        {/* Header Tabs Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'table', label: isStudioMember ? 'Ca Chụp Phân Công' : isFreelancer ? 'Lịch Chụp Cá Nhân' : 'Danh Sách Lịch Chụp', icon: Briefcase },
              { id: 'kanban', label: 'Quy Trình Kanban (5 bước)', icon: Kanban },
              { id: 'calendar', label: 'Thời Khóa Biểu Tuần', icon: CalendarIcon },
              ...(!isStudioMember ? [{ id: 'roi', label: isFreelancer ? 'Dòng Tiền Cá Nhân' : 'Biểu Đồ Tài Chính & ROI Thiết Bị', icon: TrendingUp }] : []),
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = dashboardView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDashboardView(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
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
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Làm mới dữ liệu từ Supabase"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-orange-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm Mới</span>
              </button>
            )}

            {onOpenImportCsv && (
              <button
                type="button"
                onClick={onOpenImportCsv}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Nhập danh sách từ file CSV"
              >
                <Upload className="h-3.5 w-3.5 text-orange-500" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
            )}

            {onOpenWebhookSimulator && (
              <button
                type="button"
                onClick={onOpenWebhookSimulator}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Mô phỏng Webhook chuyển khoản ngân hàng"
              >
                <Radio className="h-3.5 w-3.5 text-orange-500" />
                <span className="hidden sm:inline">Mô Phỏng Webhook</span>
              </button>
            )}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên khách, SĐT, mã show..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-8 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-8 pr-3 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="All" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Tất Cả Trạng Thái</option>
                  <option value="Deposited" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Đã Cọc (Deposited)</option>
                  <option value="In Progress" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Đang Chụp / Sửa (In Progress)</option>
                  <option value="Done" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Đã Hoàn Thành (Done)</option>
                  <option value="Lead" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Chờ Chốt / Lead</option>
                </select>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/75 dark:bg-zinc-900/75 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    <th className="py-3 px-3.5">Mã Show</th>
                    <th className="py-3 px-3.5">Khách Hàng</th>
                    <th className="py-3 px-3.5">Gói Dịch Vụ / Ekip</th>
                    <th className="py-3 px-3.5">Ngày Chụp</th>
                    <th className="py-3 px-3.5">Trạng Thái</th>
                    <th className="py-3 px-3.5 text-right">Tổng Tiền</th>
                    <th className="py-3 px-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-transparent">
                  {bookings.slice(0, visibleCount).map(b => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3 px-3.5">
                        <span className="inline-block bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-1 rounded-md text-xs font-mono font-bold border border-orange-200/60 dark:border-orange-500/20">
                          #{b.id.substring(0, 8)}
                        </span>
                      </td>

                      {/* Client Name & Phone */}
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        <div>{b.clientName}</div>
                        {b.clientPhone && (
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono font-normal">
                            {b.clientPhone}
                          </div>
                        )}
                      </td>

                      {/* Package & Photographer */}
                      <td className="py-3 px-3.5 text-slate-700 dark:text-zinc-300 font-medium">
                        <div>{b.sessionType || b.category || 'Gói Studio'}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                          <span>{b.photographer?.full_name || 'Johnny Long Hồ'}</span>
                          {(b.photographer?.is_verified ?? true) && (
                            <VerifiedBadge className="w-3 h-3 shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-700 dark:text-zinc-300">
                        {b.eventDate}
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans">
                          {b.startTime} - {b.endTime}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5" onClick={e => e.stopPropagation()}>
                        <BookingStatusSelect
                          status={b.status}
                          onChange={newStatus => onStatusChange(b.id, newStatus)}
                          size="sm"
                        />
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatVND(b.packagePrice)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Xem chi tiết"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBooking(b)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                        Không tìm thấy lịch chụp nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {bookings.slice(0, visibleCount).map(b => (
                <div
                  key={`card-${b.id}`}
                  onClick={() => setSelectedBooking(b)}
                  className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 shadow-sm space-y-2.5 cursor-pointer hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border border-orange-200/60 dark:border-orange-500/20">
                        #{b.id.substring(0, 8)}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-1">
                        {b.clientName}
                      </h4>
                      {b.clientPhone && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                          {b.clientPhone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                        {formatVND(b.packagePrice)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                        {b.eventDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
                    <div className="text-[11px] text-slate-600 dark:text-zinc-400">
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
                <div className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                  Không tìm thấy lịch chụp nào phù hợp.
                </div>
              )}
            </div>

            {/* Pagination / Load More */}
            {visibleCount < bookings.length && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Xem thêm lịch chụp ({bookings.length - visibleCount} show còn lại)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 2: KANBAN PIPELINE (5 BƯỚC)                                    */}
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
        {/* VIEW 3: CALENDAR VIEW (WEEKLY TIMETABLE)                            */}
        {/* ------------------------------------------------------------------- */}
        {dashboardView === 'calendar' && (
          <div className="pt-4 space-y-6">
            <CalendarView
              events={events}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
              onSelectBooking={onOpenDetailModal}
              onOpenCreateQuote={onOpenCreateQuote}
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
      {/* 5. MODAL: BOOKING DETAIL INSPECTOR                                        */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs overflow-hidden"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/90 backdrop-blur-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] animate-scaleUp text-xs space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  ID: {selectedBooking.id.substring(0, 12)}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedBooking.clientName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full bg-slate-100 dark:bg-white/10 p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Gói Dịch Vụ</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedBooking.sessionType || selectedBooking.category || 'Gói Chụp Studio'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Nhiếp Ảnh Gia</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span>{selectedBooking.photographer?.full_name || 'Johnny Long Hồ'}</span>
                    {(selectedBooking.photographer?.is_verified ?? true) && (
                      <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400">Thời Gian & Địa Điểm</span>
                  <div className="font-medium text-slate-800 dark:text-zinc-200 mt-0.5">
                    {selectedBooking.eventDate} ({selectedBooking.startTime} - {selectedBooking.endTime}) · {selectedBooking.location || 'Tại Studio'}
                  </div>
                </div>
                {selectedBooking.clientPhone && (
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-white/10">
                    <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-orange-500" />
                      <span className="font-mono">{selectedBooking.clientPhone}</span>
                    </span>
                    <a
                      href={`tel:${selectedBooking.clientPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold transition-colors"
                    >
                      Gọi Điện
                    </a>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Tổng Chi Phí Gói:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatVND(selectedBooking.packagePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Đã Cọc / Thanh Toán:</span>
                  <span className="font-mono font-bold">
                    - {formatVND(selectedBooking.paidAmount || selectedBooking.depositAmount || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Số Tiền Còn Lại:</span>
                  <span className="font-mono text-orange-600 dark:text-orange-400">
                    {formatVND(selectedBooking.remainingAmount !== undefined ? selectedBooking.remainingAmount : selectedBooking.packagePrice - (selectedBooking.paidAmount || selectedBooking.depositAmount || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenQuote(selectedBooking.id);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
                  <span>Trang Báo Giá</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    onOpenDetailModal(b);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa Toàn Diện</span>
                </button>

                {onOpenDebtReminder && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      onOpenDebtReminder(b);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Nhắc Nợ Zalo</span>
                  </button>
                )}

                {onOpenReceiptReview && selectedBooking.receiptUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      onOpenReceiptReview(b);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-300/40 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 font-semibold text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Duyệt Biên Lai</span>
                  </button>
                )}

                {onQuickEditFinancials && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      onQuickEditFinancials(b);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Sửa Tiền Cọc/Chi</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    onDeleteBooking(b);
                  }}
                  className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hủy Lịch</span>
                </button>

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
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 font-semibold text-white shadow-xs transition-all cursor-pointer"
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
