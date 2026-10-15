import React, { useState } from 'react';
import { useAuth, AccountType } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Users,
  Building2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const queryMode = new URLSearchParams(location.search).get('mode');
  const [mode, setMode] = useState<'login' | 'signup'>(queryMode === 'signup' ? 'signup' : 'login');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setMode('signup');
    } else if (params.get('mode') === 'login') {
      setMode('login');
    }
  }, [location.search]);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [studioName, setStudioName] = useState<string>('');
  const [accountType, setAccountType] = useState<AccountType>('freelancer');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại!');
          } else {
            setErrorMessage(error.message || 'Đăng nhập không thành công.');
          }
          return;
        }

        navigate(from, { replace: true });
      } else {
        const { error, user } = await signUp(email, password, fullName, accountType, {
          studioName: studioName.trim() || undefined,
        });
        if (error) {
          setErrorMessage(error.message || 'Đăng ký không thành công.');
          return;
        }

        if (user && !user.confirmed_at && user.identities?.length) {
          setSuccessMessage(
            'Đăng ký thành công! Nếu hệ thống yêu cầu xác nhận email, vui lòng kiểm tra hộp thư đến để kích hoạt tài khoản.'
          );
        } else {
          setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng thiết lập vai trò...');
          setTimeout(() => {
            navigate('/onboarding', { replace: true });
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Nạp nhanh tài khoản demo cho trải nghiệm ngay
  const handleQuickDemo = async () => {
    setEmail('contact@mirmia.vn');
    setPassword('mirmia123456');
    setIsLoading(true);
    const { error } = await signIn('contact@mirmia.vn', 'mirmia123456');
    setIsLoading(false);
    if (!error) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage('Tài khoản demo chưa được tạo trên Supabase Auth. Bạn có thể bấm "Tạo tài khoản mới" với email bất kỳ để trải nghiệm!');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f5] text-slate-800 dark:bg-[#080c14] dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-orange-500/15 via-[#df8653]/10 to-amber-500/15 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Header Bar: Back link & Theme Toggle */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về Trang Chủ Lensy</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">v1.0 • Multi-Role</span>
        </div>
      </div>

      {/* Main Login Card (Warm Clay & Frosted Glass) */}
      <div className="w-full max-w-lg rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            <img
              src="/lensy-logo.png"
              alt="Lensy Logo"
              className="w-16 h-16 object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              <span>Đăng nhập Lensy CRM</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400">
                PRO
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hệ thống trợ lý số độc quyền cho Freelancer, Ekip & Quản Lý Studio
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 bg-slate-100/90 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tạo Tài Khoản Mới
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <>
              {/* PHÂN LOẠI 3 NHÓM TÀI KHOẢN */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">Chọn Phân Loại Tài Khoản:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Freelancer */}
                  <button
                    type="button"
                    onClick={() => setAccountType('freelancer')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      accountType === 'freelancer'
                        ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500/40'
                        : 'bg-slate-100/80 dark:bg-black/30 border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-[#df8653]/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Freelancer</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Thợ ảnh tự do: Lịch cá nhân, CRM khách & dòng tiền thực thu
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-500/80 mt-2 block">
                      Giao diện solo
                    </span>
                  </button>

                  {/* Thành viên studio */}
                  <button
                    type="button"
                    onClick={() => setAccountType('studio_member')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      accountType === 'studio_member'
                        ? 'bg-emerald-500/15 border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-slate-100/80 dark:bg-black/30 border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-[#df8653]/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Users className="w-3.5 h-3.5" />
                        <span>Thành Viên</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Ekip Studio: Nhận ca phân công, mượn máy, cập nhật show
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-500/80 mt-2 block">
                      Giao diện tác chiến
                    </span>
                  </button>

                  {/* Quản lý studio */}
                  <button
                    type="button"
                    onClick={() => setAccountType('studio_admin')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      accountType === 'studio_admin'
                        ? 'bg-orange-500/15 border-[#df8653] text-slate-900 dark:text-white shadow-sm ring-1 ring-orange-500/40'
                        : 'bg-slate-100/80 dark:bg-black/30 border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-[#df8653]/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-[#df8653]">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Quản Lý Studio</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Chủ studio: Toàn quyền doanh thu, kho máy, phân ekip
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-[#df8653] mt-2 block">
                      Toàn quyền quản trị
                    </span>
                  </button>
                </div>
              </div>

              {/* Tên họ người dùng */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {accountType === 'freelancer'
                    ? 'Họ Tên Thợ Ảnh / Nghệ Danh:'
                    : accountType === 'studio_member'
                    ? 'Họ Tên Thành Viên Ekip:'
                    : 'Họ Tên Quản Lý / Chủ Studio:'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={
                      accountType === 'freelancer'
                        ? 'Ví dụ: Hoàng Long Photography'
                        : accountType === 'studio_member'
                        ? 'Ví dụ: Nguyễn Văn Hưng (Photographer)'
                        : 'Ví dụ: Lê Hoàng Sang'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#df8653]/30 focus:border-[#df8653] transition-all text-xs sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>

              {/* Tên Studio (cho studio_admin hoặc studio_member) */}
              {(accountType === 'studio_admin' || accountType === 'studio_member') && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    {accountType === 'studio_admin'
                      ? 'Tên Studio / Doanh Nghiệp Bạn Quản Lý:'
                      : 'Tên Studio Đang Làm Việc / Cộng Tác:'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                      placeholder="Ví dụ: MIRMIA STUDIO & ACADEMY"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#df8653]/30 focus:border-[#df8653] transition-all text-xs sm:text-sm min-h-[44px]"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">Địa Chỉ Email:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="photographer@lensy.vn"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#df8653]/30 focus:border-[#df8653] transition-all text-xs sm:text-sm min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">Mật Khẩu:</label>
              {mode === 'login' && (
                <span className="text-[10px] text-slate-400 cursor-not-allowed">Quên mật khẩu?</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#df8653]/30 focus:border-[#df8653] transition-all text-xs sm:text-sm font-mono min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-[#df8653] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </span>
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'ĐĂNG NHẬP VÀO DASHBOARD'
                    : accountType === 'freelancer'
                    ? 'TẠO TÀI KHOẢN FREELANCER'
                    : accountType === 'studio_member'
                    ? 'GIA NHẬP VỚI VAI TRÒ THÀNH VIÊN'
                    : 'KHỞI TẠO TÀI KHOẢN QUẢN LÝ STUDIO'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Track */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center space-y-2">
          <p className="text-[11px] text-slate-500">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrorMessage(null);
              }}
              className="text-[#df8653] hover:text-orange-500 font-bold ml-1 transition-colors cursor-pointer"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập tại đây'}
            </button>
          </p>

          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Thử đăng nhập nhanh bằng tài khoản Demo</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-gray-500 z-10">
        <p>Phát triển bởi Mirmia Studio & Academy</p>
      </footer>
    </div>
  );
};
