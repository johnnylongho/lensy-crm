import React, { useMemo } from 'react';
import {
  Camera,
  Clock,
  Sparkles,
  QrCode,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { formatVND } from '../../utils/finance';
import { InstallPwaButton } from './InstallPwaButton';

interface StudioIntelligenceRailProps {
  events: CalendarEvent[];
  onSelectShow: (event: CalendarEvent) => void;
  onOpenVietQR: (event: CalendarEvent) => void;
  onRefreshData?: () => void;
  isLoading?: boolean;
}

export const StudioIntelligenceRail: React.FC<StudioIntelligenceRailProps> = ({
  events,
  onSelectShow,
  onOpenVietQR,
  onRefreshData,
  isLoading,
}) => {
  // Lọc các ca chụp sắp tới (ngày hôm nay hoặc tương lai, không bị hủy)
  const todayStr = new Date().toISOString().substring(0, 10);
  const upcomingShows = useMemo(() => {
    return events
      .filter(
        e =>
          e.status !== 'cancelled' &&
          (e.status as any) !== 'da_huy' &&
          e.status !== 'hoan_thanh' &&
          e.status !== 'done' &&
          e.eventDate >= todayStr
      )
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.startTime.localeCompare(b.startTime))
      .slice(0, 4);
  }, [events, todayStr]);

  // Thống kê tỷ trọng danh mục gói chụp
  const categoryStats = useMemo(() => {
    const activeEvents = events.filter(e => e.status !== 'cancelled' && (e.status as any) !== 'da_huy');
    const total = activeEvents.length || 1;

    let portrait = 0;
    let wedding = 0;
    let eventCount = 0;
    let lookbook = 0;

    for (const e of activeEvents) {
      const type = (e.sessionType || e.category || '').toLowerCase();
      if (type.includes('wedding') || type.includes('cuoi') || type.includes('pre')) {
        wedding++;
      } else if (type.includes('event') || type.includes('su_kien') || type.includes('tiec')) {
        eventCount++;
      } else if (type.includes('lookbook') || type.includes('commercial') || type.includes('san_pham')) {
        lookbook++;
      } else {
        portrait++;
      }
    }

    const pPct = Math.round((portrait / total) * 100);
    const wPct = Math.round((wedding / total) * 100);
    const ePct = Math.round((eventCount / total) * 100);
    const lPct = Math.max(0, 100 - (pPct + wPct + ePct));

    return {
      total: activeEvents.length,
      portrait: { count: portrait, pct: pPct },
      wedding: { count: wedding, pct: wPct },
      event: { count: eventCount, pct: ePct },
      lookbook: { count: lookbook, pct: lPct },
    };
  }, [events]);

  // Stroke calculations for SVG Donut (Circumference = 2 * PI * 38 ≈ 238.76)
  const c = 238.76;
  const pDash = (categoryStats.portrait.pct / 100) * c;
  const wDash = (categoryStats.wedding.pct / 100) * c;
  const eDash = (categoryStats.event.pct / 100) * c;
  const lDash = (categoryStats.lookbook.pct / 100) * c;

  const wOffset = -pDash;
  const eOffset = -(pDash + wDash);
  const lOffset = -(pDash + wDash + eDash);

  return (
    <div className="space-y-5">
      {/* 1. Category Distribution Donut Widget */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Cơ Cấu Gói Chụp
            </h3>
            <p className="text-[11px] text-slate-400">Tỷ trọng doanh thu & ca chụp studio</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            Thực tế CRM
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          {/* Donut Chart SVG */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Segment 1: Portrait */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f97316"
                strokeWidth="14"
                strokeDasharray={`${pDash} ${c}`}
                strokeDashoffset="0"
              />
              {/* Segment 2: Wedding */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth="14"
                strokeDasharray={`${wDash} ${c}`}
                strokeDashoffset={wOffset}
              />
              {/* Segment 3: Event */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#9333ea"
                strokeWidth="14"
                strokeDasharray={`${eDash} ${c}`}
                strokeDashoffset={eOffset}
              />
              {/* Segment 4: Lookbook */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={`${lDash} ${c}`}
                strokeDashoffset={lOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white font-sans tabular-nums">
                {categoryStats.total}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Ca Chụp
              </span>
            </div>
          </div>

          {/* Clean Legend */}
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-slate-600 dark:text-zinc-300">Portrait</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-sans">
                {categoryStats.portrait.pct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-600 dark:text-zinc-300">Pre-Wedding</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-sans">
                {categoryStats.wedding.pct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span className="text-slate-600 dark:text-zinc-300">Sự Kiện</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-sans">
                {categoryStats.event.pct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-zinc-300">Lookbook</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-sans">
                {categoryStats.lookbook.pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Upcoming Shoots Feed */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Ca Chụp Sắp Tới
            </h3>
            <p className="text-[11px] text-slate-400">Lịch bấm máy và điều phối ekip</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="mt-4 space-y-3">
          {upcomingShows.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Không có ca chụp nào sắp tới
            </div>
          ) : (
            upcomingShows.map(show => (
              <div
                key={show.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-orange-50/50 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 transition group cursor-pointer"
                onClick={() => onSelectShow(show)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {show.clientName}
                      </span>
                      <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-semibold">
                        #{(show.quoteToken || show.id.slice(0, 6)).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                      {show.sessionTitle || `Gói ${show.sessionType}`}
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenVietQR(show);
                    }}
                    title="Mở mã VietQR thu cọc nhanh"
                    className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 hover:bg-orange-200 transition shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-500" />
                    <span>{show.eventDate} ({show.startTime})</span>
                  </span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 font-sans tabular-nums">
                    {formatVND(show.packagePrice)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Studio System & PWA Install Helper */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-zinc-950 text-white p-5 shadow-sm border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Trung Tâm Vận Hành
            </h4>
          </div>
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              title="Đồng bộ dữ liệu"
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Cài đặt ứng dụng PWA Lensy CRM lên máy tính & điện thoại để nhận thông báo cọc và làm việc offline.
        </p>
        <InstallPwaButton className="w-full justify-center text-xs py-2" />
      </div>
    </div>
  );
};

