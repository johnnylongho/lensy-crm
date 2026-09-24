import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  QrCode,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. Nếu đang kiểm tra auth, hiển thị loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Đang tải Lensy CRM...</p>
      </div>
    );
  }

  // 2. Nếu User ĐÃ ĐĂNG NHẬP -> Tự động Redirect về /dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Nếu User CHƯA ĐĂNG NHẬP -> Render Landing Page giới thiệu ngắn gọn & nút Đăng Nhập
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 right-10 w-[450px] h-[450px] bg-indigo-500/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-auto flex-shrink-0 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <img
                src="/lensy-logo.png"
                alt="Lensy Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Lensy
                </span>
                <span className="text-[10px] text-gray-400 font-medium italic hidden sm:inline">
                  by Mirmia Studio
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  CRM
                </span>
              </div>
            </div>
          </Link>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập Thợ Ảnh</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 max-w-5xl mx-auto text-center relative z-10 space-y-8">
        {/* Badge Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-md animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Nền tảng "Trợ lý số" All-in-one cho Freelance Photographers & Boutique Studios</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Quản Lý Lịch Chụp, Thiết Bị &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              Thu Hồi Nợ 1-Chạm
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Chấm dứt nỗi lo đụng máy, sót lịch và khó mở lời đòi nợ. Lensy CRM giúp nhiếp ảnh gia vận hành studio chuẩn mực, tối ưu dòng tiền cọc và nâng cao trải nghiệm khách hàng.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md">
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.03]"
          >
            <span>Vào Hệ Thống Quản Trị</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/quote"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:border-slate-600"
          >
            <span>Xem Mẫu Thư Báo Giá</span>
          </Link>
        </div>

        {/* 3 Core USP Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 text-left w-full">
          {/* Card 1 */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all shadow-xl space-y-3 group backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              Cảnh Báo Xung Đột Thiết Bị
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tự động quét chéo body Sony, Canon, ống kính GM và thợ phụ giữa các show cùng ngày. Cảnh báo đỏ nổi bật và tính phụ phí thuê ngoài.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all shadow-xl space-y-3 group backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              AI Thu Hồi Nợ & VietQR Động
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tự động đối chiếu show đã trả file ảnh, sinh mẫu tin nhắn nhắc nợ tinh tế 3 tone giọng kèm mã QR chứa chính xác số tiền còn nợ.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all shadow-xl space-y-3 group backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
              Link Đặt Lịch & Chốt Cọc 30s
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mỗi thợ ảnh sở hữu trang đặt lịch riêng (<code className="text-amber-300">/book/:username</code>). Khách hàng xem báo giá cá nhân hóa và cọc tức thì.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 Lensy CRM by Mirmia Studio & Academy. Phát triển chuyên biệt cho Freelance Photographers & Boutique Studios.</p>
      </footer>
    </div>
  );
};
