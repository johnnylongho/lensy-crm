import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Studio, StudioMember, AccountType } from '../../types';
import {
  Settings,
  Building2,
  User,
  CreditCard,
  AtSign,
  Phone,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Sparkles,
  Search,
  Upload,
  Clock,
  XCircle,
  LogOut,
} from 'lucide-react';

// Danh sách gợi ý các ngân hàng phổ biến tại Việt Nam
const POPULAR_BANKS = [
  'MB Bank (Quân Đội)',
  'Vietcombank',
  'Techcombank',
  'ACB (Á Châu)',
  'TPBank (Tiên Phong)',
  'VPBank (Việt Nam Thịnh Vượng)',
  'BIDV',
  'VietinBank',
  'Sacombank',
  'VIB (Quốc Tế)',
  'HDBank',
  'MSB (Hàng Hải)',
  'OCB (Phương Đông)',
  'SeABank',
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Form State
  const [accountType, setAccountType] = useState<AccountType>('freelancer');
  const [studioName, setStudioName] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bankName, setBankName] = useState('MB Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // Studio Membership & Search State
  const [currentMembership, setCurrentMembership] = useState<StudioMember | null>(null);
  const [studioSearchQuery, setStudioSearchQuery] = useState('');
  const [studioSearchResults, setStudioSearchResults] = useState<Studio[]>([]);
  const [selectedStudioToJoin, setSelectedStudioToJoin] = useState<Studio | null>(null);
  const [isSearchingStudios, setIsSearchingStudios] = useState(false);
  const [isJoiningStudio, setIsJoiningStudio] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 1. Fetch dữ liệu profile người dùng & tư cách thành viên studio
  const fetchUserProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Fetch user info
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Lỗi khi fetch profile:', error);
          setToast({
            type: 'error',
            message: 'Không thể tải thông tin cài đặt: ' + error.message,
          });
        } else if (data) {
          setAccountType(data.account_type || 'freelancer');
          setStudioName(data.studio_name || '');
          setUsername(data.username || '');
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setAvatarUrl(data.avatar_url || '');
          setBankName(data.bank_name || 'MB Bank');
          setBankAccountNumber(data.bank_account_number || '');
          setBankAccountName(data.bank_account_name || '');

          // Tra cứu thông tin membership nếu có
          const { data: memberData } = await supabase
            .from('studio_members')
            .select(`
              id,
              studio_id,
              user_id,
              role,
              status,
              created_at,
              updated_at,
              studios:studio_id (
                id,
                name,
                logo_url,
                verified_status,
                owner_id
              )
            `)
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            setCurrentMembership({
              id: memberData.id,
              studio_id: memberData.studio_id,
              user_id: memberData.user_id,
              role: memberData.role,
              status: memberData.status,
              created_at: memberData.created_at,
              updated_at: memberData.updated_at,
              studio: (memberData as any).studios,
            });
          } else {
            setCurrentMembership(null);
          }
        }
      } else {
        // Demo fallback
        setAccountType('freelancer');
        setStudioName('MIRMIA STUDIO & ACADEMY');
        setUsername('johnnylongho');
        setFullName('Johnny Long Hồ');
        setPhone('0901234567');
        setAvatarUrl('/mirmia-logo.png');
        setBankName('MB Bank');
        setBankAccountNumber('0901234567');
        setBankAccountName('JOHNNY LONG HO');
      }
    } catch (err: any) {
      console.error('Lỗi ngoại lệ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // 2. Tìm kiếm Studio (Autocomplete)
  const handleSearchStudios = async (query: string) => {
    setStudioSearchQuery(query);
    if (!query.trim()) {
      setStudioSearchResults([]);
      return;
    }

    setIsSearchingStudios(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('studios')
          .select('*')
          .ilike('name', `%${query.trim()}%`)
          .limit(6);

        if (!error && data) {
          setStudioSearchResults(data);
        }
      } else {
        setStudioSearchResults([
          {
            id: 'mock-s1',
            name: 'MIRMIA STUDIO & ACADEMY',
            logo_url: '/mirmia-logo.png',
            verified_status: true,
            owner_id: 'mock-owner',
          },
          {
            id: 'mock-s2',
            name: 'The Muse Wedding & Concept',
            logo_url: null,
            verified_status: false,
            owner_id: 'mock-owner-2',
          },
          {
            id: 'mock-s3',
            name: 'Lumière Art Studio',
            logo_url: null,
            verified_status: true,
            owner_id: 'mock-owner-3',
          },
        ]);
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm Studio:', err);
    } finally {
      setIsSearchingStudios(false);
    }
  };

  // 3. Gửi yêu cầu gia nhập Studio (status = 'pending')
  const handleSendJoinRequest = async () => {
    if (!user || !selectedStudioToJoin) return;
    setIsJoiningStudio(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('studio_members')
          .insert({
            studio_id: selectedStudioToJoin.id,
            user_id: user.id,
            role: 'photographer',
            status: 'pending',
          })
          .select(`
            id,
            studio_id,
            user_id,
            role,
            status,
            created_at,
            studios:studio_id (
              id,
              name,
              logo_url,
              verified_status
            )
          `)
          .single();

        if (error) throw error;

        // Cập nhật account_type của user thành studio_member
        await supabase
          .from('users')
          .update({ account_type: 'studio_member' })
          .eq('id', user.id);

        setCurrentMembership({
          id: data.id,
          studio_id: data.studio_id,
          user_id: data.user_id,
          role: data.role,
          status: data.status,
          created_at: data.created_at,
          studio: (data as any).studios,
        });

        setSelectedStudioToJoin(null);
        setStudioSearchQuery('');
        setToast({
          type: 'success',
          message: `🎉 Đã gửi yêu cầu gia nhập "${selectedStudioToJoin.name}". Vui lòng chờ Studio phê duyệt!`,
        });
      } else {
        await new Promise(r => setTimeout(r, 400));
        setCurrentMembership({
          id: 'mock-pending-id',
          studio_id: selectedStudioToJoin.id,
          user_id: user.id,
          role: 'photographer',
          status: 'pending',
          studio: selectedStudioToJoin,
        });
        setSelectedStudioToJoin(null);
        setToast({
          type: 'success',
          message: `🎉 [Demo] Đã gửi yêu cầu gia nhập Studio thành công!`,
        });
      }
    } catch (err: any) {
      console.error('Lỗi gửi yêu cầu gia nhập:', err);
      setToast({
        type: 'error',
        message: 'Lỗi gửi yêu cầu: ' + (err.message || 'Không thể gửi yêu cầu'),
      });
    } finally {
      setIsJoiningStudio(false);
    }
  };

  // 4. Hủy yêu cầu gia nhập Studio
  const handleCancelJoinRequest = async () => {
    if (!currentMembership) return;
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu gia nhập Studio này?')) return;

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('studio_members')
          .delete()
          .eq('id', currentMembership.id);

        if (error) throw error;
      }
      setCurrentMembership(null);
      setToast({
        type: 'info',
        message: 'Đã hủy yêu cầu gia nhập Studio.',
      });
    } catch (err: any) {
      console.error('Lỗi khi hủy yêu cầu:', err);
      setToast({
        type: 'error',
        message: 'Lỗi khi hủy: ' + err.message,
      });
    }
  };

  // 5. Rời khỏi Studio (quay về Freelancer)
  const handleLeaveStudio = async () => {
    if (!currentMembership) return;
    if (!window.confirm(`Bạn có chắc muốn rời khỏi Studio "${currentMembership.studio?.name || 'này'}" và chuyển về chế độ Freelancer?`)) {
      return;
    }

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('studio_members')
          .delete()
          .eq('id', currentMembership.id);

        await supabase
          .from('users')
          .update({ account_type: 'freelancer' })
          .eq('id', user?.id);
      }
      setCurrentMembership(null);
      setAccountType('freelancer');
      setToast({
        type: 'success',
        message: 'Đã chuyển tài khoản về chế độ Freelancer độc lập.',
      });
    } catch (err: any) {
      console.error('Lỗi rời Studio:', err);
    }
  };

  // 6. Hàm lưu toàn bộ cài đặt profile vào bảng users
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setToast({ type: 'error', message: 'Bạn chưa đăng nhập.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Validate Username format
    if (!cleanUsername) {
      setToast({ type: 'error', message: 'Username không được để trống.' });
      return;
    }

    const usernameRegex = /^[a-z0-9_-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setToast({
        type: 'error',
        message: 'Username chỉ được chứa chữ thường không dấu, số, gạch ngang (-) hoặc gạch dưới (_).',
      });
      return;
    }

    setIsSaving(true);
    setToast(null);

    try {
      if (isSupabaseConfigured) {
        // Kiểm tra xem username có bị trùng với thợ ảnh khác không
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          setToast({
            type: 'error',
            message: `Username "${cleanUsername}" đã có người sử dụng. Vui lòng chọn username khác.`,
          });
          setIsSaving(false);
          return;
        }

        // Thực hiện cập nhật bảng users
        const { error: updateError } = await supabase
          .from('users')
          .update({
            account_type: accountType,
            studio_name: studioName.trim() || 'MIRMIA STUDIO',
            avatar_url: avatarUrl.trim() || null,
            username: cleanUsername,
            full_name: fullName.trim(),
            phone: phone.trim(),
            bank_name: bankName.trim(),
            bank_account_number: bankAccountNumber.trim(),
            bank_account_name: bankAccountName.trim().toUpperCase(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        setToast({
          type: 'success',
          message: '🎉 Đã lưu cài đặt thông tin Profile & Tài khoản ngân hàng thành công!',
        });
      } else {
        await new Promise(res => setTimeout(res, 600));
        setToast({
          type: 'success',
          message: '🎉 [Demo] Đã lưu thông tin cài đặt thành công!',
        });
      }
    } catch (err: any) {
      console.error('Lỗi lưu cài đặt:', err);
      setToast({
        type: 'error',
        message: `Lỗi khi lưu: ${err.message || 'Vui lòng kiểm tra lại kết nối.'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const bookingUrl = `${window.location.origin}/book/${username || 'username'}`;

  const handleCopyBookingLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setIsCopiedLink(true);
      setToast({
        type: 'success',
        message: '📋 Đã copy link đặt lịch vào Clipboard!',
      });
      setTimeout(() => setIsCopiedLink(false), 2500);
    } catch (err) {
      console.error('Không thể copy link:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Đang tải thông tin cài đặt...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideDown max-w-md">
          <div
            className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
                : toast.type === 'info'
                ? 'bg-slate-900/95 border-blue-500/50 text-blue-200'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-slate-500 dark:text-white/60 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-950/40">
              <div className="w-full h-full bg-white dark:bg-black/60 rounded-[14px] flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white/90 tracking-tight">
                Thiết Lập Hồ Sơ & Bán Chuyên
              </h1>
              <p className="text-xs text-slate-500 dark:text-white/50">
                Phân loại tài khoản Freelancer / Studio, thương hiệu và nhận cọc VietQR
              </p>
            </div>
          </div>
        </div>

        <Link
          to={`/book/${username || 'johnnylongho'}`}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Xem Trang Đặt Lịch Của Tôi</span>
        </Link>
      </div>

      {/* Dynamic Booking Link Preview Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-amber-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Đường Dẫn Đặt Lịch Độc Quyền Dành Cho Khách Hàng (Dynamic Routing)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            /book/:username
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
          Gửi đường link này cho khách hàng tiềm năng qua tin nhắn, Zalo hoặc gắn lên Bio Facebook / Instagram để khách tự chọn lịch và đặt cọc giữ chỗ:
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 font-mono text-xs text-amber-600 dark:text-amber-300 select-all truncate flex items-center gap-2">
            <AtSign className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span className="truncate">{bookingUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyBookingLink}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isCopiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isCopiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopiedLink ? 'Đã Copy!' : 'Sao Chép Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: PHÂN LOẠI TÀI KHOẢN (FREELANCER VS STUDIO MEMBER)         */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60 dark:border-white/10">
            <User className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. Phân Loại Tài Khoản (Account Type)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                Chọn mô hình hoạt động để hệ thống áp dụng nhận diện thương hiệu chuẩn xác
              </p>
            </div>
          </div>

          {/* Radio Buttons Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Freelancer */}
            <label
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                accountType === 'freelancer'
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-100/50 dark:bg-black/20 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <input
                type="radio"
                name="account_type"
                value="freelancer"
                checked={accountType === 'freelancer'}
                onChange={() => setAccountType('freelancer')}
                className="mt-1 text-amber-500 focus:ring-amber-400"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  <User className="w-4 h-4 text-amber-500" />
                  <span>Tôi là Freelancer (Nhiếp ảnh gia tự do)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tự do xây dựng thương hiệu cá nhân độc lập. Tự tải lên Logo và Tên thương hiệu riêng trên trang đặt lịch.
                </p>
              </div>
            </label>

            {/* Option 2: Studio Member */}
            <label
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                accountType === 'studio_member'
                  ? 'bg-blue-500/10 border-blue-500/60 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-100/50 dark:bg-black/20 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <input
                type="radio"
                name="account_type"
                value="studio_member"
                checked={accountType === 'studio_member'}
                onChange={() => setAccountType('studio_member')}
                className="mt-1 text-blue-500 focus:ring-blue-400"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Tôi thuộc một Studio (Thành viên Studio)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gia nhập một Studio đã có trên Lensy. Được gắn huy hiệu xác thực (Verified by Studio) sau khi được duyệt.
                </p>
              </div>
            </label>
          </div>

          {/* ==================================================================== */}
          {/* KỊCH BẢN 1: FREELANCER (Upload logo cá nhân & Thương hiệu riêng)    */}
          {/* ==================================================================== */}
          {accountType === 'freelancer' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <Sparkles className="w-4 h-4" />
                <span>Thiết Lập Thương Hiệu Cá Nhân Freelancer</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên Thương Hiệu Cá Nhân *
                  </label>
                  <input
                    type="text"
                    required
                    value={studioName}
                    onChange={e => setStudioName(e.target.value)}
                    placeholder="VD: Long Ho Wedding Photography"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-500" />
                    <span>URL Logo / Ảnh Đại Diện Cá Nhân</span>
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Logo Preview */}
              {avatarUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950 p-1 flex-shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Logo cá nhân"
                      className="w-full h-full object-cover rounded-lg"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/mirmia-logo.png';
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Logo cá nhân sẽ xuất hiện tại góc trên trang đặt lịch riêng của bạn.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* KỊCH BẢN 2: THUỘC MỘT STUDIO (Tìm kiếm Studio & Gửi Request Bắt Tay) */}
          {/* ==================================================================== */}
          {accountType === 'studio_member' && (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Building2 className="w-4 h-4" />
                  <span>Trạng Thái Gia Nhập Studio (Bắt Tay Kép)</span>
                </div>
              </div>

              {/* Trường hợp A: Đang chờ duyệt (status = 'pending') */}
              {currentMembership && currentMembership.status === 'pending' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Đang chờ Studio "{currentMembership.studio?.name || 'Studio'}" phê duyệt... (Pending)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelJoinRequest}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold"
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                    ⚠️ <strong>Lưu ý quan trọng:</strong> Trong lúc yêu cầu đang ở trạng thái <em>Pending</em>, profile công khai (<code className="text-amber-400">/book/{username}</code>) của bạn vẫn duy trì tên và logo cá nhân, <strong>chưa được phép hiển thị</strong> logo hoặc tên của Studio đó cho đến khi Admin phê duyệt.
                  </div>
                </div>
              )}

              {/* Trường hợp B: Đã được duyệt chính thức (status = 'approved') */}
              {currentMembership && currentMembership.status === 'approved' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-1 flex-shrink-0">
                      <img
                        src={currentMembership.studio?.logo_url || '/mirmia-logo.png'}
                        alt="Studio Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {currentMembership.studio?.name || 'Studio Đã Xác Thực'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Đã Xác Thực</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Vai trò: {currentMembership.role === 'admin' ? 'Quản trị viên Studio' : 'Thợ chụp trực thuộc'} • Trang đặt lịch của bạn hiện hiển thị thương hiệu Studio.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLeaveStudio}
                    className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Rời Studio</span>
                  </button>
                </div>
              )}

              {/* Trường hợp C: Bị từ chối (status = 'rejected') */}
              {currentMembership && currentMembership.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Yêu cầu gia nhập Studio đã bị từ chối.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelJoinRequest}
                    className="text-xs text-amber-400 underline font-bold"
                  >
                    Chọn Studio khác
                  </button>
                </div>
              )}

              {/* Trường hợp D: Chưa có membership -> Cho phép Tìm kiếm & Gửi Request */}
              {!currentMembership && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      <span>Tìm Kiếm Studio Đã Đăng Ký Trên Lensy *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studioSearchQuery}
                        onChange={e => handleSearchStudios(e.target.value)}
                        placeholder="Nhập tên Studio để tìm kiếm (VD: MIRMIA...)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-400"
                      />
                      {isSearchingStudios && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Kết Quả Tìm Kiếm */}
                  {studioSearchResults.length > 0 && !selectedStudioToJoin && (
                    <div className="p-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl space-y-1 max-h-48 overflow-y-auto">
                      {studioSearchResults.map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudioToJoin(s);
                            setStudioSearchQuery(s.name);
                            setStudioSearchResults([]);
                          }}
                          className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0">
                              <img
                                src={s.logo_url || '/mirmia-logo.png'}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs font-bold text-white">{s.name}</span>
                          </div>
                          {s.verified_status && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                              Verified
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Studio Đã Chọn Để Gửi Request */}
                  {selectedStudioToJoin && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-blue-500/30 flex-shrink-0">
                          <img
                            src={selectedStudioToJoin.logo_url || '/mirmia-logo.png'}
                            alt={selectedStudioToJoin.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{selectedStudioToJoin.name}</p>
                          <p className="text-[10px] text-slate-400">Đã chọn Studio này</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudioToJoin(null)}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1"
                        >
                          Đổi
                        </button>
                        <button
                          type="button"
                          disabled={isJoiningStudio}
                          onClick={handleSendJoinRequest}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                        >
                          {isJoiningStudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Gửi Yêu Cầu Gia Nhập</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* SECTION 2: THÔNG TIN CÁ NHÂN & LIÊN HỆ                             */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60 dark:border-white/10">
            <Building2 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. Thông Tin Định Danh & Liên Hệ
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                Hiển thị trên Thư báo giá, Form đặt lịch và Hợp đồng điện tử
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ và tên thợ ảnh */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Họ Và Tên Thợ Ảnh / Quản Lý *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="VD: Johnny Long Hồ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none font-medium"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Username Định Tuyến (/book/:username) *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="VD: johnnylongho"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono text-amber-600 dark:text-amber-300 placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Chỉ gồm chữ thường, số, dấu gạch nối (ví dụ: <code className="text-amber-500 dark:text-amber-400/80">johnnylongho</code>)
              </p>
            </div>

            {/* Số điện thoại / Zalo */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Số Điện Thoại / Hotline Zalo *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 3: TÀI KHOẢN NGÂN HÀNG (VIETQR & NHẮC NỢ)                   */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-7 rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/60 dark:border-white/10">
            <CreditCard className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Tài Khoản Ngân Hàng Nhận Tiền (VietQR & Trợ Lý Nhắc Nợ)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                Hệ thống sẽ dùng chính xác thông tin này để tạo mã VietQR cọc và tự động điền vào tin nhắn đòi nợ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tên Ngân Hàng */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Tên Ngân Hàng *</span>
              </label>
              <input
                type="text"
                required
                list="popular-banks"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="VD: MB Bank"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none font-medium"
              />
              <datalist id="popular-banks">
                {POPULAR_BANKS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Số Tài Khoản */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Số Tài Khoản Ngân Hàng *</span>
              </label>
              <input
                type="text"
                required
                value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value.replace(/\s+/g, ''))}
                placeholder="VD: 0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none"
              />
            </div>

            {/* Tên Chủ Tài Khoản */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Chủ Tài Khoản (Không Dấu) *</span>
              </label>
              <input
                type="text"
                required
                value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="VD: JOHNNY LONG HO"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono font-bold text-amber-600 dark:text-amber-300 placeholder-slate-400 dark:placeholder-slate-600 transition-all outline-none uppercase"
              />
            </div>
          </div>

          {/* Minh họa tích hợp thông minh */}
          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Tự động hóa thông tin tài khoản:
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                1. Khi khách quét mã QR cọc tại trang báo giá, hệ thống sẽ tự động tạo QR VietQR với STK: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{bankAccountNumber || '...'}</strong> ({bankName}) - Chủ TK: <strong className="text-amber-600 dark:text-amber-300">{bankAccountName || '...'}</strong>.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                2. Tính năng <strong className="text-amber-600 dark:text-amber-400">Trợ Lý Nhắc Nợ</strong> tại Dashboard sẽ tự động điền STK này vào mẫu tin nhắn đòi nợ khi bạn bấm Copy sang Zalo.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            Hủy Bỏ
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Cài Đặt Hồ Sơ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
