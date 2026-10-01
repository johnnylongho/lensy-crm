import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Layers,
  Sparkles,
  QrCode,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Check,
  Star,
  Users,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  FolderSync,
  Receipt,
  ExternalLink,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. Nếu đang kiểm tra auth, hiển thị loading sang trọng phong cách Dark Mode
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider">Đang tải Lensy CRM...</p>
      </div>
    );
  }

  // 2. Nếu User ĐÃ ĐĂNG NHẬP -> Tự động Chuyển hướng về /dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Animation variants
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden font-sans">
      {/* ==================================================================== */}
      {/* LIQUID GLASS BACKGROUND MESH GRADIENT (Ánh sáng mờ ảo phía sau)      */}
      {/* ==================================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Khối 1: Tím Indigo / Amber Hổ phách (Góc trên trung tâm) */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[500px] rounded-full bg-gradient-to-b from-amber-500/15 via-rose-500/10 to-indigo-600/10 blur-[150px] opacity-40" />

        {/* Khối 2: Xanh Ngọc / Teal Cyan (Góc trên bên phải) */}
        <div className="absolute top-1/4 -right-40 w-[500px] sm:w-[650px] h-[550px] rounded-full bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-transparent blur-[140px] opacity-35" />

        {/* Khối 3: Hổ phách ấm / Tím đậm (Góc dưới bên trái) */}
        <div className="absolute top-2/3 -left-40 w-[500px] sm:w-[700px] h-[600px] rounded-full bg-gradient-to-tr from-amber-600/15 via-purple-700/15 to-transparent blur-[160px] opacity-35" />

        {/* Khối 4: Ánh sáng đáy trang */}
        <div className="absolute -bottom-40 right-1/4 w-[600px] h-[400px] bg-indigo-500/10 blur-[150px] opacity-30" />
      </div>

      {/* ==================================================================== */}
      {/* 1. HEADER CHUẨN LIQUID GLASS                                         */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-[#080c14]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Brand Bên Trái */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-8 w-auto flex-shrink-0 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              <img
                src="/lensy-logo.png"
                alt="Lensy Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 leading-none">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Lensy
                </span>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  CRM
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium italic mt-0.5 tracking-wider hidden sm:inline">
                by Mirmia Studio
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">
              Tính năng nổi bật
            </a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">
              Bảng giá
            </a>
            <Link to="/quote" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <span>Xem Thư Báo Giá Mẫu</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          </nav>

          {/* Action Buttons Bên Phải */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/login"
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-300" />
              <span>Đăng nhập</span>
            </Link>

            <Link
              to="/login?mode=signup"
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Bắt đầu miễn phí</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION                                                      */}
      {/* ==================================================================== */}
      <main className="flex-1 relative z-10">
        <section className="px-4 sm:px-6 pt-16 sm:pt-24 pb-16 max-w-6xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center max-w-4xl"
          >
            {/* Pill Tag */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-xl mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Nền tảng CRM thế hệ mới chuyên biệt cho Nhiếp ảnh gia & Studio</span>
            </motion.div>

            {/* Tiêu đề chính to, ấn tượng */}
            <motion.h1
              variants={fadeInUp}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] sm:leading-[1.15]"
            >
              Quản lý Studio & Lịch chụp theo cách của{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                người dẫn đầu.
              </span>
            </motion.h1>

            {/* Tiêu đề phụ */}
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl"
            >
              Nền tảng CRM duy nhất tích hợp bảng Kanban, theo dõi lợi nhuận ròng và tối ưu điểm chạm khách hàng dành riêng cho thợ ảnh Việt Nam.
            </motion.p>

            {/* Nút CTA Nổi Bật */}
            <motion.div
              variants={fadeInUp}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md"
            >
              <Link
                to="/login?mode=signup"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all duration-200 hover:scale-[1.03] active:scale-95 group"
              >
                <span>Tạo tài khoản Studio ngay - Miễn phí 14 ngày</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/quote"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <span>Xem Mẫu Thư Báo Giá</span>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={fadeInUp}
              className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Không yêu cầu thẻ tín dụng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Cài đặt sử dụng trong 2 phút</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Hỗ trợ kỹ thuật 24/7</span>
              </div>
            </motion.div>

            {/* ================================================================ */}
            {/* HERO INTERACTIVE / VISUAL DASHBOARD SHOWCASE (Liquid Glass Mock) */}
            {/* ================================================================ */}
            <motion.div
              variants={fadeInUp}
              className="mt-12 sm:mt-16 w-full max-w-5xl rounded-3xl p-3 sm:p-5 bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-[0_8px_40px_0_rgba(0,0,0,0.45)] text-left relative overflow-hidden group"
            >
              {/* Top Bar of Dashboard Simulation */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 px-2 sm:px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                    app.lensy.vn/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Trực tiếp
                  </span>
                  <span className="text-slate-300 font-semibold hidden sm:inline">
                    Mirmia Wedding Studio
                  </span>
                </div>
              </div>

              {/* Grid Inside Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 sm:p-4 pt-4">
                {/* Mock Card 1: Kanban Pipeline snippet */}
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Pipeline Chụp Cưới
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Giai đoạn 3/5
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-white">Minh & Thảo - Pre-Wedding</span>
                      <span className="text-emerald-400 font-bold text-[11px]">Đã cọc 30%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      24/10/2026 • Phim trường Santorini • Sony A7IV + 24-70 GM
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                      <span className="text-slate-400">Hợp đồng: 18.000.000₫</span>
                      <span className="text-amber-400 font-mono">Đã thu: 5.400.000₫</span>
                    </div>
                  </div>
                </div>

                {/* Mock Card 2: Lợi Nhuận Ròng & ROI */}
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Lợi Nhuận Ròng Tháng
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      +84.2% Biên độ
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-white">68.450.000₫</span>
                      <span className="text-xs font-bold text-emerald-400">ROI 3.4x</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                      <div className="flex justify-between">
                        <span>Doanh thu gộp:</span>
                        <span className="text-white font-mono">81.200.000₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Khấu hao máy & thợ phụ:</span>
                        <span className="text-rose-400 font-mono">-12.750.000₫</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Card 3: VietQR 1-Chạm */}
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" />
                      VietQR Khách Cọc
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      Tự động điền số tiền
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-10 h-10 text-slate-950" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-white">MB Bank • 0988888xxx</p>
                      <p className="text-[11px] text-emerald-400 font-medium">Khách chốt cọc trong 30s</p>
                      <p className="text-[10px] text-slate-400 font-mono">Cú pháp: LENSY_COC_1024</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ==================================================================== */}
        {/* 3. FEATURES SECTION (DẠNG GRID CARDS CHUẨN LIQUID GLASS)             */}
        {/* ==================================================================== */}
        <section id="features" className="px-4 sm:px-6 py-20 max-w-6xl mx-auto scroll-mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Tính năng cốt lõi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Được thiết kế tinh chỉnh cho từng buổi chụp tại Việt Nam
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Giải phóng thợ ảnh khỏi những file Excel rối rắm, quên lịch chụp, đụng thiết bị và nỗi ngại ngùng mỗi lần nhắc nợ khách hàng.
            </p>
          </motion.div>

          {/* Grid 3 Cards Chính Theo Đúng Yêu Cầu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD 1: Pipeline kéo thả mượt mà (Kanban) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 hover:border-amber-500/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    Pipeline kéo thả mượt mà (Kanban)
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Trực quan hóa toàn bộ hành trình show từ Khách mới (Lead), Đã cọc 30%, Lên lịch chụp, Hậu kỳ blend & retouch đến Bàn giao file & Thu tiền cuối. Thao tác kéo thả mượt mà dnd-kit giúp bạn nắm bắt tiến độ studio trong chớp mắt.
                  </p>
                </div>
              </div>

              {/* Visual simulation inside Card 1 */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Cập nhật trạng thái tức thì</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                    Lead Mới
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    Đã Cọc
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    Hoàn Tất
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CARD 2: Tính toán Lợi nhuận ròng & Tốc độ hoàn vốn (ROI) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -6 }}
              className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 hover:border-emerald-500/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Tính toán Lợi nhuận ròng & Tốc độ hoàn vốn (ROI)
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Hệ thống tự động trừ khấu hao thiết bị (Sony, Canon), ống kính GM, chi phí thợ phụ, makeup và tiền thuê địa điểm ngoại cảnh. Giúp chủ studio biết đích xác số tiền thực đút túi sau mỗi hợp đồng và đo lường ngày hoàn vốn của từng bộ máy ảnh.
                  </p>
                </div>
              </div>

              {/* Visual simulation inside Card 2 */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Hợp đồng Wedding 18M:</span>
                  <span className="font-mono text-emerald-400 font-bold">Lợi nhuận: +14.8M (82%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[82%]" />
                </div>
              </div>
            </motion.div>

            {/* CARD 3: Link Đặt lịch chuyên nghiệp & Thanh toán 1-chạm (VietQR) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -6 }}
              className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 hover:border-sky-500/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                    Link Đặt lịch chuyên nghiệp & Thanh toán 1-chạm (VietQR)
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Mỗi thợ ảnh sở hữu một trang đặt lịch cá nhân hóa mang thương hiệu riêng (<code className="text-sky-300 font-mono">/book/:username</code>). Khách hàng duyệt gói dịch vụ, ký xác nhận báo giá và quét mã VietQR tự động điền số tiền cọc trong 30 giây.
                  </p>
                </div>
              </div>

              {/* Visual simulation inside Card 3 */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span className="text-slate-300 font-medium">Báo giá cá nhân hóa</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono text-[10px]">
                  VietQR Chuẩn NAPAS
                </span>
              </div>
            </motion.div>
          </div>

          {/* Thêm 3 Tính năng Bổ trợ làm phong phú trải nghiệm */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Camera className="w-4 h-4" />
                <span>Cảnh báo đụng thiết bị & nhân sự</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quét chéo thiết bị cùng ngày show. Tự động cảnh báo đỏ nếu một chiếc ống kính 70-200mm hay body chính bị xếp trùng hai tiệc cưới.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Receipt className="w-4 h-4" />
                <span>Nhắc nợ AI 3 tone giọng tinh tế</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tự động kiểm tra show đã giao file ảnh nhưng chưa tất toán. Soạn sẵn mẫu tin nhắn lịch thiệp, vui vẻ hoặc dứt khoát kèm mã QR thanh toán.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all space-y-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Users className="w-4 h-4" />
                <span>Chăm sóc khách hàng & LTV</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lưu giữ lịch sử chụp, phân nhóm khách VIP, nhắc ngày kỷ niệm ngày cưới để gửi ưu đãi chụp gói em bé (Newborn) hoặc kỷ niệm năm tròn.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ==================================================================== */}
        {/* 4. PRICING SECTION (BẢNG GIÁ THAM KHẢO: GÓI STARTER & GÓI PRO)       */}
        {/* ==================================================================== */}
        <section id="pricing" className="px-4 sm:px-6 py-20 max-w-5xl mx-auto scroll-mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Bảng giá minh bạch</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Đầu tư nhỏ, tối ưu doanh thu lớn cho Studio của bạn
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Khởi đầu hoàn toàn miễn phí hoặc mở khóa toàn bộ sức mạnh quản trị chuyên nghiệp không giới hạn.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* GÓI 1: Gói Starter (Miễn phí) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeInUp}
              whileHover={{ y: -4 }}
              className="p-8 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Dành cho Freelancer
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">Gói Starter</h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Phù hợp cho thợ ảnh cá nhân mới khởi nghiệp hoặc chụp bán thời gian.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">0₫</span>
                  <span className="text-xs text-slate-400">/ miễn phí vĩnh viễn</span>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Quản lý tối đa <strong>30 lịch chụp</strong> / tháng</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Bảng Kanban quản lý tiến độ cơ bản</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Trang đặt lịch & báo giá cá nhân hóa</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Thanh toán VietQR chuẩn chuyển khoản</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Quản lý danh bạ 50 khách hàng & thiết bị cơ bản</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/login?mode=signup"
                  className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span>Bắt đầu Miễn Phí</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* GÓI 2: Gói Pro (Trả phí hàng tháng - Highlight) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="p-8 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl border-2 border-amber-500/50 shadow-[0_8px_40px_0_rgba(245,158,11,0.15)] flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                Phổ biến & Khuyên dùng
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Dành cho Studio Chuyên Nghiệp
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">Gói Pro</h3>
                  <p className="text-xs text-slate-300 mt-2">
                    Dành cho Wedding House, Studio & Thợ ảnh muốn tự động hóa vận hành toàn diện.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                    199.000₫
                  </span>
                  <span className="text-xs text-slate-400">/ tháng (thanh toán linh hoạt)</span>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span><strong>Không giới hạn</strong> số lượng lịch chụp & khách hàng</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Bảng Kanban nâng cao + Bộ lọc trạng thái tùy biến</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span><strong>Tự động tính Lợi nhuận ròng & ROI thiết bị</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span><strong>Cảnh báo xung đột thiết bị</strong> chéo show trong ngày</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>VietQR Động tự tính chính xác tiền cọc & dư nợ</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Trợ lý nhắc hẹn & đòi nợ AI 3 tone giọng tinh tế</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Hỗ trợ kỹ thuật ưu tiên 24/7 trực tiếp qua Zalo / Hotline</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/login?mode=signup"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Dùng Thử Miễn Phí 14 Ngày</span>
                </Link>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Sau 14 ngày, bạn có thể gia hạn hoặc tiếp tục dùng gói Starter miễn phí.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* BANNER CTA ĐÁY TRANG                                                 */}
        {/* ==================================================================== */}
        <section className="px-4 sm:px-6 py-16 max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeInUp}
            className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-teal-500/10 border border-white/15 backdrop-blur-2xl text-center space-y-6 relative overflow-hidden"
          >
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Sẵn sàng đưa Studio của bạn lên tầm cao mới?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Gia nhập cùng hàng trăm thợ ảnh và chủ studio trên khắp Việt Nam đang tối ưu hóa thời gian và gia tăng lợi nhuận cùng Lensy CRM.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login?mode=signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <span>Tạo tài khoản Studio ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/quote"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Xem Báo Giá Mẫu Demo</span>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ==================================================================== */}
      {/* 5. FOOTER CHUẨN YÊU CẦU: Powered by Mirmia Studio & Academy          */}
      {/* ==================================================================== */}
      <footer className="border-t border-white/10 bg-[#06090f]/90 py-10 px-4 sm:px-8 text-xs text-slate-400 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          {/* Brand & Powered by */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-black text-sm text-white tracking-tight">Lensy CRM</span>
              <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                v2.0
              </span>
            </div>
            <p className="text-slate-400 font-medium">
              Powered by <strong className="text-slate-200">Mirmia Studio & Academy</strong>.
            </p>
            <p className="text-[11px] text-slate-500">
              Giải pháp số hóa toàn diện quy trình vận hành & tài chính cho thợ ảnh Việt Nam.
            </p>
          </div>

          {/* Quick links & Copyright */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-300">
              <a href="#features" className="hover:text-amber-400 transition-colors">Tính năng</a>
              <a href="#pricing" className="hover:text-amber-400 transition-colors">Bảng giá</a>
              <Link to="/quote" className="hover:text-amber-400 transition-colors">Thư báo giá</Link>
              <Link to="/login" className="hover:text-amber-400 transition-colors">Đăng nhập</Link>
            </div>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} Lensy CRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
