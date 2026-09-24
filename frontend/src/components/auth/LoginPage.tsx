import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
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
        const { error, user } = await signUp(email, password, fullName);
        if (error) {
          setErrorMessage(error.message || 'Đăng ký không thành công.');
          return;
        }

        if (user && !user.confirmed_at && user.identities?.length) {
          setSuccessMessage(
            '🎉 Đăng ký thành công! Nếu hệ thống yêu cầu xác nhận email, vui lòng kiểm tra hộp thư đến của bạn để kích hoạt tài khoản.'
          );
        } else {
          setSuccessMessage('🎉 Đăng ký tài khoản thành công! Đang chuyển hướng vào Dashboard...');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1200);
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
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-indigo-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Back to Quote Link Bar */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về Trang Chủ Lensy</span>
        </Link>
        <span className="text-[10px] text-slate-500 font-mono">Lensy v1.0 • SaaS Ready</span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl overflow-hidden border border-red-500/30 bg-black shadow-lg shadow-red-950/40 p-0.5 flex items-center justify-center">
            <img
              src="/mirmia-logo.png"
              alt="Mirmia Studio & Academy"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>Đăng nhập Lensy</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-950/70 border border-red-500/30 text-red-300">
                PRO
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống trợ lý số độc quyền cho Thợ ảnh & Boutique Studio
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-xl font-bold transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
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
            className={`py-2 rounded-xl font-bold transition-all ${
              mode === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
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
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 block">Họ Tên Thợ Ảnh / Tên Studio:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Long (Mirmia Photography)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 block">Địa Chỉ Email:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="photographer@lensy.vn"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 block">Mật Khẩu:</label>
              {mode === 'login' && (
                <span className="text-[10px] text-slate-500 cursor-not-allowed">Quên mật khẩu?</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'ĐĂNG NHẬP VÀO DASHBOARD' : 'TẠO TÀI KHOẢN MỚI'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Track */}
        <div className="pt-2 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-[11px] text-slate-500">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrorMessage(null);
              }}
              className="text-amber-400 hover:text-amber-300 font-bold ml-1 transition-colors"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập tại đây'}
            </button>
          </p>

          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Thử đăng nhập nhanh bằng tài khoản Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
