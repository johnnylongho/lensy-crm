import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CalendarEvent, Client } from '../../types';
import { MOCK_CALENDAR_EVENTS } from '../../data/mockData';
import { ClientProfileModal, ClientProfileData } from './ClientProfileModal';
import {
  Users,
  Search,
  Crown,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Camera,
  ExternalLink,
  MessageCircle,
  Filter,
  CheckCircle2,
  Copy,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Award,
} from 'lucide-react';

// Dữ liệu mẫu chuẩn Studio khi chạy Offline / Chưa kết nối Supabase
const MOCK_CLIENTS_DATA: ClientProfileData[] = [
  {
    id: 'cli-1',
    name: 'Anh Minh & Chị Thảo',
    phone: '0987654321',
    email: 'minhthao.wedding@gmail.com',
    created_at: '2026-08-10',
    totalBookings: 2,
    totalSpent: 40000000,
    totalRemainingDebt: 12600000,
    isVip: true,
    tier: 'vip',
    lastBookingDate: '2026-10-18',
    bookings: [
      {
        id: 'ev-sub-1',
        clientName: 'Anh Minh & Chị Thảo',
        sessionType: 'prewedding',
        eventDate: '2026-08-20',
        startTime: '06:00',
        endTime: '18:00',
        location: 'Hồ Cốc & Phim Trường Paris',
        status: 'done',
        packagePrice: 22000000,
        depositAmount: 10000000,
        paidAmount: 22000000,
        quoteToken: 'q-minh-thao-prewedding',
      },
      {
        id: 'ev-sub-2',
        clientName: 'Anh Minh & Chị Thảo',
        sessionType: 'wedding',
        eventDate: '2026-10-18',
        startTime: '07:00',
        endTime: '14:00',
        location: 'White Palace, TP.HCM',
        status: 'deposited',
        packagePrice: 18000000,
        depositAmount: 5400000,
        paidAmount: 5400000,
        quoteToken: 'q-minh-thao-wedding',
      },
    ],
  },
  {
    id: 'cli-2',
    name: 'ChicMode Fashion Brand',
    phone: '0918889999',
    email: 'marketing@chicmode.vn',
    created_at: '2026-07-15',
    totalBookings: 2,
    totalSpent: 23500000,
    totalRemainingDebt: 0,
    isVip: true,
    tier: 'vip',
    lastBookingDate: '2026-10-24',
    bookings: [
      {
        id: 'ev-sub-3',
        clientName: 'ChicMode Fashion Brand',
        sessionType: 'lookbook',
        eventDate: '2026-09-22',
        startTime: '13:30',
        endTime: '17:30',
        location: 'Studio Lam Vũ, Q.3',
        status: 'done',
        packagePrice: 7500000,
        depositAmount: 3000000,
        paidAmount: 7500000,
      },
      {
        id: 'ev-sub-4',
        clientName: 'ChicMode Fashion Brand',
        sessionType: 'commercial',
        eventDate: '2026-10-24',
        startTime: '08:00',
        endTime: '17:00',
        location: 'Phim trường Long Island, Q.9',
        status: 'editing',
        packagePrice: 16000000,
        depositAmount: 8000000,
        paidAmount: 16000000,
      },
    ],
  },
  {
    id: 'cli-3',
    name: 'Khai Trương Showroom BrandX',
    phone: '0909112233',
    email: 'events@brandx.vn',
    created_at: '2026-09-01',
    totalBookings: 1,
    totalSpent: 15000000,
    totalRemainingDebt: 10000000,
    isVip: false,
    tier: 'regular',
    lastBookingDate: '2026-09-28',
    bookings: [
      {
        id: 'ev-sub-5',
        clientName: 'Khai Trương Showroom BrandX',
        sessionType: 'event',
        eventDate: '2026-09-28',
        startTime: '09:00',
        endTime: '16:00',
        location: 'Landmark 81, Bình Thạnh',
        status: 'deposited',
        packagePrice: 15000000,
        depositAmount: 5000000,
        paidAmount: 5000000,
      },
    ],
  },
  {
    id: 'cli-4',
    name: 'Anh Tuấn & Chị Mai',
    phone: '0934567890',
    email: 'tuanmai.wedding@gmail.com',
    created_at: '2026-09-05',
    totalBookings: 1,
    totalSpent: 12000000,
    totalRemainingDebt: 8000000,
    isVip: false,
    tier: 'regular',
    lastBookingDate: '2026-09-25',
    bookings: [
      {
        id: 'ev-sub-6',
        clientName: 'Anh Tuấn & Chị Mai',
        sessionType: 'wedding',
        eventDate: '2026-09-25',
        startTime: '07:30',
        endTime: '13:30',
        location: 'White Palace Hoàng Văn Thụ',
        status: 'deposited',
        packagePrice: 12000000,
        depositAmount: 4000000,
        paidAmount: 4000000,
      },
    ],
  },
  {
    id: 'cli-5',
    name: 'Nguyễn Hoàng Long',
    phone: '0903334455',
    email: 'long.nh@vietcorp.com',
    created_at: '2026-09-18',
    totalBookings: 1,
    totalSpent: 4500000,
    totalRemainingDebt: 4500000,
    isVip: false,
    tier: 'lead',
    lastBookingDate: '2026-10-10',
    bookings: [
      {
        id: 'ev-sub-7',
        clientName: 'Nguyễn Hoàng Long',
        sessionType: 'portrait',
        eventDate: '2026-10-10',
        startTime: '10:00',
        endTime: '12:00',
        location: 'The Coffee House Signature, Q.1',
        status: 'lead',
        packagePrice: 4500000,
        depositAmount: 1500000,
        paidAmount: 0,
      },
    ],
  },
];

