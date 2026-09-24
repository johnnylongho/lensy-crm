import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import { TrendingUp, Wallet, Receipt, DollarSign, Sparkles, Filter } from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  className?: string;
}

export const ProfitTrendChart: React.FC<Props> = ({ events, className = '' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'recent'>('recent');

  // Lọc và sắp xếp các sự kiện theo thứ tự thời gian tăng dần
  const validEvents = events
    .filter(e => e.eventDate)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const displayEvents = filterMode === 'recent' ? validEvents.slice(-7) : validEvents;

  // Tính toán dữ liệu tài chính cho từng show
  const chartData = displayEvents.map(e => {
    const gross = Number(e.paidAmount || e.depositAmount || 0);
    const expenses = Number(e.expenses || 0);
    const net = gross - expenses;
    return {
      id: e.id,
      clientName: e.clientName,
      date: e.eventDate,
      gross,
      expenses,
      net,
    };
  });

  // Tổng hợp metrics
  const totalGross = chartData.reduce((sum, d) => sum + d.gross, 0);
  const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
  const totalNetProfit = totalGross - totalExpenses;
  const netMargin = totalGross > 0 ? Math.round((totalNetProfit / totalGross) * 100) : 0;
  const avgNetPerShow = chartData.length > 0 ? Math.round(totalNetProfit / chartData.length) : 0;

  // SVG Chart Scaling
  const width = 760;
  const height = 240;
  const paddingX = 45;
  const paddingY = 35;

  // Tìm min/max để vẽ scale
  const allValues = chartData.flatMap(d => [d.gross, d.expenses, d.net]);
  const maxValue = Math.max(1000000, ...allValues);
  const minValue = Math.min(0, ...allValues);
  const range = maxValue - minValue || 1;

  const getX = (index: number) => {
    if (chartData.length <= 1) return width / 2;
    return paddingX + (index / (chartData.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    const ratio = (val - minValue) / range;
    return height - paddingY - ratio * (height - 2 * paddingY);
  };

  // Tạo đường dẫn SVG Path
  const makePath = (key: 'gross' | 'expenses' | 'net') => {
    if (chartData.length === 0) return '';
    return chartData.reduce((acc, d, i) => {
      const x = getX(i);
      const y = getY(d[key]);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Tạo vùng diện tích tô màu cho Lợi Nhuận Ròng (Area Fill)
  const makeAreaPath = () => {
    if (chartData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(chartData.length - 1);
    const baseY = getY(0);
    const linePath = chartData.reduce((acc, d, i) => {
      const x = getX(i);
      const y = getY(d.net);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const netPath = makePath('net');
  const grossPath = makePath('gross');
  const expensesPath = makePath('expenses');
  const netAreaPath = makeAreaPath();

  return (
    <div className={`rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 ${className}`}>
      {/* Chart Header & Summary Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Biểu Đồ Lợi Nhuận Ròng Theo Show (Net Profit Stream)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Tiền Thật Bỏ Túi</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Đường xanh lá cây phản ánh lợi nhuận thực tế sau khi trừ toàn bộ chi phí makeup, studio, trợ lý...
            </p>
          </div>
        </div>

        {/* View Filter Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('recent')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'recent'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Show Gần Nhất
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất Cả ({validEvents.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase block tracking-wider">
            Tổng Lợi Nhuận Ròng
          </span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono">
            {totalNetProfit.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[10px] text-slate-400 block">Thực thu sau chi phí</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] font-bold text-sky-400 uppercase block tracking-wider">
            Doanh Thu (Gross)
          </span>
          <span className="text-base sm:text-lg font-extrabold text-sky-300 font-mono">
            {totalGross.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[10px] text-slate-400 block">Số tiền khách đã trả</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] font-bold text-rose-400 uppercase block tracking-wider">
            Chi Phí Show
          </span>
          <span className="text-base sm:text-lg font-extrabold text-rose-400 font-mono">
            -{totalExpenses.toLocaleString('vi-VN')} đ
          </span>
          <span className="text-[10px] text-slate-400 block">Tổng các khoản chi</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] font-bold text-amber-400 uppercase block tracking-wider">
            Tỷ Suất Lợi Nhuận
          </span>
          <span className="text-base sm:text-lg font-extrabold text-amber-300 font-mono">
            {netMargin}%
          </span>
          <span className="text-[10px] text-slate-400 block">TB: {avgNetPerShow.toLocaleString('vi-VN')} đ/show</span>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Emerald Gradient cho Area Fill của Lợi Nhuận Ròng */}
            <linearGradient id="netProfitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing filter cho đường Lợi Nhuận Ròng */}
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10b981" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Grid lines ngang */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const val = minValue + (1 - pct) * range;
            const y = paddingY + pct * (height - 2 * paddingY);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                  opacity={idx === 4 ? 0.6 : 0.25}
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {Math.round(val / 1000000 * 10) / 10}tr
                </text>
              </g>
            );
          })}

          {/* Đường baseline 0 đ */}
          <line
            x1={paddingX}
            y1={getY(0)}
            x2={width - paddingX}
            y2={getY(0)}
            stroke="#475569"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* 1. Area Fill: Lợi Nhuận Ròng (Highlight hàng đầu) */}
          {netAreaPath && (
            <path d={netAreaPath} fill="url(#netProfitGradient)" />
          )}

          {/* 2. Đường phụ: Doanh Thu Gross (Blue dashed) */}
          {grossPath && (
            <path
              d={grossPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.6"
            />
          )}

          {/* 3. Đường phụ: Chi Phí Show (Rose dotted) */}
          {expensesPath && (
            <path
              d={expensesPath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="2 3"
              opacity="0.6"
            />
          )}

          {/* 4. ĐƯỜNG CHÍNH: LỢI NHUẬN RÒNG (TIỀN THẬT BỎ TÚI) - Rực rỡ, stroke dày 3.5, glow effect */}
          {netPath && (
            <path
              d={netPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#emeraldGlow)"
            />
          )}

          {/* Các điểm dữ liệu & Tương tác hover */}
          {chartData.map((d, idx) => {
            const x = getX(idx);
            const yNet = getY(d.net);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Vertical indicator bar khi hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                )}

                {/* Point Lợi Nhuận Ròng */}
                <circle
                  cx={x}
                  cy={yNet}
                  r={isHovered ? 7 : 4.5}
                  fill="#10b981"
                  stroke="#022c22"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                {isHovered && (
                  <circle
                    cx={x}
                    cy={yNet}
                    r="10"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    opacity="0.5"
                    className="animate-ping"
                  />
                )}

                {/* X-axis date labels */}
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fill={isHovered ? '#34d399' : '#64748b'}
                  fontSize="9.5"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {d.date.substring(5)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredIndex !== null && chartData[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-950/95 border-2 border-emerald-500/80 shadow-2xl space-y-1.5 transition-all text-xs"
            style={{
              left: `${Math.min(75, Math.max(15, (getX(hoveredIndex) / width) * 100))}%`,
              top: '15px',
              transform: 'translateX(-50%)',
              minWidth: '200px',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-semibold">
              <span className="text-white truncate max-w-[120px]">
                {chartData[hoveredIndex].clientName}
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                {chartData[hoveredIndex].date}
              </span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-sky-400">
                <span>Doanh thu khách trả:</span>
                <strong>{chartData[hoveredIndex].gross.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Chi phí phát sinh:</span>
                <strong>-{chartData[hoveredIndex].expenses.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 text-emerald-400 font-bold text-xs">
                <span>Lợi Nhuận Ròng:</span>
                <span>{chartData[hoveredIndex].net.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs font-semibold">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
          <span className="w-3 h-1 bg-emerald-400 rounded-full shadow-sm" />
          <span>Lợi Nhuận Ròng (Tiền Thật Bỏ Túi)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sky-400">
          <span className="w-3 h-0.5 bg-sky-400 border-dashed" />
          <span>Tổng Doanh Thu (Gross)</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-rose-400">
          <span className="w-3 h-0.5 bg-rose-400 border-dotted" />
          <span>Chi Phí Show</span>
        </div>
      </div>
    </div>
  );
};
