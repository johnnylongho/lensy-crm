import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { CalendarEvent, Client } from '../../types';
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
  Trash2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

const MOCK_CLIENTS_DATA: ClientProfileData[] = [];

export const ClientsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { currentStudio } = useWorkspace();
  const [clients, setClients] = useState<ClientProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'vip' | 'regular' | 'debt'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientProfileData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientProfileData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tải dữ liệu từ Supabase (Clients + Bookings) và tính toán LTV
  const fetchClientsFromSupabase = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Lấy danh sách clients
      let clientsQuery = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentStudio) {
        clientsQuery = clientsQuery.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user?.id}`);
      } else if (user) {
        clientsQuery = clientsQuery.eq('photographer_id', user.id);
      }

      const { data: dbClients } = await clientsQuery;

      // 2. Lấy danh sách bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select('*')
        .order('event_date', { ascending: false });

      if (currentStudio) {
        bookingsQuery = bookingsQuery.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user?.id}`);
      } else if (user) {
        bookingsQuery = bookingsQuery.eq('photographer_id', user.id);
      }

      const { data: dbBookings } = await bookingsQuery;

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

      // Hàm nhận diện số điện thoại rác/mặc định (placeholder)
      const isPlaceholderPhone = (phone?: string | null): boolean => {
        if (!phone) return true;
        const cleaned = phone.replace(/[^0-9]/g, '');
        if (cleaned.length < 9) return true;
        if (/^0+(\d)\1{5,}$/.test(cleaned)) return true; // e.g. 0900000000, 0000000000
        if (cleaned === '0900000000' || cleaned === '0000000000' || cleaned === '0123456789') return true;
        return false;
      };

      // Map bookings vào clients (theo client_id, hoặc phone hợp lệ, hoặc tên khách hàng)
      allBookings.forEach(b => {
        let matchedClient: ClientProfileData | undefined;

        // 1. Ưu tiên khớp theo client_id
        if (b.client_id && clientMap.has(b.client_id)) {
          matchedClient = clientMap.get(b.client_id);
        }

        // 2. Khớp theo số điện thoại hợp lệ (nếu không phải là số giữ chỗ)
        if (!matchedClient && !isPlaceholderPhone(b.client_phone)) {
          const cleanPhone = (b.client_phone || '').replace(/[^0-9]/g, '');
          matchedClient = Array.from(clientMap.values()).find(
            c => !isPlaceholderPhone(c.phone) && c.phone.replace(/[^0-9]/g, '') === cleanPhone
          );
        }

        // 3. Khớp theo tên khách hàng (chuẩn hóa không phân biệt hoa thường)
        const cleanBookingName = (b.client_name || '').trim().toLowerCase();
        if (!matchedClient && cleanBookingName) {
          matchedClient = Array.from(clientMap.values()).find(
            c => (c.name || '').trim().toLowerCase() === cleanBookingName
          );
        }

        // 4. Nếu booking thuộc về khách hàng mới chưa có trong map, khởi tạo hồ sơ riêng biệt
        if (!matchedClient) {
          const tempId = !isPlaceholderPhone(b.client_phone)
            ? `cli-${(b.client_phone || '').replace(/[^0-9]/g, '')}`
            : `cli-name-${encodeURIComponent(cleanBookingName || b.id)}`;

          matchedClient = {
            id: tempId,
            name: b.client_name || 'Khách hàng',
            phone: b.client_phone || '',
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

      // 3. Tính toán Doanh thu thực tế đã thu (Actual Collected Revenue), số lần chụp và phân hạng VIP
      const calculatedClients: ClientProfileData[] = Array.from(clientMap.values()).map(c => {
        // Chỉ đếm các buổi chụp hợp lệ (không phải bị hủy)
        const validBookings = c.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'da_huy');
        const totalBookings = validBookings.length;

        // Doanh thu thực tế đã thu: Chỉ tính tiền thực nhận (paidAmount, cọc, hoặc khi đã hoàn tất/trả file)
        // Các lịch book mới (lead, chờ cọc) chưa thanh toán thì KHÔNG tính vào doanh thu thực thu!
        const totalSpent = c.bookings.reduce((sum, b) => {
          if (b.status === 'cancelled' || b.status === 'da_huy') return sum;
          const isCompleted = b.status === 'done' || b.status === 'hoan_thanh' || b.status === 'da_tra_file';
          const paid = Number(b.paidAmount || (isCompleted ? b.packagePrice : b.depositAmount || 0));
          return sum + paid;
        }, 0);

        const totalRemainingDebt = c.bookings.reduce((sum, b) => {
          if (b.status === 'cancelled' || b.status === 'da_huy') return sum;
          const isCompleted = b.status === 'done' || b.status === 'hoan_thanh' || b.status === 'da_tra_file';
          const paid = Number(b.paidAmount || (isCompleted ? b.packagePrice : b.depositAmount || 0));
          return sum + Math.max(0, Number(b.packagePrice || 0) - paid);
        }, 0);

        // Quy tắc VIP: Khách có từ 2 show chốt trở lên HOẶC chi tiêu thực tế từ 15.000.000đ trở lên
        const isVip = totalBookings >= 2 || totalSpent >= 15000000;
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

      setClients(calculatedClients);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setClients([]);
    fetchClientsFromSupabase();
    return () => {
      setClients([]);
    };
  }, [user, currentStudio]);

  // Thống kê tổng quan KPIs
  const kpiStats = useMemo(() => {
    const totalClients = clients.length;
    const vipCount = clients.filter(c => c.isVip).length;
    const regularCount = clients.filter(c => c.tier === 'regular').length;
    const debtCount = clients.filter(c => c.totalRemainingDebt > 0).length;
    const totalLtvRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalClients > 0 ? Math.round(totalLtvRevenue / totalClients) : 0;
    return { totalClients, vipCount, regularCount, debtCount, totalLtvRevenue, avgOrderValue };
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

  // Xác nhận xóa khách hàng khỏi danh sách
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      if (isSupabaseConfigured) {
        const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientToDelete.id);
        if (isRealUuid) {
          await supabase.from('clients').delete().eq('id', clientToDelete.id);
        }
      }
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
      if (selectedClient?.id === clientToDelete.id) {
        setIsModalOpen(false);
        setSelectedClient(null);
      }
      setClientToDelete(null);
    } catch (err) {
      console.error('Lỗi khi xóa khách hàng:', err);
      alert('Không thể xóa khách hàng. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30">
              Hồ Sơ Khách Hàng (Client CRM & LTV)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-white/50 font-medium">
              Gamification Tiering
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Danh Sách Khách Hàng Studio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/40 dark:bg-white/10 text-slate-700 dark:text-white/80 font-mono border border-white/40 dark:border-white/10">
              {clients.length} khách
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
            Theo dõi giá trị trọn đời (LTV), số lần chụp và tự động gắn nhãn VIP 👑 cho khách quen.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClientsFromSupabase}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-white/80 text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 backdrop-blur-md shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* 4 Thẻ Thống Kê Tổng Quan (KPIs) - Liquid Glass */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Tổng Khách */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-1.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <span className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Tổng Khách Hàng</span>
          </span>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse my-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-light font-mono text-slate-900 dark:text-white tracking-tight">
              {kpiStats.totalClients} <span className="text-xs font-normal text-slate-500 dark:text-white/50">người</span>
            </p>
          )}
        </div>

        {/* Khách VIP */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white/60 to-amber-500/5 dark:from-amber-950/40 dark:via-white/5 dark:to-transparent backdrop-blur-xl border border-amber-400/40 dark:border-amber-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-1.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Khách Hàng VIP (👑)</span>
          </span>
          {isLoading ? (
            <div className="h-8 w-20 bg-amber-500/20 rounded-lg animate-pulse my-1" />
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-light font-mono text-amber-600 dark:text-amber-300 tracking-tight">
                {kpiStats.vipCount}
              </p>
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                ({kpiStats.totalClients > 0 ? Math.round((kpiStats.vipCount / kpiStats.totalClients) * 100) : 0}% tệp khách)
              </span>
            </div>
          )}
        </div>

        {/* Tổng Doanh Thu Thực Thu */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-1.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <span className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Tổng Doanh Thu Thực Thu</span>
          </span>
          {isLoading ? (
            <div className="h-8 w-32 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse my-1" />
          ) : (
            <div>
              <p className="text-xl sm:text-2xl font-light font-mono text-emerald-600 dark:text-emerald-400 truncate tracking-tight">
                {kpiStats.totalLtvRevenue.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Dòng tiền thực nhận (đã cọc & tất toán)</p>
            </div>
          )}
        </div>

        {/* AOV */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-1.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <span className="text-xs font-medium text-slate-500 dark:text-white/50 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span>Giá Trị Trung Bình / Khách</span>
          </span>
          {isLoading ? (
            <div className="h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse my-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-light font-mono text-purple-600 dark:text-purple-300 truncate tracking-tight">
              {kpiStats.avgOrderValue.toLocaleString('vi-VN')} đ
            </p>
          )}
        </div>
      </div>

      {/* Toolbar: Tìm kiếm & Bộ lọc Tab Phân Loại Khách Hàng (Mobile App First) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        {/* Khung Tìm Kiếm Linh Hoạt */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, email khách hàng..."
            className="w-full bg-slate-100/90 dark:bg-black/30 border border-slate-200/90 dark:border-white/10 focus:border-[#df8653] focus:ring-2 focus:ring-[#df8653]/20 rounded-2xl pl-10 pr-9 py-2.5 min-h-[44px] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              title="Xóa ô tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Khung Phân Loại Khách Hàng Dạng Pills Cuộn Ngang Mượt Mà */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-black/30 p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto scrollbar-none touch-pan-x">
          <button
            type="button"
            onClick={() => setFilterTier('all')}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              filterTier === 'all'
                ? 'bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <span>Tất Cả</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${filterTier === 'all' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
              {clients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('vip')}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              filterTier === 'vip'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <span>👑 VIP</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${filterTier === 'vip' ? 'bg-black/20 text-slate-950' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
              {kpiStats.vipCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('regular')}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              filterTier === 'regular'
                ? 'bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <span>🥈 Thân Thiết</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${filterTier === 'regular' ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
              {kpiStats.regularCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTier('debt')}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              filterTier === 'debt'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25'
                : 'text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-white/70 dark:hover:bg-white/5'
            }`}
          >
            <span>⏳ Còn Nợ</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${filterTier === 'debt' ? 'bg-black/20 text-white' : 'bg-rose-500/15 text-rose-500 dark:text-rose-400'}`}>
              {kpiStats.debtCount}
            </span>
          </button>
        </div>
      </div>

      {/* 1. MÀN HÌNH DESKTOP: BẢNG DỮ LIỆU TẬN DỤNG TOÀN DIỆN CHIỀU NGANG */}
      <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Số Điện Thoại</th>
                <th className="py-3 px-4 text-center">Hạng Khách</th>
                <th className="py-3 px-4 text-center">Số Lần Chụp</th>
                <th className="py-3 px-4 text-right">Tổng Chi Tiêu (LTV)</th>
                <th className="py-3 px-4">Show Gần Nhất</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-row-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-white/10" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-slate-200 dark:bg-white/10 rounded" />
                          <div className="h-2.5 w-36 bg-slate-200 dark:bg-white/5 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-5 w-16 mx-auto bg-slate-200 dark:bg-white/10 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-3.5 w-8 mx-auto bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-3.5 w-20 ml-auto bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-3.5 w-16 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-6 w-20 mx-auto bg-slate-200 dark:bg-white/10 rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
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
                      className="hover:bg-slate-100/70 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Cột 1: Tên & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              client.isVip
                                ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-md ring-2 ring-amber-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors block truncate max-w-[200px]">
                              {client.name}
                            </span>
                            {client.email ? (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[200px]">
                                {client.email}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-600 italic">
                                Chưa có email
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT kèm nút copy */}
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{client.phone}</span>
                          <button
                            type="button"
                            onClick={e => handleCopyPhone(client.phone, e)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            title="Sao chép số điện thoại"
                          >
                            {copiedPhone === client.phone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Cột 3: Hạng VIP Gamification */}
                      <td className="py-3 px-4 text-center">
                        {client.isVip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/50 text-amber-600 dark:text-amber-300 shadow-sm animate-pulse-subtle">
                            <span>👑</span>
                            <span>VIP GOLD</span>
                          </span>
                        ) : client.tier === 'regular' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            <span>🥈</span>
                            <span>Thân Thiết</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            <span>🥉</span>
                            <span>Mới</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Số Lần Chụp */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-xs">
                          {client.totalBookings}
                        </span>
                      </td>

                      {/* Cột 5: Tổng Chi Tiêu (LTV) */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {client.totalSpent.toLocaleString('vi-VN')} đ
                        </span>
                        {client.totalRemainingDebt > 0 && (
                          <span className="block text-[10px] text-rose-500 dark:text-rose-400 font-medium">
                            Nợ: {client.totalRemainingDebt.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Show Gần Nhất */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {client.lastBookingDate ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                            <span>{client.lastBookingDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 italic text-[11px]">Chưa đặt lịch</span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`https://zalo.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-colors"
                            title="Chat Zalo với khách"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleOpenClientProfile(client)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem Hồ Sơ</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setClientToDelete(client)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                            title="Xóa hồ sơ khách hàng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* 2. MÀN HÌNH MOBILE: DANH SÁCH THẺ (LIST CARDS) GỌN GÀNG, KHÔNG CẦN CUỘN NGANG */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`skel-card-${idx}`}
              className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-white/10 rounded" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-10 bg-slate-200/60 dark:bg-white/5 rounded-xl" />
            </div>
          ))
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-500 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10">
            Không tìm thấy khách hàng nào khớp với tìm kiếm hoặc bộ lọc.
          </div>
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
              <div
                key={client.id}
                onClick={() => handleOpenClientProfile(client)}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-3 cursor-pointer active:scale-[0.99] transition-all"
              >
                {/* Header Thẻ: Avatar, Tên, Hạng Khách */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        client.isVip
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-slate-800 border border-slate-700 text-slate-200'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {client.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {client.email || 'Chưa có email'}
                      </p>
                    </div>
                  </div>

                  {/* Badge Hạng */}
                  {client.isVip ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/50 text-amber-500 dark:text-amber-300 flex-shrink-0">
                      <span>👑 VIP</span>
                    </span>
                  ) : client.tier === 'regular' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                      <span>🥈 Thân Thiết</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 flex-shrink-0">
                      <span>🥉 Mới</span>
                    </span>
                  )}
                </div>

                {/* Metrics 2 Cột: LTV & Số Lần Chụp */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Tổng LTV Chi Tiêu:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {client.totalSpent.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Số Lần Chụp:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white text-xs">
                      {client.totalBookings} show
                    </span>
                  </div>
                </div>

                {/* Footer Thẻ: Số Điện Thoại & Thao Tác Nhanh */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                    <button
                      type="button"
                      onClick={e => handleCopyPhone(client.phone, e)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                      title="Sao chép số"
                    >
                      {copiedPhone === client.phone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-bold"
                      title="Gọi điện trực tiếp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Gọi</span>
                    </a>
                    <a
                      href={`https://zalo.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/30 flex items-center gap-1 text-[11px] font-bold"
                      title="Chat Zalo"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Zalo</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenClientProfile(client)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <span>Chi tiết</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientToDelete(client);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                      title="Xóa hồ sơ khách hàng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer / Modal Chi Tiết Khách Hàng (Client Profile) */}
      <ClientProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
        onClientUpdated={(updatedClient) => {
          setSelectedClient(updatedClient);
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        }}
        onClientDeleted={(deletedId) => {
          setClients(prev => prev.filter(c => c.id !== deletedId));
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
      />

      {/* Modal Xác Nhận Xóa Khách Hàng Nhanh Từ Danh Sách */}
      {clientToDelete && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-lg font-bold text-white">Xóa Hồ Sơ Khách Hàng?</h4>
              <p className="text-xs text-slate-400">
                Bạn có chắc muốn xóa khách hàng <strong className="text-white">{clientToDelete.name}</strong> ({clientToDelete.phone || 'Không có SĐT'}) khỏi hệ thống?
              </p>
              {clientToDelete.bookings && clientToDelete.bookings.length > 0 && (
                <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mt-2 text-left">
                  Lưu ý: Khách hàng này có {clientToDelete.bookings.length} lịch chụp. Lịch chụp vẫn được giữ lại để bảo toàn doanh thu và lịch sử studio.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
