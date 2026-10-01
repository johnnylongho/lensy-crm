import React, { useState, useMemo } from 'react';
import {
  Camera,
  Calendar,
  Layers,
  Users,
  Settings,
  SlidersHorizontal,
  ChevronDown,
  Search,
  Plus,
  Clock,
  MapPin,
  MoreVertical,
  X,
  Briefcase,
  Menu,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Filter,
  Eye,
  Phone,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

// --- TYPES ---
type NavigationTab = 'Dashboard' | 'Calendar' | 'Bookings' | 'Clients' | 'Gear' | 'Settings';
type BookingStatus = 'Deposited' | 'Done' | 'In Progress';

interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  package: 'Wedding' | 'Portrait' | 'Lookbook' | 'Commercial' | 'Pre-Wedding';
  photographer: string;
  date: string;
  time: string;
  location: string;
  status: BookingStatus;
  amount: number;
  depositPaid: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  tasksCompleted: number;
  avatarUrl?: string;
}

// --- MOCK DATA ---
const TOP_STAFF: StaffMember[] = [
  {
    id: 's1',
    name: 'Louis Gutkowski',
    role: 'Lead Wedding Photographer',
    avatarBg: 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white',
    tasksCompleted: 314
  },
  {
    id: 's2',
    name: 'Marlene Kuhlman',
    role: 'Senior Portrait & Fashion',
    avatarBg: 'bg-gradient-to-tr from-stone-600 to-stone-400 text-white',
    tasksCompleted: 309
  },
  {
    id: 's3',
    name: 'Kristi Lueilwitz',
    role: 'Commercial & Editorial',
    avatarBg: 'bg-gradient-to-tr from-orange-600 to-orange-400 text-white',
    tasksCompleted: 289
  },
  {
    id: 's4',
    name: 'Abel Pollich',
    role: 'Head MUA & Stylist',
    avatarBg: 'bg-gradient-to-tr from-zinc-700 to-zinc-500 text-white',
    tasksCompleted: 242
  }
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'OM1246924',
    clientName: 'Judy Abbott & Thanh Long',
    clientPhone: '0908 123 456',
    package: 'Wedding',
    photographer: 'Louis Gutkowski',
    date: '2026-10-04',
    time: '08:00 - 15:00',
    location: 'Studio Bay 1 & Sanctuary Garden',
    status: 'Deposited',
    amount: 32000000,
    depositPaid: 16000000
  },
  {
    id: 'OM1243473',
    clientName: 'Martin Feeney',
    clientPhone: '0912 345 678',
    package: 'Portrait',
    photographer: 'Marlene Kuhlman',
    date: '2026-10-02',
    time: '14:30 - 17:00',
    location: 'Cyclorama White Bay',
    status: 'Done',
    amount: 4500000,
    depositPaid: 4500000
  },
  {
    id: 'OM4637343',
    clientName: 'Ellen Streich (IVY Lookbook)',
    clientPhone: '0988 889 912',
    package: 'Lookbook',
    photographer: 'Kristi Lueilwitz',
    date: '2026-10-01',
    time: '09:00 - 18:00',
    location: 'Daylight Industrial Loft',
    status: 'In Progress',
    amount: 24000000,
    depositPaid: 12000000
  },
  {
    id: 'OM1535524',
    clientName: 'Ellis Lubowitz',
    clientPhone: '0934 567 890',
    package: 'Portrait',
    photographer: 'Abel Pollich',
    date: '2026-09-29',
    time: '10:00 - 12:00',
    location: 'Executive Dark Studio',
    status: 'Done',
    amount: 3800000,
    depositPaid: 3800000
  },
  {
    id: 'OM1456921',
    clientName: 'Dora Kovacek & Gia Huy',
    clientPhone: '0977 112 233',
    package: 'Pre-Wedding',
    photographer: 'Louis Gutkowski',
    date: '2026-09-28',
    time: '06:00 - 14:00',
    location: 'Ninh Binh Outdoor Reserve',
    status: 'Deposited',
    amount: 18500000,
    depositPaid: 9500000
  },
  {
    id: 'OM1948210',
    clientName: 'Bloom Jewelry Studio',
    clientPhone: '0903 445 566',
    package: 'Commercial',
    photographer: 'Kristi Lueilwitz',
    date: '2026-09-26',
    time: '13:00 - 17:00',
    location: 'Macro Table Studio A',
    status: 'Done',
    amount: 8200000,
    depositPaid: 8200000
  }
];

