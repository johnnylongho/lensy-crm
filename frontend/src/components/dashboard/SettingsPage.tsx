import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
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
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  studio_name: string;
  phone: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
}

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
  const [studioName, setStudioName] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('MB Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // Toast state
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 1. Fetch dữ liệu từ bảng users dựa trên auth.uid()
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
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
            setStudioName(data.studio_name || '');
            setUsername(data.username || '');
            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setBankName(data.bank_name || 'MB Bank');
            setBankAccountNumber(data.bank_account_number || '');
            setBankAccountName(data.bank_account_name || '');
          }
        } else {
          // Demo fallback
          setStudioName('MIRMIA STUDIO & ACADEMY');
          setUsername('johnnylongho');
          setFullName('Johnny Long Hồ');
          setPhone('0901234567');
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

    fetchUserProfile();
  }, [user]);

  // 2. Hàm lưu thay đổi vào bảng users
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
        const { data: existingUser, error: checkErr } = await supabase
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
            studio_name: studioName.trim() || 'MIRMIA STUDIO',
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
          message: '🎉 Đã lưu cài đặt thông tin Studio & Tài khoản ngân hàng thành công!',
        });
      } else {
        // Mock fallback
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
            className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
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
              className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Cài Đặt Hồ Sơ & Thanh Toán
              </h1>
              <p className="text-xs text-slate-400">
                Quản lý thương hiệu Studio, đường link đặt lịch và tài khoản nhận cọc VietQR
              </p>
            </div>
          </div>
        </div>

        <Link
          to={`/book/${username || 'johnnylongho'}`}
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Xem Trang Đặt Lịch Của Tôi</span>
        </Link>
      </div>

      {/* Dynamic Booking Link Preview Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-slate-900/90 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Đường Dẫn Đặt Lịch Độc Quyền Dành Cho Khách Hàng (Dynamic Routing)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            /book/:username
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Gửi đường link này cho khách hàng tiềm năng qua tin nhắn, Zalo hoặc gắn lên Bio Facebook / Instagram để khách tự chọn lịch và đặt cọc giữ chỗ:
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 select-all truncate flex items-center gap-2">
            <AtSign className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="truncate">{bookingUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyBookingLink}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isCopiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isCopiedLink ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopiedLink ? 'Đã Copy!' : 'Sao Chép Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Thông tin Studio & Định danh */}
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Thông Tin Thương Hiệu & Studio
              </h2>
              <p className="text-[11px] text-slate-400">
                Hiển thị trên Thư báo giá, Form đặt lịch và Hợp đồng điện tử
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tên Studio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tên Studio / Thương Hiệu *</span>
              </label>
              <input
                type="text"
                required
                value={studioName}
                onChange={e => setStudioName(e.target.value)}
                placeholder="VD: MIRMIA STUDIO & ACADEMY"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none font-medium"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Username Định Tuyến (/book/:username) *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="VD: johnnylongho"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono text-amber-300 placeholder-slate-600 transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Chỉ gồm chữ thường, số, dấu gạch nối (ví dụ: <code className="text-amber-400/80">johnnylongho</code>)
              </p>
            </div>

            {/* Họ và tên thợ ảnh */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Họ Và Tên Thợ Ảnh / Quản Lý *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="VD: Johnny Long Hồ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none font-medium"
              />
            </div>

            {/* Số điện thoại / Zalo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Số Điện Thoại / Hotline Zalo *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Tài khoản Ngân Hàng (VietQR & Nhắc Nợ) */}
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Tài Khoản Ngân Hàng Nhận Tiền (VietQR & Trợ Lý Nhắc Nợ)
              </h2>
              <p className="text-[11px] text-slate-400">
                Hệ thống sẽ dùng chính xác thông tin này để tạo mã VietQR cọc và tự động điền vào tin nhắn đòi nợ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tên Ngân Hàng */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tên Ngân Hàng *</span>
              </label>
              <input
                type="text"
                required
                list="popular-banks"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="VD: MB Bank"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-600 transition-all outline-none font-medium"
              />
              <datalist id="popular-banks">
                {POPULAR_BANKS.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Số Tài Khoản */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Số Tài Khoản Ngân Hàng *</span>
              </label>
              <input
                type="text"
                required
                value={bankAccountNumber}
                onChange={e => setBankAccountNumber(e.target.value.replace(/\s+/g, ''))}
                placeholder="VD: 0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono font-bold text-emerald-400 placeholder-slate-600 transition-all outline-none"
              />
            </div>

            {/* Tên Chủ Tài Khoản */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Chủ Tài Khoản (Không Dấu) *</span>
              </label>
              <input
                type="text"
                required
                value={bankAccountName}
                onChange={e => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="VD: JOHNNY LONG HO"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs font-mono font-bold text-amber-300 placeholder-slate-600 transition-all outline-none uppercase"
              />
            </div>
          </div>

          {/* Minh họa tích hợp thông minh */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <p className="font-bold text-slate-200">
                Tự động hóa thông tin tài khoản:
              </p>
              <p className="text-slate-400">
                1. Khi khách quét mã QR cọc tại trang báo giá, hệ thống sẽ tự động tạo QR VietQR với STK: <strong className="text-emerald-400 font-mono">{bankAccountNumber || '...'}</strong> ({bankName}) - Chủ TK: <strong className="text-amber-300">{bankAccountName || '...'}</strong>.
              </p>
              <p className="text-slate-400">
                2. Tính năng <strong className="text-amber-400">Trợ Lý Nhắc Nợ</strong> tại Dashboard sẽ tự động điền STK này vào mẫu tin nhắn đòi nợ khi bạn bấm Copy sang Zalo.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
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
                <span>Lưu Cài Đặt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