export const ClientsManagementPage: React.FC = () => {
  const [clients, setClients] = useState<ClientProfileData[]>(MOCK_CLIENTS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'vip' | 'regular' | 'debt'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientProfileData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Tải dữ liệu từ Supabase (Clients + Bookings) và tính toán LTV
  const fetchClientsFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);

    try {
      // 1. Lấy danh sách clients
      const { data: dbClients } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Lấy danh sách bookings
      const { data: dbBookings } = await supabase
        .from('bookings')
        .select('*')
        .order('event_date', { ascending: false });

      const allBookings = (dbBookings || []) as any[];
      const clientMap = new Map<string, ClientProfileData>();

      // Đưa clients từ DB vào map
      (dbClients || []).forEach(c => {
        clientMap.set(c.id, {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email || undefined,
          created_at: c.created_at,
          totalBookings: 0,
          totalSpent: 0,
          totalRemainingDebt: 0,
          isVip: false,
          tier: 'lead',
          bookings: [],
        });
      });

      // Map bookings vào clients (theo client_id hoặc client_phone)
      allBookings.forEach(b => {
        let matchedClient: ClientProfileData | undefined;

        if (b.client_id && clientMap.has(b.client_id)) {
          matchedClient = clientMap.get(b.client_id);
        } else {
          // Tìm theo phone nếu client_id chưa được gán
          matchedClient = Array.from(clientMap.values()).find(
            c => c.phone.replace(/[^0-9]/g, '') === (b.client_phone || '').replace(/[^0-9]/g, '')
          );
        }

        // Nếu booking thuộc về khách hàng chưa có trong bảng clients (dữ liệu cũ), tự tạo hồ sơ tạm
        if (!matchedClient && b.client_phone) {
          const tempId = `cli-${b.client_phone}`;
          matchedClient = {
            id: tempId,
            name: b.client_name || 'Khách hàng',
            phone: b.client_phone,
            email: b.client_email || undefined,
            created_at: b.created_at || b.event_date,
            totalBookings: 0,
            totalSpent: 0,
            totalRemainingDebt: 0,
            isVip: false,
            tier: 'lead',
            bookings: [],
          };
          clientMap.set(tempId, matchedClient);
        }

        if (matchedClient) {
          const bookingEvent: CalendarEvent = {
            id: b.id,
            clientName: b.client_name,
            sessionType: b.session_type,
            eventDate: b.event_date,
            startTime: (b.start_time || '08:00').substring(0, 5),
            endTime: (b.end_time || '12:00').substring(0, 5),
            location: b.location,
            status: b.status,
            packagePrice: Number(b.package_price || 0),
            depositAmount: Number(b.deposit_amount || 0),
            paidAmount: Number(b.paid_amount || 0),
            quoteToken: b.quote_token,
            assignedGears: b.assigned_gears || [],
          };

          matchedClient.bookings.push(bookingEvent);
        }
      });

      // 3. Tính toán Giá trị Trọn đời (LTV), số lần chụp và phân hạng VIP Gamification
      const calculatedClients: ClientProfileData[] = Array.from(clientMap.values()).map(c => {
        const totalBookings = c.bookings.length;
        const totalSpent = c.bookings.reduce((sum, b) => sum + b.packagePrice, 0);

        const totalRemainingDebt = c.bookings.reduce((sum, b) => {
          const paid = b.paidAmount ?? (b.status === 'done' || b.status === 'hoan_thanh' ? b.packagePrice : b.depositAmount);
          return sum + Math.max(0, b.packagePrice - paid);
        }, 0);

        // Quy tắc VIP Gamification:
        // Khách có từ 2 show trở lên HOẶC chi tiêu từ 20.000.000đ trở lên
        const isVip = totalBookings >= 2 || totalSpent >= 20000000;
        const tier = isVip ? 'vip' : totalBookings >= 1 ? 'regular' : 'lead';

        // Lấy ngày show chụp gần nhất
        const sortedDates = c.bookings
          .map(b => b.eventDate)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const lastBookingDate = sortedDates[0];

        return {
          ...c,
          totalBookings,
          totalSpent,
          totalRemainingDebt,
          isVip,
          tier,
          lastBookingDate,
        };
      });

      // Sắp xếp ưu tiên: Khách VIP lên trước, sau đó sắp xếp theo LTV giảm dần
      calculatedClients.sort((a, b) => {
        if (a.isVip && !b.isVip) return -1;
        if (!a.isVip && b.isVip) return 1;
        return b.totalSpent - a.totalSpent;
      });

      if (calculatedClients.length > 0) {
        setClients(calculatedClients);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsFromSupabase();
  }, []);

  // Thống kê tổng quan KPIs
  const kpiStats = useMemo(() => {
    const totalClients = clients.length;
    const vipCount = clients.filter(c => c.isVip).length;
    const totalLtvRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalClients > 0 ? Math.round(totalLtvRevenue / totalClients) : 0;
    return { totalClients, vipCount, totalLtvRevenue, avgOrderValue };
  }, [clients]);

  // Bộ lọc tìm kiếm & Tab phân loại
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // 1. Tìm kiếm theo tên, số điện thoại, email
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // 2. Lọc theo Tab
      if (filterTier === 'vip') return c.isVip;
      if (filterTier === 'regular') return c.tier === 'regular';
      if (filterTier === 'debt') return c.totalRemainingDebt > 0;
      return true;
    });
  }, [clients, searchQuery, filterTier]);

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenClientProfile = (client: ClientProfileData) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Hồ Sơ Khách Hàng (Client CRM & LTV)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Gamification Tiering
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Danh Sách Khách Hàng Studio</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {clients.length} khách
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi giá trị trọn đời (LTV), số lần chụp và tự động gắn nhãn VIP 👑 cho khách quen.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClientsFromSupabase}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* 4 Thẻ Thống Kê Tổng Quan (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Tổng Khách */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Tổng Khách Hàng</span>
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">
            {kpiStats.totalClients} <span className="text-xs font-normal text-slate-400">người</span>
          </p>
        </div>

        {/* Khách VIP */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Khách Hàng VIP (👑)</span>
          </span>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-black font-mono text-amber-300">
              {kpiStats.vipCount}
            </p>
            <span className="text-[11px] text-amber-400/80 font-medium">
              ({kpiStats.totalClients > 0 ? Math.round((kpiStats.vipCount / kpiStats.totalClients) * 100) : 0}% tệp khách)
            </span>
          </div>
        </div>

        {/* Tổng Doanh Thu Trọn Đời (LTV) */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tổng Doanh Thu LTV</span>
          </span>
          <p className="text-lg sm:text-xl font-black font-mono text-emerald-400 truncate">
            {kpiStats.totalLtvRevenue.toLocaleString('vi-VN')} đ
          </p>
        </div>

        {/* AOV */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Giá Trị Trung Bình / Khách</span>
          </span>
          <p className="text-lg sm:text-xl font-black font-mono text-purple-300 truncate">
            {kpiStats.avgOrderValue.toLocaleString('vi-VN')} đ
          </p>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm & Bộ lọc Tab */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, email khách hàng..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Tabs Filter */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTier('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex-shrink-0 ${
              filterTier === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất Cả ({clients.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('vip')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 flex-shrink-0 ${
              filterTier === 'vip'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>👑 VIP ({kpiStats.vipCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('regular')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex-shrink-0 ${
              filterTier === 'regular'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🥈 Thân Thiết
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('debt')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex-shrink-0 ${
              filterTier === 'debt'
                ? 'bg-rose-500 text-slate-950 shadow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            ⏳ Còn Nợ
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu Danh Sách Khách Hàng (Data Table) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Số Điện Thoại</th>
                <th className="py-3 px-4 text-center">Hạng Khách</th>
                <th className="py-3 px-4 text-center">Số Lần Chụp</th>
                <th className="py-3 px-4 text-right">Tổng Chi Tiêu (LTV)</th>
                <th className="py-3 px-4">Show Gần Nhất</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy khách hàng nào khớp với tìm kiếm hoặc bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => {
                  const initials = client.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(-2)
                    .map(w => w[0]?.toUpperCase())
                    .join('') || 'KH';

                  const cleanPhone = client.phone.replace(/[^0-9]/g, '');

                  return (
                    <tr
                      key={client.id}
                      onClick={() => handleOpenClientProfile(client)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Cột 1: Tên & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              client.isVip
                                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-slate-800 border border-slate-700 text-slate-200'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors block truncate max-w-[200px]">
                              {client.name}
                            </span>
                            {client.email ? (
                              <span className="text-[11px] text-slate-400 truncate block max-w-[200px]">
                                {client.email}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">
                                Chưa có email
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT kèm nút copy */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{client.phone}</span>
                          <button
                            type="button"
                            onClick={e => handleCopyPhone(client.phone, e)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Sao chép số điện thoại"
                          >
                            {copiedPhone === client.phone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Cột 3: Hạng VIP Gamification */}
                      <td className="py-3 px-4 text-center">
                        {client.isVip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm animate-pulse-subtle">
                            <span>👑</span>
                            <span>VIP GOLD</span>
                          </span>
                        ) : client.tier === 'regular' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                            <span>🥈</span>
                            <span>Thân Thiết</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/40 text-slate-400 border border-slate-800">
                            <span>🥉</span>
                            <span>Mới</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Số Lần Chụp */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-bold text-white text-xs">
                          {client.totalBookings}
                        </span>
                      </td>

                      {/* Cột 5: Tổng Chi Tiêu (LTV) */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="font-extrabold text-sm text-emerald-400">
                          {client.totalSpent.toLocaleString('vi-VN')} đ
                        </span>
                        {client.totalRemainingDebt > 0 && (
                          <span className="block text-[10px] text-rose-400 font-medium">
                            Nợ: {client.totalRemainingDebt.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Show Gần Nhất */}
                      <td className="py-3 px-4 text-slate-400">
                        {client.lastBookingDate ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span>{client.lastBookingDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">Chưa đặt lịch</span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`https://zalo.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-colors"
                            title="Chat Zalo với khách"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenClientProfile(client)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 text-slate-200 font-bold text-[11px] transition-all flex items-center gap-1"
                          >
                            <span>Xem Hồ Sơ</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Modal Chi Tiết Khách Hàng (Client Profile) */}
      <ClientProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
};
