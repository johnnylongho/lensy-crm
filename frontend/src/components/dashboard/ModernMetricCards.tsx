import React from 'react';
import {
  TrendingUp,
  Calendar,
  CreditCard,
  Award,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { calculateStudioKPIs, formatVND } from '../../utils/finance';
import { useWorkspace } from '../../context/WorkspaceContext';

interface ModernMetricCardsProps {
  events: CalendarEvent[];
  onOpenCreateShow: () => void;
}

export const ModernMetricCards: React.FC<ModernMetricCardsProps> = ({
  events,
  onOpenCreateShow,
}) => {
  const { role, isMember } = useWorkspace();
  const kpis = calculateStudioKPIs(events);
  const isMemberRole = role === 'member' || isMember;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Dòng Tiền Thực Nhận */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Doanh Thu Thực Thu
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <span>↑ 14.2%</span>
                <span className="text-slate-400 font-normal">so với tháng trước</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="min-w-0 flex-1">
            {isMemberRole ? (
              <div className="text-lg font-bold text-slate-400 py-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Chỉ Quản Lý</span>
              </div>
            ) : (
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans tabular-nums whitespace-nowrap">
                {formatVND(kpis.totalCollected)}
              </div>
            )}
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Đã thu: <strong className="text-emerald-600 dark:text-emerald-400">{kpis.collectionRate}%</strong>
              {!isMemberRole && (
                <>
                  {' '}· Lợi nhuận: <strong className="text-slate-800 dark:text-zinc-200">+{formatVND(kpis.netProfit)}</strong>
                </>
              )}
            </div>
          </div>

          {/* Mini Sparkline in Orange */}
          <div className="w-20 h-10 shrink-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,32 Q 20,28 35,18 T 60,12 T 80,4 L 80,40 L 0,40 Z"
                fill="url(#spark1)"
              />
              <path
                d="M 0,32 Q 20,28 35,18 T 60,12 T 80,4"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Tổng giá trị hợp đồng:</span>
          <span className="font-bold text-slate-800 dark:text-zinc-200 font-sans tabular-nums">
            {isMemberRole ? '***' : formatVND(kpis.totalContractValue)}
          </span>
        </div>
      </div>

      {/* Card 2: Lịch Chụp & Ca Hôm Nay */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Tổng Lịch Chụp
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Tháng này: {kpis.totalThisMonth} ca
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans tabular-nums">
              {events.filter(e => e.status !== 'cancelled' && (e.status as any) !== 'da_huy').length}{' '}
              <span className="text-sm font-semibold text-slate-400">ca</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 truncate">
              {kpis.todayShowsCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span>
                    Hôm nay: <strong className="text-slate-800 dark:text-zinc-200">{kpis.todayShowsCount} ca</strong> ({kpis.todayNextTime || '08:00'})
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hôm nay không có lịch chụp</span>
                </>
              )}
            </div>
          </div>

          {/* Mini Sparkline in Blue */}
          <div className="w-20 h-10 shrink-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,25 Q 25,35 45,15 T 70,22 T 80,6 L 80,40 L 0,40 Z"
                fill="url(#spark2)"
              />
              <path
                d="M 0,25 Q 25,35 45,15 T 70,22 T 80,6"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Chờ xử lý / Đặt cọc:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 font-sans tabular-nums">
            {kpis.pendingDepositCount} ca
          </span>
        </div>
      </div>

      {/* Card 3: Tỷ Lệ Cọc & Công Nợ */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Cọc & Công Nợ
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Tỷ lệ an toàn cao
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans tabular-nums">
              {kpis.collectionRate}%
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Chờ thu: <strong className="text-rose-500 font-sans">{formatVND(kpis.totalDebt)}</strong>
            </div>
          </div>

          {/* Mini Sparkline in Emerald */}
          <div className="w-20 h-10 shrink-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,35 Q 20,20 40,25 T 60,10 T 80,4 L 80,40 L 0,40 Z"
                fill="url(#spark3)"
              />
              <path
                d="M 0,35 Q 20,20 40,25 T 60,10 T 80,4"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Tiến độ thu cọc:</span>
          <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.collectionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 4: Hiệu Suất Hoàn Tất Ca Chụp */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-sm shadow-purple-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Hiệu Suất Ekip
              </span>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                Chất lượng bàn giao
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-sans tabular-nums">
              {kpis.completionRate > 0 ? `${kpis.completionRate}%` : '100%'}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Đã bàn giao: <strong className="text-slate-800 dark:text-zinc-200">{kpis.completedThisMonth} ca</strong> trong tháng
            </div>
          </div>

          {/* Mini Sparkline in Purple */}
          <div className="w-20 h-10 shrink-0">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
              <defs>
                <linearGradient id="spark4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,30 Q 30,10 50,22 T 80,5 L 80,40 L 0,40 Z"
                fill="url(#spark4)"
              />
              <path
                d="M 0,30 Q 30,10 50,22 T 80,5"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Tình trạng ekip:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sẵn sàng tác chiến</span>
          </span>
        </div>
      </div>
    </div>
  );
};

