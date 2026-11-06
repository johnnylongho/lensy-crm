import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Camera,
  CheckCircle2,
  Calendar,
  Layers,
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { CalendarEvent, GearItem } from '../../types';
import { formatVND } from '../../utils/finance';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface FinancialAnalyticsViewProps {
  events: CalendarEvent[];
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({ events }) => {
  const { user } = useAuth();
  const { currentStudio } = useWorkspace();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [realGears, setRealGears] = useState<GearItem[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // 1. Lọc các ca chụp hợp lệ (loại trừ đã hủy hoặc đã xóa)
  const activeEvents = useMemo(() => {
    return events.filter(e => e.status !== 'cancelled' && (e.status as any) !== 'da_huy' && !e.is_deleted);
  }, [events]);

  // 2. Fetch danh sách thiết bị thực tế từ Supabase (loại bỏ hoàn toàn mock data)
  useEffect(() => {
    let isMounted = true;
    const fetchRealGears = async () => {
      setIsLoadingGears(true);
      try {
        if (isSupabaseConfigured) {
          let query = supabase.from('gears').select('*').order('created_at', { ascending: false });
          if (currentStudio) {
            query = query.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user?.id}`);
          } else if (user) {
            query = query.eq('photographer_id', user.id);
          }
          const { data, error } = await query;
          if (!error && data && isMounted) {
            setRealGears(data as GearItem[]);
            try {
              localStorage.setItem('lensy_cached_gears', JSON.stringify(data));
            } catch (e) {}
            return;
          }
        }
      } catch (err) {
        console.warn('Lỗi khi fetch danh sách thiết bị thực:', err);
      } finally {
        if (isMounted) {
          try {
            const cached = localStorage.getItem('lensy_cached_gears');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setRealGears(parsed);
              }
            }
          } catch (e) {}
          setIsLoadingGears(false);
        }
      }
    };

    fetchRealGears();
    return () => {
      isMounted = false;
    };
  }, [user, currentStudio]);

  // 3. Tính toán mốc thời gian chuẩn Local Time (Hôm Nay / Tuần Này / Tháng Này)
  const dateRanges = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');

    // Hôm nay: YYYY-MM-DD
    const todayStr = `${year}-${pad(month + 1)}-${pad(date)}`;

    // Tuần này (Thứ 2 đến Chủ Nhật)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(year, month, date + diffToMonday);
    const sunday = new Date(year, month, date + diffToMonday + 6);
    const mondayStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
    const sundayStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

    // Tháng này (1 đến ngày cuối tháng)
    const firstDayMonthStr = `${year}-${pad(month + 1)}-01`;
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const lastDayMonthStr = `${year}-${pad(month + 1)}-${pad(lastDayOfMonth.getDate())}`;

    return {
      todayStr,
      mondayStr,
      sundayStr,
      firstDayMonthStr,
      lastDayMonthStr,
      now,
    };
  }, []);

  // 4. Lọc ca chụp thực tế theo đúng chu kỳ được chọn
  const filteredEvents = useMemo(() => {
    return activeEvents.filter(e => {
      const eDate = (e.eventDate || e.created_at || '').substring(0, 10);
      if (!eDate) return false;

      if (period === 'today') {
        return eDate === dateRanges.todayStr;
      }
      if (period === 'week') {
        return eDate >= dateRanges.mondayStr && eDate <= dateRanges.sundayStr;
      }
      if (period === 'month') {
        return eDate >= dateRanges.firstDayMonthStr && eDate <= dateRanges.lastDayMonthStr;
      }
      return true;
    });
  }, [activeEvents, period, dateRanges]);

  // 5. Thống kê số liệu thực tế dựa trên filteredEvents
  const stats = useMemo(() => {
    const totalShows = filteredEvents.length;
    const totalRevenue = filteredEvents.reduce((sum, e) => sum + Number(e.packagePrice || 0), 0);
    const totalCollected = filteredEvents.reduce((sum, e) => sum + Number(e.paidAmount || 0), 0);
    const totalDebt = filteredEvents.reduce((sum, e) => {
      const rem = e.remainingAmount !== undefined && e.remainingAmount !== null
        ? Number(e.remainingAmount)
        : Math.max(0, Number(e.packagePrice || 0) - Number(e.paidAmount || 0));
      return sum + rem;
    }, 0);

    return {
      totalShows,
      totalRevenue,
      totalCollected,
      totalDebt,
    };
  }, [filteredEvents]);

  // 6. Xây dựng các điểm dữ liệu chu kỳ biểu đồ thực tế (Data Series)
  const chartSeries = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');

    if (period === 'today') {
      // 6 khung giờ thực tế trong ngày
      const slots = [
        { label: '08:00', startH: 6, endH: 9 },
        { label: '10:00', startH: 9, endH: 12 },
        { label: '13:00', startH: 12, endH: 15 },
        { label: '15:00', startH: 15, endH: 17 },
        { label: '17:00', startH: 17, endH: 19 },
        { label: '19:00+', startH: 19, endH: 24 },
      ];

      return slots.map(slot => {
        const matches = filteredEvents.filter(e => {
          const hour = parseInt((e.startTime || '09:00').split(':')[0], 10);
          return hour >= slot.startH && hour < slot.endH;
        });
        const revenue = matches.reduce((sum, e) => sum + Number(e.paidAmount || e.packagePrice || 0), 0);
        return {
          label: slot.label,
          subLabel: `${matches.length} ca`,
          revenue,
          orders: matches.length,
          events: matches,
        };
      });
    }

    if (period === 'week') {
      // 7 ngày từ Thứ 2 đến Chủ Nhật của tuần hiện tại
      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
      const mondayDate = new Date(dateRanges.mondayStr + 'T00:00:00');

      return dayNames.map((name, idx) => {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + idx);
        const dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;

        const matches = filteredEvents.filter(e => (e.eventDate || '').substring(0, 10) === dStr);
        const revenue = matches.reduce((sum, e) => sum + Number(e.paidAmount || e.packagePrice || 0), 0);
        return {
          label: name,
          subLabel: shortDate,
          revenue,
          orders: matches.length,
          events: matches,
        };
      });
    }

    // period === 'month': Các tuần của tháng hiện tại
    const year = dateRanges.now.getFullYear();
    const month = dateRanges.now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const weekBuckets = [
      { label: 'Tuần 1', start: 1, end: 7 },
      { label: 'Tuần 2', start: 8, end: 14 },
      { label: 'Tuần 3', start: 15, end: 21 },
      { label: 'Tuần 4', start: 22, end: 28 },
      ...(lastDay > 28 ? [{ label: 'Tuần 5', start: 29, end: lastDay }] : []),
    ];

    return weekBuckets.map(b => {
      const matches = filteredEvents.filter(e => {
        const day = parseInt((e.eventDate || '').substring(8, 10), 10);
        return day >= b.start && day <= b.end;
      });
      const revenue = matches.reduce((sum, e) => sum + Number(e.paidAmount || e.packagePrice || 0), 0);
      return {
        label: b.label,
        subLabel: `${b.start}-${b.end}/${month + 1}`,
        revenue,
        orders: matches.length,
        events: matches,
      };
    });
  }, [period, filteredEvents, dateRanges]);

  // 7. Tọa độ toán học chính xác cho đường cong SVG
  const chartGeometry = useMemo(() => {
    const N = chartSeries.length;
    if (N === 0) return { revPath: '', revArea: '', orderPath: '', points: [] };

    const startX = 60;
    const endX = 640;
    const baselineY = 190;
    const topY = 40;
    const availableHeight = baselineY - topY; // 150px

    const maxRev = Math.max(...chartSeries.map(s => s.revenue), 1000000);
    const maxOrders = Math.max(...chartSeries.map(s => s.orders), 1);

    const points = chartSeries.map((s, i) => {
      const x = N === 1 ? (startX + endX) / 2 : startX + (i / (N - 1)) * (endX - startX);
      const yRev = s.revenue > 0 ? baselineY - (s.revenue / maxRev) * (availableHeight * 0.9) : baselineY;
      const yOrder = s.orders > 0 ? baselineY - (s.orders / maxOrders) * (availableHeight * 0.6) : baselineY;
      return {
        x,
        yRev,
        yOrder,
        revenue: s.revenue,
        orders: s.orders,
        label: s.label,
        subLabel: s.subLabel,
      };
    });

    // Hàm tạo đường cong mượt mà nối các điểm
    const buildPath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return '';
      if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
      }
      return d;
    };

    const revPts = points.map(p => ({ x: p.x, y: p.yRev }));
    const orderPts = points.map(p => ({ x: p.x, y: p.yOrder }));

    const revPath = buildPath(revPts);
    const revArea = revPath ? `${revPath} L ${points[points.length - 1].x},${baselineY} L ${points[0].x},${baselineY} Z` : '';
    const orderPath = buildPath(orderPts);

    return {
      revPath,
      revArea,
      orderPath,
      points,
    };
  }, [chartSeries]);

  // 8. Cơ Cấu Nguồn Thu (Phân bổ thực tế theo dịch vụ)
  const categoryBreakdown = useMemo(() => {
    // Ưu tiên tính theo filteredEvents trong chu kỳ; nếu chu kỳ chưa có show, tổng hợp từ activeEvents
    const targetEvents = filteredEvents.length > 0 ? filteredEvents : activeEvents;
    const groups: Record<string, { count: number; revenue: number }> = {};

    targetEvents.forEach(e => {
      let cat = (e.category || e.sessionType || 'Gói Studio').trim();
      if (cat.toLowerCase().includes('portrait') || cat.toLowerCase().includes('chân dung')) {
        cat = 'Portrait Nghệ Thuật';
      } else if (cat.toLowerCase().includes('wedding') || cat.toLowerCase().includes('cưới')) {
        cat = 'Pre-Wedding & Cưới';
      } else if (cat.toLowerCase().includes('event') || cat.toLowerCase().includes('sự kiện')) {
        cat = 'Sự Kiện & Doanh Nghiệp';
      } else if (cat.toLowerCase().includes('lookbook') || cat.toLowerCase().includes('fashion')) {
        cat = 'Lookbook & Thời Trang';
      } else if (cat.toLowerCase().includes('outdoor') || cat.toLowerCase().includes('ngoại cảnh')) {
        cat = 'Ngoại Cảnh Outdoor';
      } else if (cat.toLowerCase().includes('studio')) {
        cat = 'Chụp Studio Tiêu Chuẩn';
      } else {
        cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      }

      if (!groups[cat]) {
        groups[cat] = { count: 0, revenue: 0 };
      }
      groups[cat].count += 1;
      groups[cat].revenue += Number(e.paidAmount || e.packagePrice || 0);
    });

    const totalShows = targetEvents.length;
    const totalRev = Object.values(groups).reduce((sum, g) => sum + g.revenue, 0);
    const palette = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4'];

    const items = Object.entries(groups)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data], idx) => {
        const percentage = totalShows > 0 ? Math.round((data.count / totalShows) * 100) : 0;
        return {
          name,
          count: data.count,
          revenue: data.revenue,
          percentage,
          color: palette[idx % palette.length],
        };
      });

    return {
      items,
      totalShows,
      totalRevenue: totalRev,
    };
  }, [filteredEvents, activeEvents]);

  // 9. Tính toán hoàn vốn thiết bị thực tế (Real Equipment ROI Matrix)
  const gearROI = useMemo(() => {
    const GEAR_TYPE_TRANSLATION: Record<string, string> = {
      camera: 'Máy ảnh',
      lens: 'Ống kính',
      lighting: 'Đèn chiếu sáng',
      audio: 'Âm thanh / Mic',
      accessory: 'Phụ kiện',
      other: 'Khác',
    };

    return realGears.map(gear => {
      const price = Number(gear.purchase_price || 0);

      // Đếm số ca chụp thực tế đã gán thiết bị này
      const matchedEvents = activeEvents.filter(e => {
        if (!e.assignedGears || !Array.isArray(e.assignedGears)) return false;
        return e.assignedGears.some((g: any) => {
          if (typeof g === 'string') {
            return g.toLowerCase() === gear.id.toLowerCase() || g.toLowerCase() === gear.name.toLowerCase();
          }
          if (g && typeof g === 'object') {
            return g.id === gear.id || g.name === gear.name;
          }
          return false;
        });
      });

      const totalShoots = matchedEvents.length;
      // Doanh thu sinh lời thực tế từ các ca đã sử dụng thiết bị này
      const earnedFromShoots = matchedEvents.reduce((sum, e) => sum + Number(e.paidAmount || e.packagePrice || 0), 0);
      const estimatedEarned = earnedFromShoots > 0 ? earnedFromShoots : totalShoots * 850000;
      const paybackRate = price > 0 ? Math.min(100, Math.round((estimatedEarned / price) * 100)) : (totalShoots > 0 ? 100 : 0);

      return {
        id: gear.id,
        name: gear.name,
        category: GEAR_TYPE_TRANSLATION[gear.type] || gear.type || 'Thiết bị',
        purchasePrice: price,
        totalShoots,
        estimatedEarned,
        paybackRate,
      };
    });
  }, [realGears, activeEvents]);

  // Chu kỳ hiển thị text
  const periodLabel = period === 'today' ? 'Hôm Nay' : period === 'week' ? 'Tuần Này' : 'Tháng Này';

  return (
    <div className="space-y-5">
      {/* Top Row: Revenue Trend Area Chart & Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Area Chart (Col span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Biểu Đồ Doanh Thu & Ca Chụp (Revenue & Orders Trend)
                </h3>
                <p className="text-xs text-slate-400">
                  Xu hướng dòng tiền thực tế thu về studio trong chu kỳ <strong className="text-orange-600 dark:text-orange-400 font-semibold">{periodLabel}</strong>
                </p>
              </div>

              {/* Nút lọc chu kỳ thời gian (Đã kết nối logic lọc dữ liệu thực) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPeriod('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    period === 'today'
                      ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Hôm Nay
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('week')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    period === 'week'
                      ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tuần Này
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    period === 'month'
                      ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tháng Này
                </button>
              </div>
            </div>

            {/* SVG Dynamic Curves Chart */}
            <div className="relative mt-4 h-64 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 240">
                <defs>
                  <linearGradient id="realRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="realOrderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="40" y1="40" x2="660" y2="40" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="660" y2="90" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="4 4" />
                <line x1="40" y1="140" x2="660" y2="140" stroke="currentColor" strokeOpacity="0.07" strokeDasharray="4 4" />
                <line x1="40" y1="190" x2="660" y2="190" stroke="currentColor" strokeOpacity="0.12" />

                {/* Real Revenue Curve & Area */}
                {chartGeometry.revArea && (
                  <path d={chartGeometry.revArea} fill="url(#realRevGrad)" />
                )}
                {chartGeometry.revPath && (
                  <path
                    d={chartGeometry.revPath}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Real Orders Curve */}
                {chartGeometry.orderPath && (
                  <path
                    d={chartGeometry.orderPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />
                )}

                {/* Real Interactive Data Points */}
                {chartGeometry.points.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    {/* Revenue Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.yRev}
                      r={hoveredPointIndex === idx ? 6 : pt.revenue > 0 ? 4.5 : 2.5}
                      fill="#f97316"
                      stroke="#ffffff"
                      strokeWidth={hoveredPointIndex === idx ? 3 : 2}
                      className="transition-all duration-150"
                    />

                    {/* Orders Dot */}
                    {pt.orders > 0 && (
                      <circle
                        cx={pt.x}
                        cy={pt.yOrder}
                        r={hoveredPointIndex === idx ? 4.5 : 3}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-all duration-150"
                      />
                    )}

                    {/* X-Axis Dynamic Labels */}
                    <text
                      x={pt.x}
                      y={212}
                      fill={hoveredPointIndex === idx ? '#ea580c' : '#94a3b8'}
                      fontSize="11"
                      fontWeight={hoveredPointIndex === idx ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                    <text
                      x={pt.x}
                      y={225}
                      fill="#cbd5e1"
                      fontSize="9"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {pt.subLabel}
                    </text>
                  </g>
                ))}

                {/* No data overlay when period has 0 events */}
                {stats.totalShows === 0 && (
                  <g>
                    <rect x="180" y="90" width="340" height="42" rx="12" fill="rgba(248, 250, 252, 0.9)" stroke="#e2e8f0" />
                    <text x="350" y="116" fill="#64748b" fontSize="12" fontWeight="600" textAnchor="middle">
                      Chưa có ca chụp nào trong chu kỳ {periodLabel}
                    </text>
                  </g>
                )}
              </svg>

              {/* Tooltip Popup on Hover */}
              {hoveredPointIndex !== null && chartGeometry.points[hoveredPointIndex] && (
                <div
                  className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs shadow-xl backdrop-blur-xs border border-white/10"
                  style={{
                    left: `${(chartGeometry.points[hoveredPointIndex].x / 700) * 100}%`,
                    top: `${(chartGeometry.points[hoveredPointIndex].yRev / 240) * 100}%`,
                  }}
                >
                  <p className="font-bold text-orange-400">
                    {chartGeometry.points[hoveredPointIndex].label} ({chartGeometry.points[hoveredPointIndex].subLabel})
                  </p>
                  <p className="text-[11px] text-slate-200">
                    Doanh thu: {formatVND(chartGeometry.points[hoveredPointIndex].revenue)}
                  </p>
                  <p className="text-[11px] text-emerald-400">
                    Số show: {chartGeometry.points[hoveredPointIndex].orders} ca chụp
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-zinc-800 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Doanh thu thu về</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Số ca chụp bấm máy</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Thực thu ({periodLabel}):</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                {formatVND(stats.totalCollected)}
              </span>
              <span className="text-xs text-slate-400">/ {stats.totalShows} show</span>
            </div>
          </div>
        </div>

        {/* Donut Breakdown & Business Suggestion (Col span 1) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cơ Cấu Nguồn Thu
              </h3>
              <p className="text-xs text-slate-400">
                Phân bổ doanh thu theo dịch vụ ({categoryBreakdown.totalShows} show)
              </p>
            </div>

            <div className="mt-4 flex flex-col items-center">
              {/* Dynamic SVG Donut Graphic */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {categoryBreakdown.items.length === 0 ? (
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" strokeWidth="16" />
                  ) : (
                    (() => {
                      const circumference = 2 * Math.PI * 38; // ~238.76
                      let cumulativeOffset = 0;
                      return categoryBreakdown.items.map((cat, idx) => {
                        const dashLength = (cat.percentage / 100) * circumference;
                        const spaceLength = circumference - dashLength;
                        const currentOffset = cumulativeOffset;
                        cumulativeOffset -= dashLength;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={cat.color}
                            strokeWidth="16"
                            strokeDasharray={`${dashLength} ${spaceLength}`}
                            strokeDashoffset={currentOffset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()
                  )}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">
                    {categoryBreakdown.totalShows}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    TỔNG SHOW
                  </span>
                </div>
              </div>

              {/* Dynamic Legend list */}
              <div className="mt-4 w-full space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                {categoryBreakdown.items.length === 0 ? (
                  <p className="text-center text-slate-400 py-3 text-xs italic">
                    Chưa có ca chụp nào được phân loại dịch vụ.
                  </p>
                ) : (
                  categoryBreakdown.items.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-slate-600 dark:text-zinc-300 truncate" title={cat.name}>
                          {cat.name}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0 font-sans">
                        <span className="text-[11px] text-slate-400">({cat.count} ca)</span>
                        <span className="font-bold text-slate-900 dark:text-white min-w-[32px] text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dynamic AI Business Suggestion */}
          <div className="mt-4 p-3 rounded-xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/50 text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <span>
              {categoryBreakdown.items.length > 0 ? (
                <>
                  <strong>Gợi ý kinh doanh:</strong> Gói <strong>{categoryBreakdown.items[0].name}</strong> đang mang lại tỷ trọng cao nhất ({categoryBreakdown.items[0].percentage}% tổng số show). Đề xuất đẩy mạnh marketing và mở thêm khung giờ chụp cho nhóm này.
                </>
              ) : (
                <>
                  <strong>Gợi ý kinh doanh:</strong> Khi hoàn thành các lịch chụp mới, hệ thống sẽ tự động tổng hợp cơ cấu dịch vụ và đề xuất phương án tối ưu doanh thu.
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Equipment ROI & Khấu Hao Matrix (Dữ liệu thực từ Supabase) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Theo Dõi Hoàn Vốn & Khấu Hao Thiết Bị (Equipment ROI Matrix)
            </h3>
            <p className="text-xs text-slate-400">
              Tỷ suất sinh lời thực tế trên giá mua ban đầu của từng máy ảnh, ống kính và đèn studio đã đăng ký
            </p>
          </div>

          <Link
            to="/dashboard/gears"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-orange-500" />
            <span>Quản Lý Thiết Bị ({realGears.length})</span>
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {isLoadingGears ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
              <span>Đang tải danh sách thiết bị thực tế...</span>
            </div>
          ) : gearROI.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-zinc-800 text-orange-500 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Chưa có thiết bị nào trong kho</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Hãy thêm các dòng máy ảnh, ống kính và đèn studio trong mục "Quản Lý Thiết Bị" để Lensy tự động theo dõi tỷ suất sinh lời và hoàn vốn.
                </p>
              </div>
              <Link
                to="/dashboard/gears"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Thiết Bị Vào Hệ Thống</span>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-[11px] font-extrabold uppercase text-slate-400">
                  <th className="py-2.5 px-3">TÊN THIẾT BỊ</th>
                  <th className="py-2.5 px-3">PHÂN LOẠI</th>
                  <th className="py-2.5 px-3 text-right">GIÁ GỐC ĐẦU TƯ</th>
                  <th className="py-2.5 px-3 text-center">SỐ CA ĐÃ DÙNG</th>
                  <th className="py-2.5 px-3 text-right">DOANH THU SINH LỜI</th>
                  <th className="py-2.5 px-3 text-right">TỶ SUẤT HOÀN VỐN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {gearROI.map(gear => (
                  <tr key={gear.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{gear.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 text-xs">
                      {gear.category}
                    </td>
                    <td className="py-3 px-3 text-right font-sans font-bold text-slate-800 dark:text-zinc-200 tabular-nums">
                      {gear.purchasePrice > 0 ? formatVND(gear.purchasePrice) : 'Chưa nhập giá'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-zinc-200 tabular-nums">
                      {gear.totalShoots} ca
                    </td>
                    <td className="py-3 px-3 text-right font-sans font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatVND(gear.estimatedEarned)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              gear.paybackRate >= 80 ? 'bg-emerald-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${gear.paybackRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs font-sans tabular-nums text-slate-900 dark:text-white min-w-[36px]">
                          {gear.paybackRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