// Recharts data formatted with max background bar and current fill
const CHART_DATA_6M = [
  { month: 'Feb', track: 100, fill: 55, amount: '98,000,000 ₫' },
  { month: 'Mar', track: 100, fill: 82, amount: '132,000,000 ₫' },
  { month: 'Apr', track: 100, fill: 68, amount: '115,000,000 ₫' },
  { month: 'May', track: 100, fill: 76, amount: '128,000,000 ₫' },
  { month: 'Jun', track: 100, fill: 42, amount: '86,000,000 ₫' },
  { month: 'Jul', track: 100, fill: 94, amount: '145,000,000 ₫' }
];

const CHART_DATA_3M = [
  { month: 'May', track: 100, fill: 76, amount: '128,000,000 ₫' },
  { month: 'Jun', track: 100, fill: 42, amount: '86,000,000 ₫' },
  { month: 'Jul', track: 100, fill: 94, amount: '145,000,000 ₫' }
];

// Currency Formatter
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('Dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [chartPeriod, setChartPeriod] = useState<'3m' | '6m'>('3m');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  // New Booking State
  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPackage, setNewPackage] = useState<Booking['package']>('Wedding');
  const [newPhotographer, setNewPhotographer] = useState('Louis Gutkowski');
  const [newDate, setNewDate] = useState('2026-10-15');
  const [newTime, setNewTime] = useState('08:00 - 14:00');
  const [newAmount, setNewAmount] = useState('22000000');
  const [newDeposit, setNewDeposit] = useState('11000000');

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.photographer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const activeChartData = chartPeriod === '3m' ? CHART_DATA_3M : CHART_DATA_6M;

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newEntry: Booking = {
      id: `OM${Math.floor(1000000 + Math.random() * 9000000)}`,
      clientName: newClientName,
      clientPhone: newPhone || '0908 000 000',
      package: newPackage,
      photographer: newPhotographer,
      date: newDate,
      time: newTime,
      location: 'Studio Cyclorama Bay 1',
      status: 'Deposited',
      amount: parseInt(newAmount, 10) || 15000000,
      depositPaid: parseInt(newDeposit, 10) || 5000000
    };

    setBookings([newEntry, ...bookings]);
    setIsNewBookingModalOpen(false);
    setNewClientName('');
    setNewPhone('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#eed7c7] via-[#f7e8dc] to-[#e4cbbe] p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#df8653] selection:text-white">
      {/* Decorative Warm Ambient Light Orbs for Glassmorphism Depth */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#f8baa0]/40 to-transparent blur-[120px]" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[650px] w-[650px] rounded-full bg-gradient-to-tl from-[#e8a382]/35 via-[#f0c3aa]/20 to-transparent blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#deb199]/40 to-transparent blur-[120px]" />

      {/* Decorative Ribbon curve behind the glass sheet matching reference */}
      <div className="pointer-events-none fixed top-10 left-10 h-full w-full opacity-30">
        <svg
          viewBox="0 0 1200 900"
          fill="none"
          className="h-full w-full stroke-orange-300/40"
          strokeWidth="6"
        >
          <path d="M-100,500 C200,300 400,750 800,400 C1100,100 1300,500 1500,300" />
          <path d="M-50,550 C250,350 450,800 850,450 C1150,150 1350,550 1550,350" strokeWidth="2" strokeDasharray="8 8" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* MAIN FROSTED GLASS CONTAINER */}
      {/* ========================================================================= */}
      <div className="relative mx-auto max-w-[1480px] rounded-[32px] sm:rounded-[38px] border border-white/60 bg-white/45 p-4 sm:p-6 lg:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(150,90,60,0.12),0_10px_25px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ===================================================================== */}
          {/* 1. LEFT SIDEBAR */}
          {/* ===================================================================== */}
          <aside className="lg:w-60 shrink-0">
            {/* Logo / Brand Header */}
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#c86d3b] to-[#e49366] text-white shadow-[0_4px_14px_rgba(200,109,59,0.35)]">
                  <Camera className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[#1b2234]">
                    Lensy
                  </h1>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b776a]">
                    Studio CRM
                  </p>
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden rounded-xl border border-white/60 bg-white/60 p-2 text-[#463d36] backdrop-blur-md"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Menus */}
            <div
              className={`space-y-6 lg:block ${
                isMobileMenuOpen ? 'block' : 'hidden'
              }`}
            >
              {/* Main Menu */}
              <div>
                <div className="px-3 mb-2.5 text-[11px] font-semibold tracking-wider text-[#98877b]">
                  Main Menu
                </div>
                <nav className="space-y-1">
                  {[
                    { name: 'Dashboard', icon: Layers },
                    { name: 'Calendar', icon: Calendar },
                    { name: 'Bookings', icon: Briefcase, count: bookings.length },
                    { name: 'Clients', icon: Users },
                    { name: 'Gear', icon: SlidersHorizontal },
                    { name: 'Settings', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveTab(item.name as NavigationTab);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'border border-white/90 bg-white/85 text-[#1a2030] shadow-[0_4px_16px_rgba(180,140,120,0.15)] backdrop-blur-md'
                            : 'text-[#5d564f] hover:bg-white/40 hover:text-[#1a2030]'
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors ${
                            isActive
                              ? 'bg-[#1b2234] text-white shadow-xs'
                              : 'text-[#7d7167] group-hover:text-[#1a2030]'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{item.name}</span>
                        {item.count !== undefined && (
                          <span className="ml-auto text-[11px] rounded-full bg-white/70 px-2 py-0.5 font-bold text-[#8a5b3a] border border-white/80">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Team Management Sub-menu matching image */}
              <div>
                <div className="px-3 mb-2.5 text-[11px] font-semibold tracking-wider text-[#98877b]">
                  Team Management
                </div>
                <div className="space-y-1 text-sm font-medium text-[#5d564f]">
                  {[
                    { label: 'Performance', icon: TrendingUp },
                    { label: 'Shoot Rosters', icon: Briefcase },
                    { label: 'Invoices & Deposit', icon: DollarSign },
                    { label: 'Crew & MUA', icon: Users }
                  ].map((sub, idx) => {
                    const Icon = sub.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveTab('Dashboard')}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-xs text-[#5d564f] hover:bg-white/35 hover:text-[#1a2030] transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-[#8f7e73]" />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Studio Bays Status Pill */}
              <div className="rounded-2xl border border-white/60 bg-white/40 p-3.5 backdrop-blur-md shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-[#2a241f] mb-2">
                  <span>Studio Bays</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 border border-emerald-300/40 rounded-full px-2 py-0.5">
                    2/3 Available
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-[#554b43]">
                    <span>Bay 1 (Cyclorama)</span>
                    <span className="font-semibold text-[#c86d3b]">In Shoot</span>
                  </div>
                  <div className="flex justify-between items-center text-[#554b43]">
                    <span>Bay 2 (Daylight Loft)</span>
                    <span className="font-semibold text-emerald-600">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ===================================================================== */}
          {/* 2. MAIN CONTENT AREA */}
          {/* ===================================================================== */}
          <main className="flex-1 space-y-6">
            {/* Header: Title + Profile Pill (matching reference image) */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-[#1b2234]">
                  {activeTab}
                </h2>
              </div>

              {/* Profile Card Pill in top right */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsNewBookingModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#df8653] to-[#c86d3b] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(200,109,59,0.35)] hover:brightness-105 transition-all"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>New Booking</span>
                </button>

                <div className="flex items-center gap-2.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#3a445d] to-[#1e2538] text-xs font-bold text-white shadow-xs">
                    CS
                  </div>
                  <span className="text-xs font-bold text-[#1b2234]">
                    Carla Sanford
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#7c7066]" />
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* PRIMARY VIEW: DASHBOARD */}
            {/* =================================================================== */}
            {activeTab === 'Dashboard' && (
              <>
                {/* 3 TOP METRIC CARDS (Frosted glass with circular icons) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Total Revenue */}
                  <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/60 p-4 shadow-[0_4px_20px_rgba(180,140,120,0.08)] backdrop-blur-xl">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f5d9c7] to-[#faeee5] text-[#b86333] shadow-xs border border-white/90">
                      <DollarSign className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#8b796d]">
                        Total Revenue
                      </div>
                      <div className="text-xl font-bold tracking-tight text-[#1b2234] tabular-nums">
                        145,000,000 ₫
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Active Bookings */}
                  <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/60 p-4 shadow-[0_4px_20px_rgba(180,140,120,0.08)] backdrop-blur-xl">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f5d9c7] to-[#faeee5] text-[#b86333] shadow-xs border border-white/90">
                      <Briefcase className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#8b796d]">
                        Active Bookings
                      </div>
                      <div className="text-xl font-bold tracking-tight text-[#1b2234] tabular-nums">
                        24 shows
                      </div>
                    </div>
                  </div>

                  {/* Card 3: New Clients */}
                  <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/60 p-4 shadow-[0_4px_20px_rgba(180,140,120,0.08)] backdrop-blur-xl">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f5d9c7] to-[#faeee5] text-[#b86333] shadow-xs border border-white/90">
                      <Users className="h-5 w-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#8b796d]">
                        New Clients
                      </div>
                      <div className="text-xl font-bold tracking-tight text-[#1b2234] tabular-nums">
                        12
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* MIDDLE ROW: MAIN CHART AREA + DARK "UPCOMING SHOOTS" COLUMN */}
                {/* ================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (8 cols): Revenue Overview + Top Photographers */}
                  <div className="lg:col-span-8 rounded-3xl border border-white/80 bg-white/65 p-6 shadow-[0_6px_24px_rgba(180,140,120,0.09)] backdrop-blur-xl flex flex-col justify-between">
                    {/* Top bar of chart */}
                    <div className="flex items-center justify-between pb-4">
                      <div>
                        <h3 className="text-base font-bold text-[#1b2234]">
                          Revenue Overview
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-extrabold text-[#1b2234] tracking-tight tabular-nums">
                            63.89%
                          </span>
                          <span className="text-xs font-semibold text-[#df6845]">
                            - 2.34%
                          </span>
                        </div>
                      </div>

                      {/* Filter pill (Past 3 months) */}
                      <div className="flex items-center rounded-xl border border-white/90 bg-white/80 p-1 shadow-xs">
                        <button
                          onClick={() => setChartPeriod('3m')}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                            chartPeriod === '3m'
                              ? 'bg-[#1b2234] text-white shadow-xs'
                              : 'text-[#6b5f56] hover:text-[#1b2234]'
                          }`}
                        >
                          Past 3 months
                        </button>
                        <button
                          onClick={() => setChartPeriod('6m')}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                            chartPeriod === '6m'
                              ? 'bg-[#1b2234] text-white shadow-xs'
                              : 'text-[#6b5f56] hover:text-[#1b2234]'
                          }`}
                        >
                          Past 6 months
                        </button>
                      </div>
                    </div>

                    {/* Chart & Top Performance Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                      {/* Bar Chart (7 cols) */}
                      <div className="md:col-span-7 h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={activeChartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <XAxis
                              dataKey="month"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#8b7c72', fontSize: 12, fontWeight: 500 }}
                            />
                            <YAxis
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                              tickFormatter={(val) => `${val}%`}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#8b7c72', fontSize: 11 }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="rounded-xl border border-white/80 bg-white/90 p-2.5 shadow-md backdrop-blur-md text-xs">
                                      <div className="font-bold text-[#1b2234]">{d.month} 2026</div>
                                      <div className="mt-1 text-[#c86d3b] font-semibold">{d.amount}</div>
                                      <div className="text-[11px] text-[#7d7168]">Fulfillment: {d.fill}%</div>
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
                            {/* Foreground Fill Bar (overlap) */}
                            <Bar
                              dataKey="fill"
                              fill="#df8653"
                              radius={[10, 10, 10, 10]}
                              barSize={14}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Top Performance Inset White Card (5 cols) matching reference */}
                      <div className="md:col-span-5 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_4px_16px_rgba(180,140,120,0.06)] backdrop-blur-md">
                        <div className="text-xs font-bold text-[#1b2234] mb-3">
                          Top Photographers / MUA
                        </div>
                        <div className="space-y-3">
                          {TOP_STAFF.map((staff, idx) => (
                            <div key={staff.id} className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-xs ${staff.avatarBg}`}
                                >
                                  {staff.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1b2234] text-[9px] font-bold text-white">
                                  {idx + 1}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-[#1b2234] truncate">
                                  {staff.name}
                                </div>
                                <div className="text-[11px] text-[#85766c] truncate">
                                  {staff.tasksCompleted} tasks completed
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
                    {/* Dark Card ("Upcoming Shoots") - Exact visual match */}
                    <div className="relative overflow-hidden rounded-3xl bg-[#1b1c20] p-6 text-white shadow-[0_15px_35px_rgba(20,20,30,0.3)] border border-white/10">
                      {/* Top right warm copper radial flare matching image */}
                      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#df8653]/45 to-transparent blur-2xl" />

                      <h3 className="text-lg font-bold text-white mb-5">
                        Upcoming Shoots
                      </h3>

                      <div className="space-y-5">
                        {/* Shoot Item 1 */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                            <h4 className="text-xs font-semibold text-white">
                              Project Wedding - Studio A
                            </h4>
                          </div>
                          <div className="pl-3.5 mt-0.5 text-[11px] text-zinc-400">
                            Today 08:00 - 15:00
                          </div>
                          <div className="pl-3.5 mt-2 flex items-center -space-x-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              LG
                            </div>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-700 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              AP
                            </div>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-600 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              MK
                            </div>
                          </div>
                        </div>

                        {/* Shoot Item 2 */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                            <h4 className="text-xs font-semibold text-white">
                              Editorial Portrait - Cyclorama
                            </h4>
                          </div>
                          <div className="pl-3.5 mt-0.5 text-[11px] text-zinc-400">
                            Today 14:30 - 17:00
                          </div>
                          <div className="pl-3.5 mt-2 flex items-center -space-x-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-600 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              MK
                            </div>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              KL
                            </div>
                          </div>
                        </div>

                        {/* Shoot Item 3 */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                            <h4 className="text-xs font-semibold text-white">
                              Fashion Lookbook - Daylight Loft
                            </h4>
                          </div>
                          <div className="pl-3.5 mt-0.5 text-[11px] text-zinc-400">
                            Tomorrow 09:00 - 18:00
                          </div>
                          <div className="pl-3.5 mt-2 flex items-center -space-x-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              KL
                            </div>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white ring-2 ring-[#1b1c20]">
                              LG
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Working Format / Shoot Format Section (Exact visual match from image) */}
                    <div className="space-y-3">
                      <h4 className="text-base font-bold text-[#1b2234]">
                        Shoot Formats
                      </h4>

                      {/* Format 1: On-site */}
                      <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-gradient-to-r from-white/60 to-white/40 p-3.5 backdrop-blur-md shadow-xs">
                        <div>
                          <div className="text-[11px] text-[#7d6f65]">In-Studio</div>
                          <div className="text-sm font-extrabold text-[#1b2234] tabular-nums">
                            13,982
                          </div>
                        </div>
                        <div className="text-base font-extrabold text-[#df8653] tabular-nums">
                          11.4%
                        </div>
                      </div>

                      {/* Format 2: Hybrid */}
                      <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-gradient-to-r from-white/60 to-white/40 p-3.5 backdrop-blur-md shadow-xs">
                        <div>
                          <div className="text-[11px] text-[#7d6f65]">Location & Outdoor</div>
                          <div className="text-sm font-extrabold text-[#1b2234] tabular-nums">
                            26,214
                          </div>
                        </div>
                        <div className="text-base font-extrabold text-[#df8653] tabular-nums">
                          32.2%
                        </div>
                      </div>

                      {/* Format 3: Destination */}
                      <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-gradient-to-r from-white/60 to-white/40 p-3.5 backdrop-blur-md shadow-xs">
                        <div>
                          <div className="text-[11px] text-[#7d6f65]">Destination Wedding</div>
                          <div className="text-sm font-extrabold text-[#1b2234] tabular-nums">
                            41,214
                          </div>
                        </div>
                        <div className="text-base font-extrabold text-[#df8653] tabular-nums">
                          56.4%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* BOTTOM TABLE: RECENT BOOKINGS (Employees in original image) */}
                {/* ================================================================= */}
                <div className="rounded-3xl border border-white/80 bg-white/65 p-6 shadow-[0_6px_24px_rgba(180,140,120,0.08)] backdrop-blur-xl">
                  {/* Table Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#1b2234]">
                        Recent Bookings
                      </h3>
                      <p className="text-xs text-[#827367]">
                        Track studio packages, confirmed deposits, and photographer allocations.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b796d]" />
                        <input
                          type="text"
                          placeholder="Search bookings..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8 rounded-xl border border-white/80 bg-white/80 pl-8 pr-3 text-xs text-[#1b2234] placeholder-[#a6988f] focus:outline-hidden focus:ring-1 focus:ring-[#df8653]"
                        />
                      </div>

                      {/* Status filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-8 rounded-xl border border-white/80 bg-white/80 px-3 text-xs font-semibold text-[#5a4e44] focus:outline-hidden"
                      >
                        <option value="All">All Status</option>
                        <option value="Deposited">Deposited</option>
                        <option value="Done">Done</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#ebdcd1] text-[11px] font-semibold text-[#8b796d]">
                          <th className="pb-3 pt-1 font-semibold">ID</th>
                          <th className="pb-3 pt-1 font-semibold">Name</th>
                          <th className="pb-3 pt-1 font-semibold">Package / Role</th>
                          <th className="pb-3 pt-1 font-semibold">Status</th>
                          <th className="pb-3 pt-1 font-semibold text-right">Total Amount</th>
                          <th className="pb-3 pt-1 font-semibold text-center">...</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2e7df]">
                        {filteredBookings.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            className="cursor-pointer hover:bg-white/50 transition-colors"
                          >
                            {/* ID */}
                            <td className="py-3.5 font-mono text-[11px] font-bold text-[#1b2234]">
                              {b.id}
                            </td>

                            {/* Client Name */}
                            <td className="py-3.5 font-bold text-[#1b2234]">
                              {b.clientName}
                            </td>

                            {/* Package */}
                            <td className="py-3.5 text-[#5d5248] font-medium">
                              {b.package} · {b.photographer}
                            </td>

                            {/* Status (Badge matching reference image pills/performance) */}
                            <td className="py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  b.status === 'Done'
                                    ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-300/50'
                                    : b.status === 'Deposited'
                                    ? 'bg-amber-100/80 text-amber-900 border border-amber-300/50'
                                    : 'bg-orange-100/80 text-orange-900 border border-orange-300/50'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    b.status === 'Done'
                                      ? 'bg-emerald-600'
                                      : b.status === 'Deposited'
                                      ? 'bg-amber-600'
                                      : 'bg-orange-600'
                                  }`}
                                />
                                {b.status}
                              </span>
                            </td>

                            {/* Total Amount */}
                            <td className="py-3.5 text-right font-mono font-bold text-[#1b2234] tabular-nums">
                              {formatVND(b.amount)}
                            </td>

                            {/* Action ... */}
                            <td className="py-3.5 text-center text-[#8b796d]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(b);
                                }}
                                className="rounded-lg p-1 hover:bg-white/80"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* =================================================================== */}
            {/* VIEW: CALENDAR */}
            {/* =================================================================== */}
            {activeTab === 'Calendar' && (
              <div className="rounded-3xl border border-white/80 bg-white/65 p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-[#ebdcd1]">
                  <div>
                    <h3 className="text-lg font-bold text-[#1b2234]">
                      Studio Production Calendar — October 2026
                    </h3>
                    <p className="text-xs text-[#827367]">
                      Bay bookings and crew assignments.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="rounded-xl bg-[#1b2234] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs"
                  >
                    + Book Bay
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mt-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div
                      key={d}
                      className="p-2 text-center text-xs font-bold uppercase text-[#8b796d]"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const matches = bookings.filter((b) => parseInt(b.date.split('-')[2], 10) === day);
                    const isToday = day === 1;
                    return (
                      <div
                        key={day}
                        className={`min-h-[85px] rounded-2xl border p-2 text-xs transition-all ${
                          isToday
                            ? 'border-[#df8653] bg-white/90 shadow-sm'
                            : 'border-white/60 bg-white/45'
                        }`}
                      >
                        <div className="font-bold text-[#1b2234] flex justify-between">
                          <span>{day}</span>
                          {isToday && <span className="text-[10px] text-[#df8653]">Today</span>}
                        </div>
                        <div className="mt-1 space-y-1">
                          {matches.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => setSelectedBooking(m)}
                              className="cursor-pointer truncate rounded-lg bg-[#faede6] border border-[#f0d4c4] px-1.5 py-0.5 text-[10px] font-bold text-[#a0522a]"
                            >
                              {m.clientName.split(' ')[0]} ({m.package})
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW: BOOKINGS */}
            {/* =================================================================== */}
            {activeTab === 'Bookings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1b2234]">
                    All Studio Bookings ({bookings.length})
                  </h3>
                  <button
                    onClick={() => setIsNewBookingModalOpen(true)}
                    className="rounded-2xl bg-gradient-to-r from-[#df8653] to-[#c86d3b] px-4 py-2 text-xs font-bold text-white shadow-md"
                  >
                    + New Booking
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBooking(item)}
                      className="cursor-pointer rounded-2xl border border-white/80 bg-white/65 p-5 backdrop-blur-xl shadow-xs hover:bg-white/80 transition-all"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-[#df8653]">{item.id}</span>
                        <span className="font-semibold text-[#8b796d]">{item.package}</span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-[#1b2234]">
                        {item.clientName}
                      </h4>
                      <p className="text-xs text-[#73655a] mt-1">{item.location}</p>
                      <div className="mt-4 pt-3 border-t border-white/80 flex justify-between items-center text-xs">
                        <span className="text-[#8b796d]">Total:</span>
                        <span className="font-mono font-bold text-[#1b2234]">{formatVND(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW: CLIENTS */}
            {/* =================================================================== */}
            {activeTab === 'Clients' && (
              <div className="rounded-3xl border border-white/80 bg-white/65 p-6 backdrop-blur-xl shadow-sm">
                <h3 className="text-lg font-bold text-[#1b2234] mb-4">Client Accounts</h3>
                <div className="divide-y divide-[#f0e2d8]">
                  {bookings.map((c) => (
                    <div key={c.id} className="py-3 flex justify-between items-center flex-wrap gap-2 text-xs">
                      <div>
                        <div className="font-bold text-[#1b2234]">{c.clientName}</div>
                        <div className="text-[11px] text-[#8b796d]">{c.clientPhone} · {c.package}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-[#1b2234]">{formatVND(c.amount)}</span>
                        <button
                          onClick={() => setSelectedBooking(c)}
                          className="rounded-xl border border-white/80 bg-white/80 px-3 py-1 font-semibold text-[#483d34] shadow-xs"
                        >
                          View Contract
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW: GEAR */}
            {/* =================================================================== */}
            {activeTab === 'Gear' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Sony A7R V (Body #1)', status: 'In Shoot', bay: 'Bay 1' },
                  { name: 'Sony FE 50mm f/1.2 GM', status: 'In Shoot', bay: 'Bay 1' },
                  { name: 'Profoto B10X Plus Kit', status: 'Ready', bay: 'Locker' },
                  { name: 'Aputure 600d Pro LED', status: 'Ready', bay: 'Locker' },
                  { name: 'Sony A7S III (Video)', status: 'Ready', bay: 'Locker' },
                  { name: 'Sony FE 24-70mm GM II', status: 'Ready', bay: 'Locker' }
                ].map((g, i) => (
                  <div key={i} className="rounded-2xl border border-white/80 bg-white/65 p-4 backdrop-blur-xl shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#1b2234]">{g.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${g.status === 'In Shoot' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                        {g.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[#8b796d]">Location: {g.bay}</div>
                  </div>
                ))}
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW: SETTINGS */}
            {/* =================================================================== */}
            {activeTab === 'Settings' && (
              <div className="max-w-xl rounded-3xl border border-white/80 bg-white/65 p-6 backdrop-blur-xl shadow-sm text-xs space-y-4">
                <h3 className="text-lg font-bold text-[#1b2234]">Studio Configurations</h3>
                <div>
                  <label className="block font-semibold text-[#5a4e44] mb-1">Studio Name</label>
                  <input
                    type="text"
                    defaultValue="Lensy Photography Studio"
                    className="w-full rounded-xl border border-white/80 bg-white/80 p-2.5 text-xs text-[#1b2234]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5a4e44] mb-1">Standard Deposit</label>
                  <input
                    type="text"
                    defaultValue="50% Before Production"
                    className="w-full rounded-xl border border-white/80 bg-white/80 p-2.5 text-xs text-[#1b2234]"
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: BOOKING DETAIL INSPECTOR */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/90 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e2d8]">
              <div>
                <span className="font-mono font-bold text-[#df8653]">{selectedBooking.id}</span>
                <h4 className="text-base font-bold text-[#1b2234] mt-0.5">{selectedBooking.clientName}</h4>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-full bg-white/80 p-1.5 text-gray-500 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#faf3ed] border border-[#f0dfd3]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8b796d]">Package</span>
                  <div className="font-bold text-[#1b2234] mt-0.5">{selectedBooking.package}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8b796d]">Lead Photographer</span>
                  <div className="font-bold text-[#1b2234] mt-0.5">{selectedBooking.photographer}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-[#8b796d]">Schedule & Location</span>
                  <div className="font-medium text-[#1b2234] mt-0.5">
                    {selectedBooking.date} ({selectedBooking.time}) · {selectedBooking.location}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-white/90 bg-white/60 space-y-1.5">
                <div className="flex justify-between text-[#685b51]">
                  <span>Total Amount:</span>
                  <span className="font-mono font-bold text-[#1b2234]">{formatVND(selectedBooking.amount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Deposit Received:</span>
                  <span className="font-mono font-bold">- {formatVND(selectedBooking.depositPaid)}</span>
                </div>
                <div className="pt-2 border-t border-[#f0dfd3] flex justify-between font-bold text-[#1b2234]">
                  <span>Balance Due:</span>
                  <span className="font-mono text-[#c86d3b]">
                    {formatVND(selectedBooking.amount - selectedBooking.depositPaid)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setBookings(
                    bookings.map((b) =>
                      b.id === selectedBooking.id
                        ? { ...b, status: b.status === 'Done' ? 'Deposited' : 'Done' }
                        : b
                    )
                  );
                  setSelectedBooking(null);
                }}
                className="rounded-xl bg-[#1b2234] px-4 py-2 font-semibold text-white shadow-xs"
              >
                Toggle Status: {selectedBooking.status === 'Done' ? 'Mark Deposited' : 'Mark Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CREATE NEW BOOKING */}
      {/* ========================================================================= */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
          <form
            onSubmit={handleCreateBooking}
            className="w-full max-w-lg rounded-3xl border border-white/90 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 text-xs space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0e2d8]">
              <h3 className="text-base font-bold text-[#1b2234]">Create Studio Booking</h3>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="rounded-full bg-white/80 p-1 text-gray-500 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-[#5a4e44] mb-1">Client Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hoang Thu Thao"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/80 p-2 text-xs text-[#1b2234] focus:outline-hidden focus:ring-1 focus:ring-[#df8653]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5a4e44] mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="09xx xxx xxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white/80 p-2 text-xs text-[#1b2234]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5a4e44] mb-1">Package</label>
                <select
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value as Booking['package'])}
                  className="w-full rounded-xl border border-white/80 bg-white/80 p-2 text-xs text-[#1b2234]"
                >
                  <option value="Wedding">Wedding Premium</option>
                  <option value="Portrait">Editorial Portrait</option>
                  <option value="Lookbook">Lookbook Fashion</option>
                  <option value="Commercial">Commercial Product</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5a4e44] mb-1">Lead Photographer</label>
                <select
                  value={newPhotographer}
                  onChange={(e) => setNewPhotographer(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white/80 p-2 text-xs text-[#1b2234]"
                >
                  <option value="Louis Gutkowski">Louis Gutkowski</option>
                  <option value="Marlene Kuhlman">Marlene Kuhlman</option>
                  <option value="Kristi Lueilwitz">Kristi Lueilwitz</option>
                  <option value="Abel Pollich">Abel Pollich</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5a4e44] mb-1">Shoot Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white/80 p-2 text-xs text-[#1b2234]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5a4e44] mb-1">Total Amount (₫)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white/80 p-2 font-mono text-xs text-[#1b2234]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5a4e44] mb-1">Deposit Paid (₫)</label>
                <input
                  type="number"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(e.target.value)}
                  className="w-full rounded-xl border border-white/80 bg-white/80 p-2 font-mono text-xs text-[#1b2234]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#df8653] to-[#c86d3b] px-4 py-2 font-bold text-white shadow-md"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
