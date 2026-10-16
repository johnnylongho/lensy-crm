import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarEvent,
  CrewAssignmentItem,
  CrewRole,
  ExpenseItem,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Search,
  Filter,
  QrCode,
  Copy,
  Check,
  Loader2,
  Wallet,
  Building2,
  Phone,
  X,
  ArrowUpRight,
} from 'lucide-react';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CREW_ROLE_LABELS: Record<CrewRole, { label: string; badgeClass: string; dotColor: string }> = {
  lead_photographer: {
    label: 'Thợ chụp chính',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  videographer: {
    label: 'Quay phim / Video',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-400',
  },
  makeup_artist: {
    label: 'Makeup & Hair',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30',
    dotColor: 'bg-fuchsia-400',
  },
  assistant: {
    label: 'Trợ lý / Ánh sáng',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  retoucher: {
    label: 'Retoucher / Hậu kỳ',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  other: {
    label: 'Hỗ trợ / Khác',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30',
    dotColor: 'bg-slate-400',
  },
};

interface FlattenedPayrollRow {
  rowId: string;
  bookingId: string;
  clientName: string;
  eventDate: string;
  packagePrice: number;
  bookingStatus: string;
  crewItemId: string;
  userId?: string;
  staffName: string;
  staffPhone?: string;
  role: CrewRole;
  feeType: 'fixed' | 'percent';
  rawFee: number;
  calculatedAmount: number;
  isPaid: boolean;
  bankName?: string;
  bankAccount?: string;
}

interface StaffSummaryGroup {
  staffKey: string;
  userId?: string;
  staffName: string;
  staffPhone?: string;
  roles: Set<CrewRole>;
  showCount: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  bankName?: string;
  bankAccount?: string;
  rows: FlattenedPayrollRow[];
}

export const PayrollManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { currentStudio, isStudioMember } = useWorkspace();

  const [bookings, setBookings] = useState<CalendarEvent[]>([]);
  const [staffBankMap, setStaffBankMap] = useState<
    Record<string, { bankName?: string; bankAccount?: string; fullName?: string; phone?: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // YYYY-MM
  });
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal VietQR chuyển khoản lương
  const [qrPayoutModal, setQrPayoutModal] = useState<{
    isOpen: boolean;
    staffName: string;
    amount: number;
    transferNote: string;
    bankName?: string;
    bankAccount?: string;
    rowsToMarkPaid: FlattenedPayrollRow[];
  } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchPayrollData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && user && UUID_REGEX.test(user.id)) {
        let query = supabase
          .from('bookings')
          .select(`
            *,
            photographer:users!photographer_id (id, full_name, phone, avatar_url),
            makeup_artist:users!makeup_artist_id (id, full_name, phone, avatar_url)
          `)
          .neq('status', 'da_huy')
          .neq('status', 'cancelled')
          .order('event_date', { ascending: false });

        if (currentStudio && UUID_REGEX.test(currentStudio.id)) {
          query = query.or(`studio_id.eq.${currentStudio.id},photographer_id.eq.${user.id},makeup_artist_id.eq.${user.id}`);
        } else {
          query = query.or(`photographer_id.eq.${user.id},makeup_artist_id.eq.${user.id}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mappedBookings: CalendarEvent[] = (data || []).map((b: any) => ({
          id: b.id,
          clientName: b.client_name || 'Khách hàng',
          clientPhone: b.client_phone || '',
          sessionType: b.session_type || 'portrait',
          eventDate: b.event_date || '',
          startTime: (b.start_time || '08:00').substring(0, 5),
          endTime: (b.end_time || '12:00').substring(0, 5),
          location: b.location || 'Tại Studio',
          status: b.status || 'lead',
          packagePrice: Number(b.package_price || 0),
          depositAmount: Number(b.deposit_amount || 0),
          paidAmount: Number(b.paid_amount || 0),
          expenses: Number(b.expenses || 0),
          expenseDetails: Array.isArray(b.expense_details) ? b.expense_details : [],
          crew_assignments: Array.isArray(b.crew_assignments) ? b.crew_assignments : [],
          photographer_id: b.photographer_id,
          makeup_artist_id: b.makeup_artist_id,
          photographer: b.photographer || null,
          makeup_artist: b.makeup_artist || null,
        }));

        setBookings(mappedBookings);

        // Nạp thông tin ngân hàng của nhân sự từ bảng users
        const userIds = new Set<string>();
        mappedBookings.forEach(b => {
          if (b.photographer_id && UUID_REGEX.test(b.photographer_id)) userIds.add(b.photographer_id);
          if (b.makeup_artist_id && UUID_REGEX.test(b.makeup_artist_id)) userIds.add(b.makeup_artist_id);
          (b.crew_assignments || []).forEach(c => {
            if (c.user_id && UUID_REGEX.test(c.user_id)) userIds.add(c.user_id);
          });
        });

        if (userIds.size > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, phone, bank_name, bank_account_number')
            .in('id', Array.from(userIds));

          if (usersData) {
            const map: Record<string, any> = {};
            usersData.forEach((u: any) => {
              map[u.id] = {
                bankName: u.bank_name,
                bankAccount: u.bank_account_number,
                fullName: u.full_name,
                phone: u.phone,
              };
            });
            setStaffBankMap(map);
          }
        }
      } else {
        // Dữ liệu mẫu khi chạy chế độ Demo
        setBookings([
          {
            id: 'demo-b1',
            clientName: 'Đám Cưới Minh & Thảo',
            eventDate: new Date().toISOString().substring(0, 10),
            startTime: '08:00',
            endTime: '12:00',
            location: 'Mirmia Studio',
            sessionType: 'wedding',
            status: 'shot',
            packagePrice: 15000000,
            depositAmount: 5000000,
            expenseDetails: [],
            crew_assignments: [
              {
                id: 'c-1',
                user_id: user?.id || 'u-photo-1',
                role: 'lead_photographer',
                name: 'Johnny Long',
                phone: '0901234567',
                fee: 20,
                fee_type: 'percent',
                is_paid: true,
                bank_name: 'MB',
                bank_account: '0901234567',
              },
              {
                id: 'c-2',
                user_id: 'u-mua-1',
                role: 'makeup_artist',
                name: 'Lan Anh MUA',
                phone: '0988776655',
                fee: 1200000,
                fee_type: 'fixed',
                is_paid: false,
                bank_name: 'VCB',
                bank_account: '0123456789',
              },
              {
                id: 'c-3',
                user_id: 'u-retouch-1',
                role: 'retoucher',
                name: 'Hoàng Retouch',
                phone: '0912345678',
                fee: 800000,
                fee_type: 'fixed',
                is_paid: false,
              },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu Bảng lương:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [user, currentStudio]);

  // Trích xuất phẳng toàn bộ các khoản thù lao từ danh sách bookings
  const allPayrollRows: FlattenedPayrollRow[] = useMemo(() => {
    const rows: FlattenedPayrollRow[] = [];

    bookings.forEach(b => {
      let crewList: CrewAssignmentItem[] =
        b.crew_assignments && b.crew_assignments.length > 0 ? [...b.crew_assignments] : [];

      if (crewList.length === 0) {
        if (b.photographer_id || b.photographer) {
          crewList.push({
            id: `auto-photo-${b.id}`,
            user_id: b.photographer_id || b.photographer?.id,
            role: 'lead_photographer',
            name: b.photographer?.full_name || 'Thợ chụp chính',
            phone: b.photographer?.phone,
            fee: 30,
            fee_type: 'percent',
            is_paid: false,
          });
        }
        if (b.makeup_artist_id || b.makeup_artist) {
          crewList.push({
            id: `auto-mua-${b.id}`,
            user_id: b.makeup_artist_id || b.makeup_artist?.id,
            role: 'makeup_artist',
            name: b.makeup_artist?.full_name || 'Thợ Makeup (MUA)',
            phone: b.makeup_artist?.phone,
            fee: 500000,
            fee_type: 'fixed',
            is_paid: false,
          });
        }
      }

      crewList.forEach((c, idx) => {
        if (isStudioMember && user) {
          const isCurrentUser =
            c.user_id === user.id ||
            (user.user_metadata?.full_name &&
              c.name.toLowerCase().includes(user.user_metadata.full_name.toLowerCase()));
          if (!isCurrentUser) return;
        }

        const calcAmt =
          c.fee_type === 'percent'
            ? Math.round((b.packagePrice * Number(c.fee || 0)) / 100)
            : Number(c.fee || 0);

        const bankInfo = c.user_id ? staffBankMap[c.user_id] : undefined;

        rows.push({
          rowId: `${b.id}_${c.id || idx}`,
          bookingId: b.id,
          clientName: b.clientName,
          eventDate: b.eventDate,
          packagePrice: b.packagePrice,
          bookingStatus: b.status,
          crewItemId: c.id || `crew-${idx}`,
          userId: c.user_id,
          staffName: c.name,
          staffPhone: c.phone || bankInfo?.phone,
          role: c.role,
          feeType: c.fee_type,
          rawFee: Number(c.fee || 0),
          calculatedAmount: calcAmt,
          isPaid: Boolean(c.is_paid),
          bankName: c.bank_name || bankInfo?.bankName,
          bankAccount: c.bank_account || bankInfo?.bankAccount,
        });
      });
    });

    return rows;
  }, [bookings, isStudioMember, user, staffBankMap]);

  // Áp dụng bộ lọc Tháng, Vai trò, Trạng thái thanh toán & Từ khóa
  const filteredRows = useMemo(() => {
    return allPayrollRows.filter(row => {
      if (selectedMonth && selectedMonth !== 'all') {
        if (!row.eventDate.startsWith(selectedMonth)) return false;
      }
      if (roleFilter !== 'all' && row.role !== roleFilter) return false;
      if (paymentFilter === 'paid' && !row.isPaid) return false;
      if (paymentFilter === 'unpaid' && row.isPaid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchStaff = row.staffName.toLowerCase().includes(q);
        const matchClient = row.clientName.toLowerCase().includes(q);
        if (!matchStaff && !matchClient) return false;
      }
      return true;
    });
  }, [allPayrollRows, selectedMonth, roleFilter, paymentFilter, searchQuery]);

  // Tổng hợp theo từng Nhân sự
  const staffSummaries: StaffSummaryGroup[] = useMemo(() => {
    const map = new Map<string, StaffSummaryGroup>();

    filteredRows.forEach(row => {
      const key = row.userId || row.staffName.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.roles.add(row.role);
        existing.showCount += 1;
        existing.totalAmount += row.calculatedAmount;
        if (row.isPaid) existing.paidAmount += row.calculatedAmount;
        else existing.unpaidAmount += row.calculatedAmount;
        existing.rows.push(row);
      } else {
        map.set(key, {
          staffKey: key,
          userId: row.userId,
          staffName: row.staffName,
          staffPhone: row.staffPhone,
          roles: new Set([row.role]),
          showCount: 1,
          totalAmount: row.calculatedAmount,
          paidAmount: row.isPaid ? row.calculatedAmount : 0,
          unpaidAmount: row.isPaid ? 0 : row.calculatedAmount,
          bankName: row.bankName,
          bankAccount: row.bankAccount,
          rows: [row],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.unpaidAmount - a.unpaidAmount);
  }, [filteredRows]);

  // Tổng số liệu KPI trên toàn bộ danh sách đã lọc
  const totalPayrollAmount = filteredRows.reduce((s, r) => s + r.calculatedAmount, 0);
  const totalPaidAmount = filteredRows.filter(r => r.isPaid).reduce((s, r) => s + r.calculatedAmount, 0);
  const totalUnpaidAmount = Math.max(0, totalPayrollAmount - totalPaidAmount);

  // Cập nhật trạng thái Đã thanh toán / Chưa thanh toán
  const handleUpdatePaymentStatus = async (targetRows: FlattenedPayrollRow[], nextPaidStatus: boolean) => {
    if (targetRows.length === 0) return;
    const loadingKey = targetRows.length === 1 ? targetRows[0].rowId : 'batch';
    setIsUpdating(loadingKey);

    try {
      const byBooking = new Map<string, Set<string>>();
      targetRows.forEach(r => {
        if (!byBooking.has(r.bookingId)) byBooking.set(r.bookingId, new Set());
        byBooking.get(r.bookingId)!.add(r.crewItemId);
      });

      const updatedBookings = [...bookings];

      for (const [bId, crewIdsSet] of byBooking.entries()) {
        const bIndex = updatedBookings.findIndex(b => b.id === bId);
        if (bIndex === -1) continue;

        const targetBooking = updatedBookings[bIndex];
        let currentCrew: CrewAssignmentItem[] =
          targetBooking.crew_assignments && targetBooking.crew_assignments.length > 0
            ? [...targetBooking.crew_assignments]
            : [];

        if (currentCrew.length === 0) {
          if (targetBooking.photographer_id || targetBooking.photographer) {
            currentCrew.push({
              id: `auto-photo-${targetBooking.id}`,
              user_id: targetBooking.photographer_id || targetBooking.photographer?.id,
              role: 'lead_photographer',
              name: targetBooking.photographer?.full_name || 'Thợ chụp chính',
              phone: targetBooking.photographer?.phone,
              fee: 30,
              fee_type: 'percent',
              is_paid: false,
            });
          }
          if (targetBooking.makeup_artist_id || targetBooking.makeup_artist) {
            currentCrew.push({
              id: `auto-mua-${targetBooking.id}`,
              user_id: targetBooking.makeup_artist_id || targetBooking.makeup_artist?.id,
              role: 'makeup_artist',
              name: targetBooking.makeup_artist?.full_name || 'Thợ Makeup (MUA)',
              phone: targetBooking.makeup_artist?.phone,
              fee: 500000,
              fee_type: 'fixed',
              is_paid: false,
            });
          }
        }

        const nextCrew = currentCrew.map((c, idx) => {
          const cid = c.id || `crew-${idx}`;
          if (crewIdsSet.has(cid)) {
            return { ...c, is_paid: nextPaidStatus };
          }
          return c;
        });

        const miscExpensesTotal = (targetBooking.expenseDetails || []).reduce(
          (sum: number, item: ExpenseItem) => sum + Number(item.amount || 0),
          0
        );
        const crewCostTotal = nextCrew.reduce((sum, m) => {
          const amt =
            m.fee_type === 'percent'
              ? Math.round((targetBooking.packagePrice * Number(m.fee || 0)) / 100)
              : Number(m.fee || 0);
          return sum + amt;
        }, 0);

        const combinedExpenses = miscExpensesTotal + crewCostTotal;

        if (isSupabaseConfigured && UUID_REGEX.test(bId)) {
          await supabase
            .from('bookings')
            .update({
              crew_assignments: nextCrew,
              expenses: combinedExpenses,
              updated_at: new Date().toISOString(),
            })
            .eq('id', bId);
        }

        updatedBookings[bIndex] = {
          ...targetBooking,
          crew_assignments: nextCrew,
          expenses: combinedExpenses,
        };
      }

      setBookings(updatedBookings);
      setToast({
        type: 'success',
        text: nextPaidStatus
          ? `Đã xác nhận thanh toán thù lao (${targetRows.length} ca chụp)`
          : 'Đã chuyển trạng thái về Chưa thanh toán',
      });
    } catch (err: any) {
      console.error('Lỗi cập nhật trạng thái thù lao:', err);
      setToast({ type: 'error', text: 'Không thể cập nhật trạng thái. Vui lòng thử lại.' });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.text}</span>
          </span>
          <button type="button" onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>{isStudioMember ? 'Tổng Thù Lao Của Tôi' : 'Tổng Quỹ Lương & Thù Lao Ekip'}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-gray-900 dark:text-white">
            {totalPayrollAmount.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            {filteredRows.length} lượt phân công
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>{isStudioMember ? 'Đã Nhận Thanh Toán' : 'Đã Chi Trả Cho Ekip'}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {totalPaidAmount.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
            {filteredRows.filter(r => r.isPaid).length} ca đã thanh toán
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-rose-200/70 dark:border-rose-900/40 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>{isStudioMember ? 'Chờ Studio Thanh Toán' : 'Công Nợ Lương Cần Chi'}</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
            {totalUnpaidAmount.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-rose-600/70 dark:text-rose-400/70">
            {filteredRows.filter(r => !r.isPaid).length} ca chờ thanh toán
          </p>
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chọn Tháng */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <input
              type="month"
              value={selectedMonth === 'all' ? '' : selectedMonth}
              onChange={e => setSelectedMonth(e.target.value || 'all')}
              className="bg-transparent font-semibold text-gray-900 dark:text-white outline-none cursor-pointer"
            />
            {selectedMonth !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className="text-[10px] text-orange-500 hover:underline ml-1 font-bold"
              >
                Tất cả tháng
              </button>
            )}
          </div>

          {/* Lọc Vai Trò */}
          {!isStudioMember && (
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              {Object.entries(CREW_ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          )}

          {/* Lọc Trạng thái thanh toán */}
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 text-xs font-bold">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'unpaid', label: 'Chưa trả' },
              { id: 'paid', label: 'Đã trả' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPaymentFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  paymentFilter === tab.id
                    ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ô Tìm Kiếm */}
        <div className="relative md:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isStudioMember ? 'Tìm theo tên khách...' : 'Tìm tên thợ, makeup, khách...'}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* 3. BẢNG TỔNG HỢP CÔNG NỢ THEO NHÂN SỰ */}
      {!isStudioMember && staffSummaries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              <span>Tổng Hợp Thù Lao Theo Nhân Sự ({staffSummaries.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffSummaries.map(group => {
              const unpaidRows = group.rows.filter(r => !r.isPaid);
              return (
                <div
                  key={group.staffKey}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {group.staffName}
                        </h4>
                        {group.staffPhone && (
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{group.staffPhone}</span>
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        {group.showCount} show
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {Array.from(group.roles).map(r => {
                        const cfg = CREW_ROLE_LABELS[r] || CREW_ROLE_LABELS.other;
                        return (
                          <span
                            key={r}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${cfg.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                            <span>{cfg.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-zinc-400">Tổng thù lao:</span>
                      <strong className="font-mono text-gray-900 dark:text-white">
                        {group.totalAmount.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-zinc-400">Còn nợ:</span>
                      <strong
                        className={`font-mono ${
                          group.unpaidAmount > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {group.unpaidAmount > 0
                          ? `${group.unpaidAmount.toLocaleString('vi-VN')} đ`
                          : 'Đã hoàn tất'}
                      </strong>
                    </div>

                    {unpaidRows.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setQrPayoutModal({
                              isOpen: true,
                              staffName: group.staffName,
                              amount: group.unpaidAmount,
                              transferNote: `Thanh toan thu lao ${unpaidRows.length} show ${selectedMonth !== 'all' ? selectedMonth : ''}`.trim(),
                              bankName: group.bankName,
                              bankAccount: group.bankAccount,
                              rowsToMarkPaid: unpaidRows,
                            })
                          }
                          className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Tất Toán ({unpaidRows.length} show)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DANH SÁCH CHI TIẾT TỪNG CA CHỤP */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>Chi Tiết Thù Lao Từng Ca Chụp ({filteredRows.length})</span>
        </h3>

        {isLoading ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            <p className="text-xs text-gray-500 dark:text-zinc-400">Đang tải dữ liệu thù lao...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-gray-200 dark:border-zinc-800 text-center space-y-2">
            <Wallet className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
              Không có bản ghi thù lao nào trong kỳ này
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-950/60 text-[11px] font-bold uppercase text-gray-500 dark:text-zinc-400">
                    <th className="py-3.5 px-4">Ngày chụp</th>
                    <th className="py-3.5 px-4">Show / Khách hàng</th>
                    {!isStudioMember && <th className="py-3.5 px-4">Nhân sự</th>}
                    <th className="py-3.5 px-4">Vai trò</th>
                    <th className="py-3.5 px-4 text-right">Mức tính</th>
                    <th className="py-3.5 px-4 text-right">Thành tiền</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                  {filteredRows.map(row => {
                    const roleCfg = CREW_ROLE_LABELS[row.role] || CREW_ROLE_LABELS.other;
                    return (
                      <tr
                        key={row.rowId}
                        className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                          {row.eventDate}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {row.clientName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {row.packagePrice.toLocaleString('vi-VN')} đ
                          </div>
                        </td>
                        {!isStudioMember && (
                          <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                            {row.staffName}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleCfg.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dotColor}`} />
                            <span>{roleCfg.label}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-500 dark:text-zinc-400">
                          {row.feeType === 'percent' ? `${row.rawFee}% gói` : 'Cố định'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                          {row.calculatedAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isStudioMember ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                row.isPaid
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {row.isPaid ? '✓ Đã nhận' : 'Chờ thanh toán'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdating === row.rowId}
                              onClick={() => handleUpdatePaymentStatus([row], !row.isPaid)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                row.isPaid
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                              }`}
                              title="Nhấn để đổi trạng thái thanh toán"
                            >
                              {row.isPaid ? '✓ Đã thanh toán' : 'Chưa trả (Nhấn để duyệt)'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL QUÉT VIETQR & TẤT TOÁN LƯƠNG NHÂN SỰ */}
      {qrPayoutModal && qrPayoutModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setQrPayoutModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block">
                  Quyết Toán Thù Lao
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {qrPayoutModal.staffName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrPayoutModal(null)}
                className="p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-zinc-950 border border-orange-200/60 dark:border-zinc-800 text-center space-y-1">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Tổng thanh toán ({qrPayoutModal.rowsToMarkPaid.length} ca):</span>
              <div className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
                {qrPayoutModal.amount.toLocaleString('vi-VN')} đ
              </div>
            </div>

            {qrPayoutModal.bankName && qrPayoutModal.bankAccount ? (
              <div className="text-center space-y-2">
                <img
                  src={`https://img.vietqr.io/image/${encodeURIComponent(
                    qrPayoutModal.bankName.replace(/\s+/g, '')
                  )}-${encodeURIComponent(
                    qrPayoutModal.bankAccount
                  )}-compact2.png?amount=${qrPayoutModal.amount}&addInfo=${encodeURIComponent(
                    qrPayoutModal.transferNote
                  )}&accountName=${encodeURIComponent(qrPayoutModal.staffName)}`}
                  alt="VietQR Payout"
                  className="mx-auto max-w-[240px] rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-md bg-white p-2"
                />
                <p className="text-xs font-mono text-gray-600 dark:text-zinc-300">
                  {qrPayoutModal.bankName} • <strong>{qrPayoutModal.bankAccount}</strong>
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 text-xs text-gray-600 dark:text-zinc-300 space-y-2">
                <p>
                  Chưa cập nhật tài khoản ngân hàng. Bạn có thể sao chép thông tin để chuyển khoản:
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="truncate">{qrPayoutModal.transferNote}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${qrPayoutModal.amount} - ${qrPayoutModal.transferNote}`
                      );
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shrink-0 cursor-pointer"
                  >
                    {copiedText ? 'Đã copy' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQrPayoutModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isUpdating === 'batch'}
                onClick={async () => {
                  await handleUpdatePaymentStatus(qrPayoutModal.rowsToMarkPaid, true);
                  setQrPayoutModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Đã Chuyển Khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
