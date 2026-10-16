import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarEvent,
  GearItem,
  ExpenseItem,
  StudioMember,
  StaffInfo,
  CrewAssignmentItem,
  CrewRole,
  ProofingSession,
  ProofingItem,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  checkAssignedGearConflicts,
  checkAssignedStaffConflicts,
  DynamicGearConflict,
  StaffConflictDetail,
} from '../../lib/conflictScanner';
import { STANDARD_CATEGORIES, getCategoryConfig, normalizeCategory } from '../../utils/categoryConfig';
import { formatCurrencyVND, parseCurrencyVND } from '../../utils/currency';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Save,
  Loader2,
  ShieldAlert,
  Phone,
  Info,
  Search,
  Receipt,
  Plus,
  Trash2,
  Tag,
  Calculator,
  UserCheck,
  Pencil,
  Download,
  ExternalLink,
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  Gift,
  Send,
  QrCode,
  Users,
  FolderOpen,
  FileCheck2,
  Lock,
  Unlock,
  Image as ImageIcon,
  Upload,
  Heart,
} from 'lucide-react';
import { batchCompressImages } from '../../utils/imageCompressor';
import { openZaloChat, generatePhotoDeliveryMessage } from '../../lib/zaloMessenger';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../utils/googleCalendarSync';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CREW_ROLE_CONFIG: Record<CrewRole, { label: string; badgeClass: string; dotColor: string }> = {
  lead_photographer: {
    label: 'Thợ chụp chính',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  videographer: {
    label: 'Quay phim / Video',
    badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    dotColor: 'bg-indigo-400',
  },
  makeup_artist: {
    label: 'Makeup & Hair',
    badgeClass: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
    dotColor: 'bg-fuchsia-400',
  },
  assistant: {
    label: 'Trợ lý / Ánh sáng',
    badgeClass: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  retoucher: {
    label: 'Retoucher / Hậu kỳ',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  other: {
    label: 'Khác / Hỗ trợ',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    dotColor: 'bg-slate-400',
  },
};

const DEMO_GALLERY_PHOTOS = [
  { filename: 'IMG_2041.JPG', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2042.JPG', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2043.JPG', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2044.JPG', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2045.JPG', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2046.JPG', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2047.JPG', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2048.JPG', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2049.JPG', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2050.JPG', url: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2051.JPG', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80' },
  { filename: 'IMG_2052.JPG', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80' },
];

interface Props {
  isOpen: boolean;
  booking: CalendarEvent | null;
  allBookings: CalendarEvent[];
  onClose: () => void;
  onBookingUpdated?: (updatedBooking: CalendarEvent) => void;
  onOpenDebtReminder?: (booking: CalendarEvent) => void;
  onEditFinancials?: (booking: CalendarEvent) => void;
}

export const BookingDetailModal: React.FC<Props> = ({
  isOpen,
  booking,
  allBookings,
  onClose,
  onBookingUpdated,
  onOpenDebtReminder,
  onEditFinancials,
}) => {
  const { user } = useAuth();
  const { currentStudio } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'crew' | 'gears' | 'expenses' | 'delivery'>('crew');
  const [gears, setGears] = useState<GearItem[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState(false);
  const [selectedGearIds, setSelectedGearIds] = useState<string[]>([]);
  const [isOverrideConfirmed, setIsOverrideConfirmed] = useState(false);
  const [gearSearch, setGearSearch] = useState('');
  const [gearCategory, setGearCategory] = useState<string>('all');

  // Photo Delivery & Client Proofing States
  const [deliveryLink, setDeliveryLink] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [markAsDelivered, setMarkAsDelivered] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [proofingSession, setProofingSession] = useState<ProofingSession>({
    drive_preview_link: '',
    max_selections: 20,
    selected_filenames: [],
    items: [],
    is_locked: false,
  });
  const [copiedLightroomQuery, setCopiedLightroomQuery] = useState(false);
  const [isUploadingPreviews, setIsUploadingPreviews] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // Staff Assignment States
  const [assignedPhotographerId, setAssignedPhotographerId] = useState<string>('');
  const [assignedMakeupId, setAssignedMakeupId] = useState<string>('');
  const [studioMembers, setStudioMembers] = useState<StudioMember[]>([]);

  // Crew & Payroll States
  const [crewMembers, setCrewMembers] = useState<CrewAssignmentItem[]>([]);
  const [newCrewRole, setNewCrewRole] = useState<CrewRole>('assistant');
  const [newCrewName, setNewCrewName] = useState<string>('');
  const [newCrewFee, setNewCrewFee] = useState<number | string>('');
  const [newCrewFeeType, setNewCrewFeeType] = useState<'fixed' | 'percent'>('fixed');
  const [newCrewPhone, setNewCrewPhone] = useState<string>('');
  const [newCrewMemberUserId, setNewCrewMemberUserId] = useState<string>('');

  // Category & Package Type States
  const [selectedCategory, setSelectedCategory] = useState<string>('portrait');
  const [packageType, setPackageType] = useState<string>('');

  // Job Costing States
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync selected gears, staff & expenses whenever booking changes
  useEffect(() => {
    if (booking) {
      setSelectedGearIds(booking.assignedGears || []);
      setIsOverrideConfirmed(false);
      setExpenseItems(booking.expenseDetails || []);
      setNewExpenseName('');
      setNewExpenseAmount('');
      setAssignedPhotographerId(booking.photographer_id || booking.photographer?.id || '');
      setAssignedMakeupId(booking.makeup_artist_id || booking.makeup_artist?.id || '');
      setSelectedCategory(normalizeCategory(booking.category || booking.sessionType));
      setPackageType(booking.package_type || '');
      setDeliveryLink(booking.drive_delivery_link || '');
      setDeliveryNotes(booking.delivery_notes || '');
      setDeliveryDate(
        booking.delivery_date
          ? booking.delivery_date.substring(0, 10)
          : new Date().toISOString().substring(0, 10)
      );
      setMarkAsDelivered(
        booking.status === 'da_tra_file' ||
          booking.status === 'done' ||
          booking.status === 'hoan_thanh'
      );

      setProofingSession(
        booking.proofing_session || {
          drive_preview_link: booking.drive_delivery_link || '',
          max_selections: 20,
          selected_filenames: [],
          items: [],
          is_locked: false,
        }
      );

      if (booking.crew_assignments && booking.crew_assignments.length > 0) {
        setCrewMembers(booking.crew_assignments);
      } else {
        const initialCrew: CrewAssignmentItem[] = [];
        if (booking.photographer?.full_name || booking.photographer_id) {
          initialCrew.push({
            id: 'crew-photo-' + Date.now(),
            user_id: booking.photographer_id || booking.photographer?.id,
            role: 'lead_photographer',
            name: booking.photographer?.full_name || 'Thợ chụp chính',
            phone: booking.photographer?.phone || '',
            fee: 30,
            fee_type: 'percent',
            is_paid: false,
          });
        }
        if (booking.makeup_artist?.full_name || booking.makeup_artist_id) {
          initialCrew.push({
            id: 'crew-mua-' + Date.now(),
            user_id: booking.makeup_artist_id || booking.makeup_artist?.id,
            role: 'makeup_artist',
            name: booking.makeup_artist?.full_name || 'Thợ Makeup',
            phone: booking.makeup_artist?.phone || '',
            fee: 500000,
            fee_type: 'fixed',
            is_paid: false,
          });
        }
        setCrewMembers(initialCrew);
      }
    }
  }, [booking]);

  // Fetch studio members (Photographers & Makeup Artists)
  useEffect(() => {
    if (!isOpen) return;

    const fetchStudioStaff = async () => {
      try {
        if (isSupabaseConfigured && currentStudio && UUID_REGEX.test(currentStudio.id)) {
          const { data, error } = await supabase
            .from('studio_members')
            .select(`
              id,
              studio_id,
              user_id,
              role,
              status,
              facebook_url,
              is_verified,
              users:user_id (
                id,
                full_name,
                avatar_url,
                phone,
                email,
                facebook_url,
                is_verified
              )
            `)
            .eq('studio_id', currentStudio.id)
            .eq('status', 'approved');

          if (!error && data && data.length > 0) {
            setStudioMembers(
              data.map((r: any) => ({
                id: r.id,
                studio_id: r.studio_id,
                user_id: r.user_id,
                role: r.role,
                status: r.status,
                facebook_url: r.facebook_url || r.users?.facebook_url || null,
                is_verified: r.is_verified || r.users?.is_verified || false,
                user: r.users
                  ? {
                      ...r.users,
                      facebook_url: r.users.facebook_url || r.facebook_url || null,
                      is_verified: r.users.is_verified || r.is_verified || false,
                    }
                  : undefined,
              }))
            );
            return;
          }
        }

        // Demo / Fallback Staff
        setStudioMembers([
          {
            id: 'sm-p1',
            studio_id: 'studio-1',
            user_id: 'u-photo-1',
            role: 'photographer',
            status: 'approved',
            facebook_url: 'https://facebook.com/johnnylongho',
            is_verified: true,
            user: {
              id: 'u-photo-1',
              full_name: 'Johnny Long (Lead Photo)',
              email: 'johnny@lensy.io',
              phone: '0901234567',
              avatar_url: '/mirmia-logo.png',
              facebook_url: 'https://facebook.com/johnnylongho',
              is_verified: true,
            },
          },
          {
            id: 'sm-p2',
            studio_id: 'studio-1',
            user_id: 'u-photo-2',
            role: 'photographer',
            status: 'approved',
            user: {
              id: 'u-photo-2',
              full_name: 'Minh Hoàng (Second Shooter)',
              email: 'hoang.photo@lensy.io',
              phone: '0912345678',
              avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            },
          },
          {
            id: 'sm-m1',
            studio_id: 'studio-1',
            user_id: 'u-mua-1',
            role: 'makeup_artist',
            status: 'approved',
            user: {
              id: 'u-mua-1',
              full_name: 'Lan Anh MUA (Lead MUA)',
              email: 'lananh.makeup@gmail.com',
              phone: '0988776655',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            },
          },
          {
            id: 'sm-m2',
            studio_id: 'studio-1',
            user_id: 'u-mua-2',
            role: 'makeup_artist',
            status: 'approved',
            user: {
              id: 'u-mua-2',
              full_name: 'Bảo Trâm Makeup (Bridal Specialist)',
              email: 'baotram.mua@gmail.com',
              phone: '0933221100',
              avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            },
          },
        ]);
      } catch (err) {
        console.warn('Lỗi khi tải nhân sự Studio:', err);
      }
    };

    fetchStudioStaff();
  }, [isOpen, currentStudio]);

  // Fetch gears of Studio Workspace & Photographer
  useEffect(() => {
    if (!isOpen) return;

    const loadGears = async () => {
      setIsLoadingGears(true);
      try {
        if (isSupabaseConfigured) {
          let query = supabase.from('gears').select('*').order('created_at', { ascending: false });
          const validStudioId = currentStudio && UUID_REGEX.test(currentStudio.id) ? currentStudio.id : null;
          const validUserId = user && UUID_REGEX.test(user.id) ? user.id : null;

          if (validStudioId && validUserId) {
            query = query.or(`studio_id.eq.${validStudioId},photographer_id.eq.${validUserId}`);
          } else if (validStudioId) {
            query = query.eq('studio_id', validStudioId);
          } else if (validUserId) {
            query = query.eq('photographer_id', validUserId);
          }

          const { data, error } = await query;
          if (error) throw error;
          setGears(data || []);
        } else {
          setGears([]);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải danh sách thiết bị:', err);
        setGears([]);
      } finally {
        setIsLoadingGears(false);
      }
    };

    loadGears();
  }, [isOpen, user, currentStudio]);

  // Đồng bộ 2 chiều khi Admin đổi Thợ Chụp trong Dropdown
  const handleSelectPhotographerDropdown = (newPhotoId: string) => {
    setAssignedPhotographerId(newPhotoId);
    if (!newPhotoId) return;

    const memberObj = studioMembers.find(m => m.user_id === newPhotoId || m.id === newPhotoId);
    const memberName = memberObj?.user?.full_name || 'Thợ chụp chính';
    const memberPhone = memberObj?.user?.phone || '';

    setCrewMembers(prev => {
      const existingIdx = prev.findIndex(m => m.role === 'lead_photographer');
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          user_id: newPhotoId,
          name: memberName,
          phone: memberPhone,
        };
        return updated;
      }
      return [
        {
          id: 'crew-photo-' + Date.now(),
          user_id: newPhotoId,
          role: 'lead_photographer',
          name: memberName,
          phone: memberPhone,
          fee: 30,
          fee_type: 'percent',
          is_paid: false,
        },
        ...prev,
      ];
    });
  };

  // Đồng bộ 2 chiều khi Admin đổi Thợ Makeup trong Dropdown
  const handleSelectMakeupDropdown = (newMuaId: string) => {
    setAssignedMakeupId(newMuaId);
    if (!newMuaId) return;

    const memberObj = studioMembers.find(m => m.user_id === newMuaId || m.id === newMuaId);
    const memberName = memberObj?.user?.full_name || 'Thợ Makeup';
    const memberPhone = memberObj?.user?.phone || '';

    setCrewMembers(prev => {
      const existingIdx = prev.findIndex(m => m.role === 'makeup_artist');
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          user_id: newMuaId,
          name: memberName,
          phone: memberPhone,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: 'crew-mua-' + Date.now(),
          user_id: newMuaId,
          role: 'makeup_artist',
          name: memberName,
          phone: memberPhone,
          fee: 500000,
          fee_type: 'fixed',
          is_paid: false,
        },
      ];
    });
  };

  // Quét xung đột lịch Nhân sự theo ngày + khung giờ
  const activeStaffConflicts: StaffConflictDetail[] = useMemo(() => {
    if (!booking) return [];
    const staffToCheck: Array<{ userId?: string | null; name: string; roleLabel: string }> = [];

    if (assignedPhotographerId) {
      const m = studioMembers.find(s => s.user_id === assignedPhotographerId || s.id === assignedPhotographerId);
      staffToCheck.push({
        userId: assignedPhotographerId,
        name: m?.user?.full_name || booking.photographer?.full_name || 'Thợ chụp chính',
        roleLabel: 'Thợ chụp chính',
      });
    }

    if (assignedMakeupId) {
      const m = studioMembers.find(s => s.user_id === assignedMakeupId || s.id === assignedMakeupId);
      staffToCheck.push({
        userId: assignedMakeupId,
        name: m?.user?.full_name || booking.makeup_artist?.full_name || 'Thợ Makeup (MUA)',
        roleLabel: 'Thợ Makeup (MUA)',
      });
    }

    crewMembers.forEach(cm => {
      if (
        cm.user_id &&
        cm.user_id !== assignedPhotographerId &&
        cm.user_id !== assignedMakeupId
      ) {
        const conf = CREW_ROLE_CONFIG[cm.role] || CREW_ROLE_CONFIG.other;
        staffToCheck.push({
          userId: cm.user_id,
          name: cm.name,
          roleLabel: conf.label,
        });
      }
    });

    return checkAssignedStaffConflicts(
      booking.eventDate,
      booking.id,
      staffToCheck,
      allBookings,
      booking.startTime,
      booking.endTime
    );
  }, [booking, assignedPhotographerId, assignedMakeupId, crewMembers, studioMembers, allBookings]);

  if (!isOpen || !booking) return null;

  // Kiểm tra nhanh 1 nhân sự trong dropdown có đang kẹt show khác không
  const getStaffBusyNote = (staffUserId: string): string => {
    const conflicts = checkAssignedStaffConflicts(
      booking.eventDate,
      booking.id,
      [{ userId: staffUserId, name: '', roleLabel: '' }],
      allBookings,
      booking.startTime,
      booking.endTime
    );
    if (conflicts.length === 0) return '';
    const first = conflicts[0];
    return first.severity === 'hard'
      ? ` — ⚠️ Trùng giờ show "${first.conflictingClientName}" (${first.timeRange})`
      : ` — Có lịch ca ${first.timeRange}`;
  };

  // Quét xung đột thiết bị
  const activeConflicts: DynamicGearConflict[] = checkAssignedGearConflicts(
    booking.eventDate,
    booking.id,
    selectedGearIds,
    allBookings,
    gears,
    booking.startTime,
    booking.endTime
  );

  const getSingleGearConflict = (gearId: string): DynamicGearConflict | null => {
    const res = checkAssignedGearConflicts(
      booking.eventDate,
      booking.id,
      [gearId],
      allBookings,
      gears,
      booking.startTime,
      booking.endTime
    );
    return res.length > 0 ? res[0] : null;
  };

  const handleToggleGear = (gearId: string) => {
    setSelectedGearIds(prev =>
      prev.includes(gearId) ? prev.filter(id => id !== gearId) : [...prev, gearId]
    );
  };

  // Hạch toán chi phí
  const EXPENSE_PRESETS = [
    { name: 'Makeup Artist', amount: 1500000 },
    { name: 'Grab / Di chuyển', amount: 300000 },
    { name: 'Thuê phim trường / Studio', amount: 1200000 },
    { name: 'Trợ lý ánh sáng (Second)', amount: 600000 },
    { name: 'In album / Ép gỗ', amount: 800000 },
    { name: 'Ăn uống / Cơm đoàn', amount: 250000 },
  ];

  const handleAddExpense = (presetName?: string, presetAmount?: number) => {
    const title = (presetName !== undefined ? presetName : newExpenseName).trim();
    const cost = presetAmount !== undefined ? presetAmount : (Number(newExpenseAmount) || 0);

    if (!title) {
      setToastMessage({ type: 'error', text: 'Vui lòng nhập tên khoản chi (VD: Makeup, Taxi...)' });
      return;
    }
    if (cost <= 0) {
      setToastMessage({ type: 'error', text: 'Số tiền chi phí phải lớn hơn 0 đ.' });
      return;
    }

    const newItem: ExpenseItem = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: title,
      amount: cost,
    };

    setExpenseItems(prev => [...prev, newItem]);
    setNewExpenseName('');
    setNewExpenseAmount('');
    setToastMessage({ type: 'success', text: `Đã thêm khoản chi: "${title}" (${cost.toLocaleString('vi-VN')} đ)` });
  };

  const handleRemoveExpense = (index: number) => {
    const item = expenseItems[index];
    setExpenseItems(prev => prev.filter((_, i) => i !== index));
    if (item) {
      setToastMessage({ type: 'success', text: `Đã xóa khoản chi "${item.name}"` });
    }
  };

  // Phân công Ê-kíp
  const handleAddCrewMember = () => {
    let name = newCrewName.trim();
    let phone = newCrewPhone.trim();
    const userId = newCrewMemberUserId || undefined;

    if (newCrewMemberUserId) {
      const found = studioMembers.find(m => m.user_id === newCrewMemberUserId || m.id === newCrewMemberUserId);
      if (found) {
        name = found.user?.full_name || name || 'Thành viên Studio';
        phone = found.user?.phone || phone;
      }
    }

    if (!name) {
      setToastMessage({ type: 'error', text: 'Vui lòng nhập tên nhân sự hoặc chọn từ danh sách Studio.' });
      return;
    }

    const feeNum = Number(newCrewFee) || 0;

    const newMember: CrewAssignmentItem = {
      id: 'crew-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      role: newCrewRole,
      name,
      phone,
      fee: feeNum,
      fee_type: newCrewFeeType,
      is_paid: false,
    };

    setCrewMembers(prev => [...prev, newMember]);
    if (newCrewRole === 'lead_photographer' && userId) {
      setAssignedPhotographerId(userId);
    } else if (newCrewRole === 'makeup_artist' && userId) {
      setAssignedMakeupId(userId);
    }

    setNewCrewName('');
    setNewCrewPhone('');
    setNewCrewFee('');
    setNewCrewMemberUserId('');
    setToastMessage({ type: 'success', text: `Đã thêm ${name} vào ê-kíp show!` });
  };

  const handleRemoveCrewMember = (id?: string) => {
    setCrewMembers(prev => prev.filter(m => m.id !== id));
    setToastMessage({ type: 'success', text: 'Đã gỡ nhân sự khỏi ê-kíp.' });
  };

  const handleToggleCrewPaid = (id?: string) => {
    setCrewMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, is_paid: !m.is_paid } : m))
    );
  };

  const handleCopyVietQrTransfer = (member: CrewAssignmentItem) => {
    const calculatedFee =
      member.fee_type === 'percent'
        ? Math.round((booking.packagePrice * Number(member.fee || 0)) / 100)
        : Number(member.fee || 0);

    const transferContent = `Thu lao show ${booking.clientName} ngay ${booking.eventDate}`;
    const textToCopy = `Thù lao: ${calculatedFee.toLocaleString('vi-VN')} đ | Nội dung CK: ${transferContent}`;
    navigator.clipboard.writeText(textToCopy);
    setToastMessage({ type: 'success', text: `Đã sao chép cú pháp chuyển khoản thù lao cho ${member.name}!` });
  };

  // Cổng chọn ảnh (Client Proofing)
  const clientSelectedItems = (proofingSession.items || []).filter(
    i => i.is_selected === true || (!i.preview_url && i.is_selected !== false)
  );
  const galleryPreviewItems = (proofingSession.items || []).filter(
    i => Boolean(i.preview_url || i.thumbnail_url)
  );

  const handleCopyLightroomQuery = () => {
    const listToCopy = clientSelectedItems.length > 0 ? clientSelectedItems : (proofingSession.items || []);
    const filenames = listToCopy.map(i => i.filename).join(', ');
    if (!filenames) {
      setToastMessage({ type: 'error', text: 'Chưa có ảnh nào trong danh sách chọn!' });
      return;
    }
    navigator.clipboard.writeText(filenames);
    setCopiedLightroomQuery(true);
    setTimeout(() => setCopiedLightroomQuery(false), 2500);
    setToastMessage({ type: 'success', text: `Đã copy ${listToCopy.length} mã file cho Lightroom Library!` });
  };

  const handleUnlockProofing = () => {
    setProofingSession(prev => ({
      ...prev,
      is_locked: false,
    }));
    setToastMessage({ type: 'success', text: 'Đã mở khóa chọn ảnh cho khách hàng.' });
  };

  const handleSendRetoucherZalo = () => {
    const listToSend = clientSelectedItems.length > 0 ? clientSelectedItems : (proofingSession.items || []);
    const filenames = listToSend.map(i => i.filename).join(', ');
    const retoucherMsg = `Chào bạn, Studio gửi danh sách ${listToSend.length} ảnh cần retouch cho show ${booking.clientName} (ngày ${booking.eventDate}):\n${filenames}\n\nLink drive gốc: ${proofingSession.drive_preview_link || deliveryLink || 'Xem trên hệ thống'}`;
    navigator.clipboard.writeText(retoucherMsg);
    setToastMessage({ type: 'success', text: 'Đã copy thông điệp gửi Retoucher qua Zalo!' });
  };

  const handleUploadPreviewFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploadingPreviews(true);
    setUploadProgress({ current: 0, total: fileList.length });

    try {
      const compressed = await batchCompressImages(fileList, (current, total) => {
        setUploadProgress({ current, total });
      });

      const existingItems = proofingSession.items || [];
      const newItems: ProofingItem[] = compressed.map(res => {
        const oldMatch = existingItems.find(ex => ex.filename.toUpperCase() === res.filename.toUpperCase());
        return {
          id: oldMatch?.id || 'proof-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          filename: res.filename,
          preview_url: res.dataUrl,
          thumbnail_url: res.dataUrl,
          is_selected: oldMatch?.is_selected || false,
          notes: oldMatch?.notes,
        };
      });

      const mergedMap = new Map<string, ProofingItem>();
      existingItems.forEach(item => mergedMap.set(item.filename.toUpperCase(), item));
      newItems.forEach(item => mergedMap.set(item.filename.toUpperCase(), item));
      const finalItems = Array.from(mergedMap.values());

      setProofingSession({
        ...proofingSession,
        items: finalItems,
      });
      setToastMessage({
        type: 'success',
        text: `Đã nạp và nén ${compressed.length} ảnh preview vào Gallery thành công.`,
      });
    } catch (err: any) {
      console.error('Lỗi nén ảnh preview:', err);
      setToastMessage({ type: 'error', text: `Lỗi xử lý ảnh: ${err.message || 'Không thể nén ảnh'}` });
    } finally {
      setIsUploadingPreviews(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleLoadDemoGallery = () => {
    const existingItems = proofingSession.items || [];
    const demoItems: ProofingItem[] = DEMO_GALLERY_PHOTOS.map((demo, idx) => {
      const oldMatch = existingItems.find(ex => ex.filename.toUpperCase() === demo.filename.toUpperCase());
      return {
        id: oldMatch?.id || `demo-${idx + 1}`,
        filename: demo.filename,
        preview_url: demo.url,
        thumbnail_url: demo.url,
        is_selected: oldMatch?.is_selected !== undefined ? oldMatch.is_selected : idx < 3,
        notes: oldMatch?.notes || (idx === 0 ? 'Bóp eo nhẹ, làm sáng da' : undefined),
      };
    });

    const mergedMap = new Map<string, ProofingItem>();
    existingItems.forEach(item => mergedMap.set(item.filename.toUpperCase(), item));
    demoItems.forEach(item => mergedMap.set(item.filename.toUpperCase(), item));
    const finalItems = Array.from(mergedMap.values());

    setProofingSession({
      ...proofingSession,
      items: finalItems,
      selected_filenames: finalItems.filter(i => i.is_selected).map(i => i.filename),
    });
    setToastMessage({
      type: 'success',
      text: 'Đã nạp 12 ảnh mẫu demo vào Visual Gallery.',
    });
  };

  const handleRemoveGalleryItem = (filename: string) => {
    const remaining = (proofingSession.items || []).filter(
      i => i.filename.toUpperCase() !== filename.toUpperCase()
    );
    setProofingSession(prev => ({
      ...prev,
      items: remaining,
      selected_filenames: (prev.selected_filenames || []).filter(f => f.toUpperCase() !== filename.toUpperCase()),
    }));
    setToastMessage({ type: 'success', text: `Đã xóa ảnh ${filename} khỏi kho preview.` });
  };

  const handleClearAllGallery = () => {
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ ảnh preview trong Gallery này?')) return;
    setProofingSession(prev => ({
      ...prev,
      items: [],
      selected_filenames: [],
    }));
    setToastMessage({ type: 'success', text: 'Đã làm trống Visual Gallery.' });
  };

  // Tính toán tài chính
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalCrewCost = crewMembers.reduce((sum, member) => {
    if (member.fee_type === 'percent') {
      return sum + Math.round((booking.packagePrice * Number(member.fee || 0)) / 100);
    }
    return sum + Number(member.fee || 0);
  }, 0);

  const paidCrewCost = crewMembers
    .filter(m => m.is_paid)
    .reduce((sum, member) => {
      if (member.fee_type === 'percent') {
        return sum + Math.round((booking.packagePrice * Number(member.fee || 0)) / 100);
      }
      return sum + Number(member.fee || 0);
    }, 0);

  const unpaidCrewCost = Math.max(0, totalCrewCost - paidCrewCost);
  const combinedTotalCost = totalExpenses + totalCrewCost;

  const effectivePaid = Number(booking.paidAmount || booking.depositAmount || 0);
  const netProfit = effectivePaid - combinedTotalCost;
  const projectedNetProfit = booking.packagePrice - combinedTotalCost;
  const profitMargin = booking.packagePrice > 0 ? Math.round((projectedNetProfit / booking.packagePrice) * 100) : 0;

  // Lưu phân bổ thiết bị, hạch toán chi phí VÀ phân công nhân sự vào Supabase
  const handleSaveAssignedGears = async () => {
    if (activeConflicts.length > 0 && !isOverrideConfirmed) {
      setToastMessage({
        type: 'error',
        text: `Lưu bị chặn! Thiết bị vừa chọn bị trùng với lịch khác cùng ngày (${booking.eventDate}). Vui lòng gỡ thiết bị hoặc tích chọn xác nhận ghi đè để tiếp tục.`,
      });
      return;
    }

    setIsSaving(true);
    try {
      const canonicalCategory = normalizeCategory(selectedCategory);
      const nextStatus =
        markAsDelivered && booking.status !== 'done' && booking.status !== 'hoan_thanh'
          ? 'da_tra_file'
          : booking.status;

      const leadPhoto = crewMembers.find(m => m.role === 'lead_photographer');
      const makeupArtist = crewMembers.find(m => m.role === 'makeup_artist');
      const finalPhotoId = assignedPhotographerId || leadPhoto?.user_id || null;
      const finalMakeupId = assignedMakeupId || makeupArtist?.user_id || null;

      if (isSupabaseConfigured) {
        const updatePayload: any = {
          assigned_gears: selectedGearIds,
          expenses: combinedTotalCost,
          expense_details: expenseItems,
          crew_assignments: crewMembers,
          proofing_session: proofingSession,
          photographer_id: finalPhotoId,
          makeup_artist_id: finalMakeupId,
          category: canonicalCategory,
          session_type: canonicalCategory,
          package_type: packageType.trim() || null,
          drive_delivery_link: deliveryLink.trim() || null,
          delivery_notes: deliveryNotes.trim() || null,
          delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        };

        let { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', booking.id);

        if (error && (error.message.includes('crew_assignments') || error.message.includes('proofing_session'))) {
          console.warn('Cột mới chưa có trên DB, cập nhật bỏ qua cột này:', error.message);
          delete updatePayload.crew_assignments;
          delete updatePayload.proofing_session;
          const retry = await supabase.from('bookings').update(updatePayload).eq('id', booking.id);
          error = retry.error;
        }

        if (error) {
          console.warn('Lỗi lưu chi tiết booking, thử lại phương án dự phòng:', error);
          const { error: fallbackErr } = await supabase
            .from('bookings')
            .update({
              assigned_gears: selectedGearIds,
              expenses: combinedTotalCost,
              expense_details: expenseItems,
              photographer_id: finalPhotoId,
              makeup_artist_id: finalMakeupId,
              session_type: canonicalCategory,
              drive_delivery_link: deliveryLink.trim() || null,
              delivery_notes: deliveryNotes.trim() || null,
              delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : null,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id);
          if (fallbackErr) throw fallbackErr;
        }
      }

      const assignedPhotoMember = studioMembers.find(
        m => m.user_id === finalPhotoId || m.id === finalPhotoId
      );
      const assignedMuaMember = studioMembers.find(
        m => m.user_id === finalMakeupId || m.id === finalMakeupId
      );

      const updatedPhotoInfo: StaffInfo | null = assignedPhotoMember?.user
        ? {
            id: assignedPhotoMember.user_id,
            full_name: assignedPhotoMember.user.full_name,
            avatar_url: assignedPhotoMember.user.avatar_url,
            phone: assignedPhotoMember.user.phone,
            email: assignedPhotoMember.user.email,
            is_verified: assignedPhotoMember.user.is_verified || assignedPhotoMember.is_verified || false,
            facebook_url: assignedPhotoMember.user.facebook_url || assignedPhotoMember.facebook_url || null,
          }
        : finalPhotoId
        ? booking.photographer || null
        : null;

      const updatedMuaInfo: StaffInfo | null = assignedMuaMember?.user
        ? {
            id: assignedMuaMember.user_id,
            full_name: assignedMuaMember.user.full_name,
            avatar_url: assignedMuaMember.user.avatar_url,
            phone: assignedMuaMember.user.phone,
            email: assignedMuaMember.user.email,
            is_verified: assignedMuaMember.user.is_verified || assignedMuaMember.is_verified || false,
            facebook_url: assignedMuaMember.user.facebook_url || assignedMuaMember.facebook_url || null,
          }
        : finalMakeupId
        ? booking.makeup_artist || null
        : null;

      const updated: CalendarEvent = {
        ...booking,
        category: canonicalCategory,
        sessionType: canonicalCategory as any,
        package_type: packageType.trim() || undefined,
        assignedGears: selectedGearIds,
        expenses: combinedTotalCost,
        expenseDetails: expenseItems,
        crew_assignments: crewMembers,
        proofing_session: proofingSession,
        photographer_id: finalPhotoId || undefined,
        makeup_artist_id: finalMakeupId || undefined,
        photographer: updatedPhotoInfo,
        makeup_artist: updatedMuaInfo,
        drive_delivery_link: deliveryLink.trim() || undefined,
        delivery_notes: deliveryNotes.trim() || undefined,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        status: nextStatus,
      };

      if (onBookingUpdated) {
        onBookingUpdated(updated);
      }

      setToastMessage({
        type: 'success',
        text:
          activeConflicts.length > 0
            ? 'Đã ghi đè thiết bị và lưu thông tin show thành công!'
            : 'Đã lưu thiết bị, hạch toán, nhân sự & thông tin bàn giao ảnh thành công!',
      });
    } catch (err: any) {
      console.error('Lỗi khi lưu booking:', err);
      setToastMessage({
        type: 'error',
        text: `Lỗi: ${err.message || 'Không thể lưu'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remainingDebt = Math.max(
    0,
    booking.packagePrice - (booking.paidAmount || booking.depositAmount)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md flex-shrink-0 flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Chi Tiết Lịch Chụp
              </span>
              {(() => {
                const catConfig = getCategoryConfig(selectedCategory);
                return (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-sm ${catConfig.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${catConfig.dotColor}`} />
                    <span>{catConfig.label}</span>
                  </span>
                );
              })()}
              {packageType && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  <span>{packageType}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {booking.clientName}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>{booking.eventDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{booking.startTime} - {booking.endTime}</span>
              </span>
              <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={booking.location}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{booking.location}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <a
                href={generateGoogleCalendarUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[11px] font-semibold transition-all shadow-xs"
                title="Mở Google Calendar và tự động điền lịch chụp"
              >
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Google Calendar</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>

              <button
                type="button"
                onClick={() => downloadIcsFile(booking)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
                title="Tải file .ics để đồng bộ Apple Calendar, Outlook"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>Xuất file .ics</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
            title="Đóng bảng chi tiết"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {toastMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fadeIn ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Financial Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 block text-[10px]">Tổng Gói (Hợp Đồng)</span>
                {onEditFinancials && (
                  <button
                    type="button"
                    onClick={() => onEditFinancials(booking)}
                    className="text-gray-500 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10 cursor-pointer"
                    title="Cập nhật tài chính"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="font-mono font-bold text-white text-xs sm:text-sm">
                {booking.packagePrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Khách Đã Trả (Doanh Thu)</span>
              <span className="font-mono font-bold text-sky-400 text-xs sm:text-sm">
                {effectivePaid.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tổng Chi Phí & Thù Lao</span>
              <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
                {combinedTotalCost.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[9px] text-slate-500 block">
                Thù lao: {totalCrewCost.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Lợi Nhuận Ròng Dự Kiến</span>
              <span className={`font-mono font-black text-xs sm:text-sm ${projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {projectedNetProfit.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[9px] text-emerald-400/80 block">
                Biên LN: {profitMargin}%
              </span>
            </div>
          </div>

          {crewMembers.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-300">
                  Ê-kíp show ({crewMembers.length} người):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {crewMembers.map((m, i) => {
                    const conf = CREW_ROLE_CONFIG[m.role] || CREW_ROLE_CONFIG.other;
                    return (
                      <span
                        key={m.id || i}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${conf.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dotColor}`} />
                        <span>{m.name}</span>
                        {m.is_paid && <span className="text-[9px] text-emerald-400">✓</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('crew')}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
              >
                Quản lý thù lao →
              </button>
            </div>
          )}

          {/* LOẠI HÌNH CHỤP & GÓI DỊCH VỤ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Loại Hình Chụp & Gói Dịch Vụ
                </h4>
              </div>
              {(() => {
                const currentCat = getCategoryConfig(selectedCategory);
                return (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${currentCat.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentCat.dotColor}`} />
                    <span>{currentCat.label}</span>
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-400 block">
                  Loại Hình Chụp *
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 outline-none focus:border-amber-400 cursor-pointer"
                >
                  {STANDARD_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-indigo-400 block">
                  Tên Gói Chụp Cụ Thể
                </label>
                <input
                  type="text"
                  value={packageType}
                  onChange={e => setPackageType(e.target.value)}
                  placeholder="VD: Gói VIP Diamond, Ngoại cảnh Đà Lạt, Lookbook 5 set..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'crew'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Phân Công Ê-Kíp & Thù Lao</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'crew' ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'}`}>
                {crewMembers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Hạch Toán Chi Phí</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'expenses' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                {expenseItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gears')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'gears'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Phân Bổ Thiết Bị</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'gears' ? 'bg-slate-950 text-sky-400' : 'bg-slate-900 text-slate-400'}`}>
                {selectedGearIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delivery')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'delivery'
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Chọn Ảnh & Bàn Giao</span>
              {proofingSession.is_locked ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-400 text-slate-950 font-bold" title="Khách đã chốt chọn ảnh">
                  ✓ {proofingSession.items?.length || 0}
                </span>
              ) : deliveryLink ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đã có link bàn giao" />
              ) : null}
            </button>
          </div>

          {/* ==================================================================== */}
          {/* TAB 1: PHÂN CÔNG Ê-KÍP & THÙ LAO                                     */}
          {/* ==================================================================== */}
          {activeTab === 'crew' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Cảnh báo trùng lịch Nhân sự */}
              {activeStaffConflicts.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/60 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Cảnh báo lịch trình Nhân sự trong ngày {booking.eventDate}:</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeStaffConflicts.map((sc, i) => (
                      <div key={i} className="text-xs text-amber-100 bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/30">
                        <strong className="text-amber-300">{sc.staffName}</strong> ({sc.roleLabel}){' '}
                        {sc.severity === 'hard' ? (
                          <span className="text-rose-400 font-bold">đang bị trùng khung giờ</span>
                        ) : (
                          <span className="text-amber-300">có ca chụp khác trong ngày</span>
                        )}{' '}
                        với khách <strong className="text-white">"{sc.conflictingClientName}"</strong> ({sc.timeRange}).
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-center">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Tổng Thù Lao Ê-Kíp</span>
                  <strong className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                    {totalCrewCost.toLocaleString('vi-VN')} đ
                  </strong>
                  <span className="text-[9px] text-slate-500 block">({crewMembers.length} nhân sự)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-center">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Đã Thanh Toán</span>
                  <strong className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                    {paidCrewCost.toLocaleString('vi-VN')} đ
                  </strong>
                  <span className="text-[9px] text-emerald-500/70 block">({crewMembers.filter(m => m.is_paid).length} đã chi)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 text-center">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">Cần Chi / Còn Nợ</span>
                  <strong className="text-sm sm:text-base font-extrabold text-rose-400 font-mono">
                    {unpaidCrewCost.toLocaleString('vi-VN')} đ
                  </strong>
                  <span className="text-[9px] text-rose-500/70 block">({crewMembers.filter(m => !m.is_paid).length} cần chuyển khoản)</span>
                </div>
              </div>

              {/* Phân Công Nhân Sự Cho Show */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#df8653]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Phân Công Nhân Sự Cho Show
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Chỉ định Thợ Chụp chính và Thợ Makeup (MUA)</span>
                </div>

                {booking.makeup_artist && (
                  <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between text-xs text-pink-300">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-400" />
                      <span>
                        <strong>Thợ Makeup (MUA):</strong> {booking.makeup_artist.full_name}
                        {booking.makeup_artist.phone && ` • SĐT: ${booking.makeup_artist.phone}`}
                      </span>
                    </div>
                    <span className="text-[10px] bg-pink-500/20 text-pink-200 px-2 py-0.5 rounded-full font-bold">
                      Đã chỉ định
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Chọn Thợ Chụp:
                    </label>
                    <select
                      value={assignedPhotographerId}
                      onChange={e => handleSelectPhotographerDropdown(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                    >
                      <option value="">-- Chọn Thợ Chụp từ danh sách --</option>
                      {studioMembers
                        .filter(m => m.role === 'admin' || m.role === 'photographer')
                        .map(m => {
                          const staffUid = m.user_id || m.id;
                          return (
                            <option key={staffUid} value={staffUid}>
                              {m.user?.full_name || 'Thợ chụp'} ({m.role}){getStaffBusyNote(staffUid)}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Chọn Thợ Makeup:
                    </label>
                    <select
                      value={assignedMakeupId}
                      onChange={e => handleSelectMakeupDropdown(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                    >
                      <option value="">-- Chọn Thợ Makeup từ danh sách --</option>
                      {studioMembers
                        .filter(m => m.role === 'makeup_artist')
                        .map(m => {
                          const staffUid = m.user_id || m.id;
                          return (
                            <option key={staffUid} value={staffUid}>
                              {m.user?.full_name || 'Thợ Makeup'}{getStaffBusyNote(staffUid)}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Thêm Nhân Sự Vào Ê-Kíp */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Thêm Nhân Sự Vào Ê-Kíp Show
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Chọn thành viên Studio hoặc nhập CTV tự do</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Vai trò / Nhiệm vụ *</label>
                    <select
                      value={newCrewRole}
                      onChange={e => setNewCrewRole(e.target.value as CrewRole)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                    >
                      {Object.entries(CREW_ROLE_CONFIG).map(([roleKey, conf]) => (
                        <option key={roleKey} value={roleKey}>
                          {conf.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Nhân sự (Studio hoặc CTV) *</label>
                    <div className="space-y-1.5">
                      {studioMembers.length > 0 && (
                        <select
                          value={newCrewMemberUserId}
                          onChange={e => {
                            const val = e.target.value;
                            setNewCrewMemberUserId(val);
                            if (val) {
                              const found = studioMembers.find(m => m.user_id === val || m.id === val);
                              if (found) {
                                setNewCrewName(found.user?.full_name || '');
                                setNewCrewPhone(found.user?.phone || '');
                              }
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                        >
                          <option value="">-- Chọn thành viên Studio --</option>
                          {studioMembers.map(m => (
                            <option key={m.user_id || m.id} value={m.user_id || m.id}>
                              {m.user?.full_name || 'Thành viên'} ({m.role})
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        value={newCrewName}
                        onChange={e => setNewCrewName(e.target.value)}
                        placeholder="Hoặc nhập tên Freelancer / CTV..."
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Thù lao / Chi phí</label>
                    <div className="flex gap-1.5">
                      <select
                        value={newCrewFeeType}
                        onChange={e => setNewCrewFeeType(e.target.value as 'fixed' | 'percent')}
                        className="w-20 px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                      >
                        <option value="fixed">VNĐ</option>
                        <option value="percent">% Gói</option>
                      </select>
                      <input
                        type={newCrewFeeType === 'percent' ? 'number' : 'text'}
                        inputMode="numeric"
                        min="0"
                        value={newCrewFeeType === 'percent' ? newCrewFee : (newCrewFee ? formatCurrencyVND(newCrewFee) : '')}
                        onChange={e => setNewCrewFee(newCrewFeeType === 'percent' ? e.target.value : parseCurrencyVND(e.target.value).toString())}
                        placeholder={newCrewFeeType === 'percent' ? 'VD: 30' : 'VD: 500.000'}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddCrewMember}
                      disabled={!newCrewName.trim()}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Danh Sách Nhân Sự Đã Phân Công */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold text-slate-300">
                    Danh sách nhân sự show ({crewMembers.length})
                  </span>
                  <span className="font-mono text-amber-400">
                    Tổng thù lao: <strong>{totalCrewCost.toLocaleString('vi-VN')} đ</strong>
                  </span>
                </div>

                {crewMembers.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl bg-slate-950/40 border border-slate-800 border-dashed space-y-2">
                    <Users className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Chưa có nhân sự nào được phân công cho show này</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {crewMembers.map((member, idx) => {
                      const roleConfig = CREW_ROLE_CONFIG[member.role] || CREW_ROLE_CONFIG.other;
                      const calculatedFee =
                        member.fee_type === 'percent'
                          ? Math.round((booking.packagePrice * Number(member.fee || 0)) / 100)
                          : Number(member.fee || 0);

                      return (
                        <div
                          key={member.id || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${roleConfig.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotColor}`} />
                              <span>{roleConfig.label}</span>
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{member.name}</span>
                                {member.phone && (
                                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5 text-slate-500" />
                                    {member.phone}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Mức thù lao:</span>
                                <span className="font-mono font-semibold text-amber-300">
                                  {member.fee_type === 'percent'
                                    ? `${member.fee}% gói chụp (= ${calculatedFee.toLocaleString('vi-VN')} đ)`
                                    : `${Number(member.fee || 0).toLocaleString('vi-VN')} đ`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleToggleCrewPaid(member.id)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                member.is_paid
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              <CheckCircle2 className={`w-3 h-3 ${member.is_paid ? 'text-emerald-400' : 'text-slate-500'}`} />
                              <span>{member.is_paid ? 'Đã thanh toán' : 'Chưa trả'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyVietQrTransfer(member)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                              title="Sao chép cú pháp chuyển khoản nhanh"
                            >
                              <QrCode className="w-3.5 h-3.5 text-sky-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveCrewMember(member.id)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                              title="Gỡ nhân sự"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 2: PHÂN BỔ THIẾT BỊ                                              */}
          {/* ==================================================================== */}
          {activeTab === 'gears' && (
            <div className="space-y-4 animate-fadeIn">
              {activeConflicts.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl space-y-3.5 animate-scaleUp ring-2 ring-rose-500/20">
                  <div className="flex items-center justify-between gap-2 border-b border-rose-900/80 pb-2">
                    <div className="flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                      <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 animate-bounce" />
                      <span>CẢNH BÁO: XUNG ĐỘT THIẾT BỊ CÙNG NGÀY ({booking.eventDate})!</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900 text-rose-200 border border-rose-500/50">
                      {activeConflicts.length} trùng lặp
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeConflicts.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/85 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5 shadow-md"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 leading-relaxed">
                          <span className="font-extrabold text-white">Cảnh báo: </span>
                          <strong className="text-amber-300 underline font-bold">{c.gearName}</strong> đã được xếp lịch cho một khách khác (
                          <strong className="text-white">"{c.conflictingClientName}"</strong> - {c.conflictingSessionType} lúc {c.timeRange}) vào ngày này.
                          {c.severity === 'soft' && (
                            <span className="block text-[11px] text-amber-300 mt-0.5">
                              Khác khung giờ chụp (cách nhau {c.gapMinutes} phút) — Lưu ý sạc pin & chuẩn bị thẻ nhớ dự phòng nếu dùng chung.
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isOverrideConfirmed
                        ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 shadow-inner'
                        : 'bg-rose-950/80 border-rose-500/70 text-rose-200'
                    } flex items-start gap-3`}
                  >
                    <input
                      type="checkbox"
                      id="override-conflict-checkbox"
                      checked={isOverrideConfirmed}
                      onChange={e => setIsOverrideConfirmed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-rose-500 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <label
                      htmlFor="override-conflict-checkbox"
                      className="text-xs cursor-pointer select-none font-semibold leading-relaxed"
                    >
                      <span>
                        <strong>Xác nhận ghi đè:</strong> Tôi đồng ý sử dụng thiết bị này dù có xung đột lịch trình (Studio đã có phương án máy dự phòng hoặc thuê ngoài).
                      </span>
                      {!isOverrideConfirmed && (
                        <span className="block text-[11px] text-rose-400 font-bold mt-0.5">
                          * Bắt buộc tích chọn để mở khóa nút "Lưu Thiết Bị".
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Section: Phân Bổ Thiết Bị */}
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      Phân Bổ Thiết Bị Cho Show
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Đã phân bổ: <strong className="text-amber-400">{selectedGearIds.length}</strong> thiết bị
                  </span>
                </div>

                {selectedGearIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Đang chọn:</span>
                    {selectedGearIds.map(id => {
                      const g = gears.find(item => item.id === id);
                      const isClashed = activeConflicts.some(c => c.gearId === id);
                      return (
                        <span
                          key={id}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                            isClashed
                              ? 'bg-rose-950/80 text-rose-200 border-rose-500/70 shadow-sm'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isClashed && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          <span>{g?.name || id}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleGear(id)}
                            className="hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                            title="Gỡ thiết bị"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={gearSearch}
                      onChange={e => setGearSearch(e.target.value)}
                      placeholder="Tìm máy, lens, đèn..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-amber-400 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'camera', label: 'Máy ảnh' },
                      { id: 'lens', label: 'Ống kính' },
                      { id: 'lighting', label: 'Đèn & Ánh sáng' },
                      { id: 'accessory', label: 'Phụ kiện' },
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setGearCategory(c.id)}
                        className={`px-2 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                          gearCategory === c.id
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingGears ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-xs text-slate-400">Đang tải kho thiết bị...</span>
                  </div>
                ) : gears.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
                    <Info className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Kho thiết bị đang trống. Vui lòng thêm thiết bị trong mục Thiết Bị.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {gears
                      .filter(gear => {
                        const matchCategory = gearCategory === 'all' || gear.type === gearCategory;
                        const matchSearch = gear.name.toLowerCase().includes(gearSearch.toLowerCase());
                        return matchCategory && matchSearch;
                      })
                      .map(gear => {
                        const isSelected = selectedGearIds.includes(gear.id);
                        const conflict = getSingleGearConflict(gear.id);

                        return (
                          <button
                            key={gear.id}
                            type="button"
                            onClick={() => handleToggleGear(gear.id)}
                            className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                              isSelected
                                ? conflict
                                  ? 'bg-rose-950/50 border-rose-500 shadow-md ring-1 ring-rose-500/40'
                                  : 'bg-amber-500/10 border-amber-500/70 shadow-md'
                                : conflict
                                ? 'bg-slate-950/50 border-rose-900/80 hover:border-rose-500/50 opacity-80'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                isSelected
                                  ? conflict
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500 text-slate-950 font-bold'
                                  : 'border border-slate-700 bg-slate-900'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-white truncate">
                                  {gear.name}
                                </span>
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                                  {gear.type}
                                </span>
                              </div>

                              {conflict && (
                                <div className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                  <span className="truncate">
                                    Đã xếp lịch cho "{conflict.conflictingClientName}" ({conflict.timeRange})
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: HẠCH TOÁN CHI PHÍ - JOB COSTING                              */}
          {/* ==================================================================== */}
          {activeTab === 'expenses' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Hạch Toán Hiệu Quả Show (Job Costing)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Lợi nhuận ròng = [Số tiền khách trả] - [Tổng chi phí]
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
                    <span className="text-slate-400">Tỷ suất lợi nhuận:</span>
                    <strong className={netProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {effectivePaid > 0 ? ((netProfit / effectivePaid) * 100).toFixed(1) : 0}%
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/20 text-center">
                    <span className="text-[10px] text-slate-400 font-medium block">Số tiền khách trả</span>
                    <strong className="text-sm font-bold text-blue-400 font-mono">
                      {effectivePaid.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/20 text-center relative">
                    <div className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                      -
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Tổng chi phí & Thù lao ({expenseItems.length} khoản + Ê-kíp)
                    </span>
                    <strong className="text-sm font-bold text-rose-400 font-mono">
                      {combinedTotalCost.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div className={`p-2.5 rounded-xl border text-center relative ${
                    netProfit >= 0
                      ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-500/10'
                  }`}>
                    <div className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                      =
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">Lợi Nhuận Ròng (Net Profit)</span>
                    <strong className={`text-sm sm:text-base font-extrabold font-mono ${
                      netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {netProfit.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                </div>
              </div>

              {/* Form Thêm Khoản Chi Mới */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Thêm Khoản Chi Phí Cho Show</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">Mẫu chọn nhanh bên dưới</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {EXPENSE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setNewExpenseName(preset.name);
                        setNewExpenseAmount(preset.amount.toString());
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        newExpenseName === preset.name
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      + {preset.name} ({preset.amount.toLocaleString('vi-VN')} đ)
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <input
                    type="text"
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
                    placeholder="Tên khoản chi (VD: Makeup artist, Thuê Studio...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExpense();
                      }
                    }}
                  />
                  <div className="relative sm:w-44">
                    <input
                      type="text"
                      inputMode="numeric"
                      step="any"
                      value={newExpenseAmount ? formatCurrencyVND(newExpenseAmount) : ''}
                      onChange={(e) => setNewExpenseAmount(parseCurrencyVND(e.target.value).toString())}
                      placeholder="Số tiền (VNĐ)"
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddExpense();
                        }
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                      đ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddExpense()}
                    disabled={!newExpenseName.trim() || !newExpenseAmount}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Khoản Chi</span>
                  </button>
                </div>
              </div>

              {/* Danh Sách Các Khoản Chi Đã Thêm */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold text-slate-300">
                    Chi tiết các khoản chi phát sinh ({expenseItems.length})
                  </span>
                  <span className="font-mono text-rose-400">
                    Chi phí lẻ: <strong>{totalExpenses.toLocaleString('vi-VN')} đ</strong>
                  </span>
                </div>

                {expenseItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800/80 space-y-2">
                    <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Chưa có khoản chi phí phát sinh nào cho show này.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {expenseItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-rose-400 font-mono">
                            -{Number(item.amount).toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpense(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                            title="Xóa khoản chi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 4: CHỌN ẢNH RETOUCH & BÀN GIAO FILE                              */}
          {/* ==================================================================== */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 border border-purple-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Cổng Chọn Ảnh Retouch (Client Proofing Portal)
                    </h4>
                  </div>
                  {proofingSession.is_locked ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Khách đã khóa chốt ({proofingSession.items?.length || 0} ảnh)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      <Unlock className="w-3 h-3 text-amber-400" />
                      <span>Đang mở chọn ảnh</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span>Link Kho Ảnh Gốc Cho Khách Xem Trước (Drive Preview Link):</span>
                      </span>
                      {proofingSession.drive_preview_link && (
                        <a
                          href={proofingSession.drive_preview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 text-[10px] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Mở thử link</span>
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      value={proofingSession.drive_preview_link || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setProofingSession(prev => ({
                          ...prev,
                          drive_preview_link: val,
                        }));
                      }}
                      placeholder="https://drive.google.com/drive/folders/... (Folder ảnh gốc để khách xem & chọn)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-purple-300 placeholder-slate-600 outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Số ảnh retouch của gói:</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={proofingSession.max_selections || 20}
                      onChange={e => {
                        const val = Number(e.target.value) || 20;
                        setProofingSession(prev => ({
                          ...prev,
                          max_selections: val,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
                </div>

                {/* VISUAL PROOFING GALLERY MANAGER */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">
                        Kho Ảnh Preview Cho Khách Chọn
                      </span>
                      {galleryPreviewItems.length > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {galleryPreviewItems.length} ảnh trong Gallery
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Chưa có ảnh preview)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                        isUploadingPreviews
                          ? 'bg-purple-950/50 text-purple-400 border border-purple-500/30 opacity-70 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 hover:scale-[1.02]'
                      }`}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingPreviews ? 'Đang nén ảnh...' : '+ Tải Ảnh Preview Lên Gallery'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isUploadingPreviews}
                          onChange={handleUploadPreviewFiles}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleLoadDemoGallery}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Nạp 12 ảnh chân dung mẫu đẹp vào Visual Gallery"
                      >
                        <span>Nạp 12 Ảnh Mẫu Demo</span>
                      </button>

                      {galleryPreviewItems.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllGallery}
                          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/80 text-xs transition-colors cursor-pointer"
                          title="Xóa toàn bộ ảnh preview trong Gallery"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isUploadingPreviews && uploadProgress && (
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          <span>Đang tự động nén tối ưu hiển thị...</span>
                        </span>
                        <span className="font-mono text-purple-200 font-bold">
                          {uploadProgress.current} / {uploadProgress.total} ảnh ({Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-200 rounded-full"
                          style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {galleryPreviewItems.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Ảnh xem trước trong kho ({galleryPreviewItems.length} tấm):</span>
                        <span className="text-[10px] text-purple-300">
                          Khách mở link Portal sẽ thấy lưới ảnh này để chọn ảnh
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                        {galleryPreviewItems.map(item => {
                          const isSelectedByClient = item.is_selected === true;
                          return (
                            <div
                              key={item.id}
                              className={`group relative rounded-xl overflow-hidden border transition-all ${
                                isSelectedByClient
                                  ? 'border-rose-500 shadow-md shadow-rose-500/20 ring-1 ring-rose-500'
                                  : 'border-slate-800 hover:border-slate-700 bg-slate-900'
                              }`}
                            >
                              <div className="aspect-square bg-slate-950 overflow-hidden relative">
                                <img
                                  src={item.preview_url || item.thumbnail_url}
                                  alt={item.filename}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />

                                {isSelectedByClient && (
                                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-rose-600/90 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                                    <Heart className="w-2.5 h-2.5 fill-current" />
                                    <span>Đã chọn</span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryItem(item.filename)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title={`Xóa ảnh ${item.filename}`}
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              <div className="p-1.5 bg-slate-900/95 truncate">
                                <p className="text-[10px] font-mono text-slate-300 truncate" title={item.filename}>
                                  {item.filename}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {clientSelectedItems.length > 0 ? (
                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          Danh sách ảnh khách đã chọn ({clientSelectedItems.length} / {proofingSession.max_selections || 20} ảnh):
                        </span>
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyLightroomQuery}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Sao chép danh sách file để dán vào Lightroom Library Text Search"
                        >
                          {copiedLightroomQuery ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Đã chép mã file!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-purple-400" />
                              <span>Copy mã file cho Lightroom</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendRetoucherZalo}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Copy cú pháp thông báo để gửi Retoucher"
                        >
                          <Send className="w-3.5 h-3.5 text-sky-400" />
                          <span>Gửi Zalo Retoucher</span>
                        </button>

                        {proofingSession.is_locked && (
                          <button
                            type="button"
                            onClick={handleUnlockProofing}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Mở khóa để khách có thể chọn lại"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Mở khóa chọn lại</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {clientSelectedItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-start gap-2.5"
                        >
                          {item.preview_url ? (
                            <img
                              src={item.preview_url}
                              alt={item.filename}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-950 flex-shrink-0 border border-slate-700"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center justify-center font-mono flex-shrink-0">
                              {idx + 1}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <strong className="font-mono text-white text-xs truncate">{item.filename}</strong>
                              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 flex-shrink-0" />
                            </div>
                            {item.notes ? (
                              <p className="text-[11px] text-amber-300/90 mt-0.5 line-clamp-2 italic">
                                "{item.notes}"
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-500 mt-0.5">Retouch chuẩn gói</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-1">
                    <p className="text-xs text-slate-400">
                      {galleryPreviewItems.length > 0
                        ? `Đã nạp ${galleryPreviewItems.length} ảnh preview lên Gallery. Khách đang xem và chọn ảnh.`
                        : 'Khách hàng chưa chọn mã ảnh nào.'}
                    </p>
                  </div>
                )}
              </div>

              {/* KHỐI BÀN GIAO FILE HOÀN TẤT */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Bàn Giao File Ảnh Hoàn Tất & Link Tải Trực Tuyến
                    </h4>
                  </div>
                  {deliveryLink ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã có link tải</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Chưa có link tải
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Link Tải Ảnh (Google Drive / Pixieset / Dropbox):</span>
                    </span>
                    {deliveryLink && (
                      <a
                        href={deliveryLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở thử link</span>
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={deliveryLink}
                      onChange={e => setDeliveryLink(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... hoặc https://pixieset.com/..."
                      className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 placeholder-slate-600 outline-none focus:border-amber-400"
                    />
                    {deliveryLink && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {deliveryLink.includes('drive.google.com')
                            ? 'Drive'
                            : deliveryLink.includes('pixieset.com')
                            ? 'Pixieset'
                            : deliveryLink.includes('dropbox.com')
                            ? 'Dropbox'
                            : 'Cloud'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ghi Chú Bàn Giao & Mật Khẩu (Nếu có):</span>
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="VD: Mật khẩu giải nén: 1234. Bộ ảnh được lưu trữ an toàn trong 1 năm..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-purple-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ngày Bàn Giao:</span>
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 outline-none focus:border-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={markAsDelivered}
                        onChange={e => setMarkAsDelivered(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                      />
                      <span className="text-xs text-slate-200 font-semibold">
                        Cập nhật trạng thái sang <strong className="text-emerald-400">Đã trả file</strong> khi lưu
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Quick Share Portal & Zalo */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>Gửi Cổng Khách Hàng (Client Portal)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Token: {booking.quoteToken}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const portalUrl = `${window.location.origin}/quote/${booking.quoteToken}`;
                      navigator.clipboard.writeText(portalUrl);
                      setCopiedPortalLink(true);
                      setTimeout(() => setCopiedPortalLink(false), 2500);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedPortalLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã chép link Portal!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sao Chép Link Portal</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`/quote/${booking.quoteToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Xem Thử Portal</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const portalUrl = `${window.location.origin}/quote/${booking.quoteToken}`;
                      const msg = generatePhotoDeliveryMessage({
                        clientName: booking.clientName,
                        sessionType: booking.category || booking.sessionType,
                        portalUrl: portalUrl,
                        deliveryNotes: deliveryNotes,
                        remainingAmount: booking.remainingAmount,
                        studioName: currentStudio?.name || 'MIRMIA STUDIO & ACADEMY',
                      });
                      openZaloChat(booking.clientPhone, msg);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.01]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Zalo Bàn Giao 1-Chạm</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div>
            {remainingDebt > 0 && onOpenDebtReminder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDebtReminder(booking);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Mở Trợ Lý Nhắc Nợ ({remainingDebt.toLocaleString('vi-VN')} đ)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>

            {activeConflicts.length > 0 && !isOverrideConfirmed ? (
              <button
                type="button"
                onClick={handleSaveAssignedGears}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/70 text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-900 transition-all shadow-md cursor-pointer"
                title="Bị chặn do xung đột thiết bị - Cần tích chọn Xác nhận ghi đè"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Chặn Lưu Xung Đột (Cần Xác Nhận)</span>
              </button>
            ) : activeConflicts.length > 0 && isOverrideConfirmed ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAssignedGears}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Xác Nhận Ghi Đè & Lưu Phân Bổ</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAssignedGears}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Phân Bổ & Chi Phí</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
