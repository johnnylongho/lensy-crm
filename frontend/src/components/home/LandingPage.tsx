import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type BillingCycle = 'monthly' | 'yearly';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // State thanh gạt chu kỳ thanh toán
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Điều hướng CTA
  const primaryCtaLink = user ? '/dashboard' : '/login';
  const primaryCtaText = user ? 'Vào Bảng Điều Khiển' : 'Bắt Đầu Miễn Phí';
  const headerCtaText = user ? 'Bảng Điều Khiển' : 'Đăng Nhập / Dùng Thử';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* ==================================================================== */}
      {/* 00. STICKY HEADER                                                    */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#050505]/80 border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity (No Icons, Pure Typography) */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-black tracking-tighter text-slate-950 dark:text-white">
              LENSY<span className="text-orange-500">.</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border border-slate-300 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 font-bold uppercase">
              STUDIO OS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-slate-600 dark:text-zinc-400">
            <a href="#giai-phap" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Giải Pháp
            </a>
            <a href="#tinh-nang" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Tính Năng
            </a>
            <a href="#bang-gia" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Bảng Giá
            </a>
            <a href="#bao-chung" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Bảo Chứng
            </a>
          </nav>

          {/* Actions: Theme Toggle & CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              type="button"
              className="text-[11px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors"
              title="Đổi giao diện Sáng / Tối"
            >
              {isDark ? 'LIGHT' : 'DARK'}
            </button>

            <Link
              to={primaryCtaLink}
              className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-600/30 transition-all active:scale-95"
            >
              {headerCtaText}
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 01. HERO SECTION                                                     */}
      {/* ==================================================================== */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 overflow-hidden">
        {/* Subtle grid background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] dark:opacity-[0.07] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400 font-mono text-[11px] font-bold tracking-widest uppercase">
            <span>●</span> HỆ ĐIỀU HÀNH DÀNH RIÊNG CHO PHOTOGRAPHER & STUDIO
          </div>

          {/* H1 Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.08]">
            Quản Trị Studio & Dòng Tiền.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">
              Chuẩn Xác Đến Từng Giây.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-slate-600 dark:text-zinc-400 font-normal leading-relaxed">
            Tự động hóa hoàn toàn từ khâu nhận cọc VietQR, xếp lịch nhân sự đến quét trùng lặp thiết bị. Giải phóng bạn khỏi sổ sách để tập trung vào nhiếp ảnh.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={primaryCtaLink}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm font-mono uppercase tracking-wider shadow-lg shadow-orange-600/25 active:scale-95 transition-all text-center"
            >
              {primaryCtaText}
            </Link>
            <Link
              to="/book/johnnylongho"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold text-sm font-mono uppercase tracking-wider transition-all text-center"
            >
              Xem Demo Hệ Thống
            </Link>
          </div>

          {/* Live System Indicator */}
          <div className="pt-6 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500 dark:text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SEPAY WEBHOOK 24/7
            </span>
            <span>·</span>
            <span>KHÔNG CẦN CÀI ĐẶT APP</span>
            <span>·</span>
            <span>ĐỘ TRỄ DƯỚI 3 GIÂY</span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 02. THANH CHỈ SỐ THỰC CHIẾN (4 CỘT DÀN NGANG)                        */}
      {/* ==================================================================== */}
      <section className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-zinc-800">
            {/* Metric 1 */}
            <div className="pt-4 lg:pt-0 lg:px-6 first:pt-0 first:px-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                03<span className="text-orange-500 text-2xl sm:text-3xl"> GIÂY</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium">
                Tự động chốt cọc qua SePAY Webhook.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="pt-4 lg:pt-0 lg:px-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                100%<span className="text-orange-500 text-2xl sm:text-3xl"> ROI</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium">
                Đo lường chính xác hoàn vốn từng thiết bị.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="pt-4 lg:pt-0 lg:px-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                05<span className="text-orange-500 text-2xl sm:text-3xl"> BƯỚC</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium">
                Chuẩn hóa quy trình Kanban nhiếp ảnh.
              </p>
            </div>

            {/* Metric 4 */}
            <div className="pt-4 lg:pt-0 lg:px-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-950 dark:text-white">
                0<span className="text-red-500 text-2xl sm:text-3xl"> TRANH CHẤP</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium">
                Cảnh báo đỏ ngay khi trùng lịch thiết bị/nhân sự.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 03. KHỐI GIẢI PHÁP (LƯỚI 3 CỘT NGANG: THỦ CÔNG VS LENSY CRM)          */}
      {/* ==================================================================== */}
      <section id="giai-phap" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050505]">
        <div className="max-w-7xl mx-auto space-y-14">
          {/* Section Header */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
              // KHỐI GIẢI PHÁP VẬN HÀNH
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              Xóa Sổ Hỗn Loạn. Tự Động Hóa Từ Đầu Đến Cuối.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-2xl">
              So sánh trực quan giữa phương pháp ghi chép thủ công dễ sai sót và tiêu chuẩn tự động hóa của Lensy CRM.
            </p>
          </div>

          {/* 3 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Cột 1 */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold tracking-widest text-orange-500 uppercase">
                  01 / BÁO GIÁ & CỌC
                </span>
                <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Chống Rớt Cọc
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Báo giá động 1 link duy nhất. Khách tự chọn gói, chuyển khoản quét mã VietQR và hệ thống tự động khóa lịch.
                </p>
              </div>

              {/* Contrast Tag Box */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400">
                  <span className="font-bold">THỦ CÔNG:</span> Gửi file PDF tĩnh, nhắn tin giục cọc qua Zalo, dễ bị khách hủy lịch phút chót.
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold">LENSY CRM:</span> Báo giá tương tác, quét mã VietQR, Webhook ghi nhận sau 3 giây và khóa lịch ngay.
                </div>
              </div>
            </div>

            {/* Cột 2 */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold tracking-widest text-orange-500 uppercase">
                  02 / ĐIỀU PHỐI TÀI NGUYÊN
                </span>
                <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Tránh Trùng Lịch
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Conflict Scanner 2.0 quét chéo thiết bị và nhân sự. Cảnh báo ngay nếu thợ hoặc máy ảnh đã bị book.
                </p>
              </div>

              {/* Contrast Tag Box */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400">
                  <span className="font-bold">THỦ CÔNG:</span> Ghi sổ tay hoặc Google Sheets rời rạc, thợ trùng giờ chụp, mang thiếu ống kính.
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold">LENSY CRM:</span> Thuật toán quét chéo thợ + lens + body, chặn trùng lặp thời gian thực.
                </div>
              </div>
            </div>

            {/* Cột 3 */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold tracking-widest text-orange-500 uppercase">
                  03 / DÒNG TIỀN THỰC
                </span>
                <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Quản Trị Lợi Nhuận
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Tự động trừ chi phí thợ phụ, khấu hao thiết bị để tính ra Net Profit - Tiền thật bỏ túi trên từng show.
                </p>
              </div>

              {/* Contrast Tag Box */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400">
                  <span className="font-bold">THỦ CÔNG:</span> Nhìn doanh thu tưởng lãi to, cuối tháng trừ chi phí phát sinh mới biết thâm hụt.
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold">LENSY CRM:</span> Tự động trừ tiền thợ, makeup, khấu hao gear, tính Net Profit rõ từng đồng.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 04. KHỐI TÍNH NĂNG CỐT LÕI (BENTO GRID 2X2 - SỐ 01-04 LỚN)             */}
      {/* ==================================================================== */}
      <section id="tinh-nang" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto space-y-14">
          {/* Section Header */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
              // TÍNH NĂNG CỐT LÕI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              Bento Grid: 4 Trụ Cột Vận Hành Toàn Diện.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-2xl">
              Không tính năng rườm rà. Mọi công cụ được thiết kế chuẩn mực xoay quanh đặc thù sản xuất hình ảnh.
            </p>
          </div>

          {/* Bento Grid 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 01 */}
            <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#080808] relative overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-5xl sm:text-6xl font-black font-mono text-slate-300 dark:text-zinc-800 group-hover:text-orange-500/40 transition-colors">
                  01
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                  PIPELINE
                </span>
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                  QUẢN TRỊ KANBAN & CRM
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Xử lý hợp đồng từ lúc khách mới hỏi đến khi trả file. Theo dõi trực quan 5 trạng thái: Báo giá ➔ Đã cọc ➔ Đã chụp ➔ Đang hậu kỳ ➔ Hoàn tất.
                </p>
              </div>
            </div>

            {/* Card 02 */}
            <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#080808] relative overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-5xl sm:text-6xl font-black font-mono text-slate-300 dark:text-zinc-800 group-hover:text-orange-500/40 transition-colors">
                  02
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                  SMART SCAN
                </span>
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                  CONFLICT SCANNER 2.0
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Quản lý kho thiết bị và chống trùng lịch thông minh. Tự động kiểm tra chéo lịch trùng thợ chụp, máy ảnh, ống kính trước khi xác nhận bất kỳ hợp đồng nào.
                </p>
              </div>
            </div>

            {/* Card 03 */}
            <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#080808] relative overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-5xl sm:text-6xl font-black font-mono text-slate-300 dark:text-zinc-800 group-hover:text-orange-500/40 transition-colors">
                  03
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                  DELIVERY
                </span>
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                  CLIENT PROOFING PORTAL
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Cổng nén siêu tốc cho khách hàng thả tim chọn ảnh online. Bàn giao bộ ảnh hoàn thiện với thương hiệu riêng của studio, xem mượt mà trên mọi thiết bị.
                </p>
              </div>
            </div>

            {/* Card 04 */}
            <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#080808] relative overflow-hidden group hover:border-orange-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-5xl sm:text-6xl font-black font-mono text-slate-300 dark:text-zinc-800 group-hover:text-orange-500/40 transition-colors">
                  04
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                  FINANCE
                </span>
              </div>
              <div className="mt-8 space-y-3">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase">
                  BẢNG LƯƠNG & PAYROLL
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Hạch toán thù lao ekip và đối soát tự động cuối tháng. Phân chia công thợ chính, thợ phụ, makeup artist rõ ràng, xuất phiếu lương minh bạch chỉ với 1 click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 05. BẢNG GIÁ (PRICING MATRIX - 3 CỘT NGANG)                           */}
      {/* ==================================================================== */}
      <section id="bang-gia" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050505]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header & Billing Cycle Switch */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
              // BẢNG GIÁ MINH BẠCH
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              Đầu Tư Đúng Vào Bộ Máy Vận Hành.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400">
              Chi phí chỉ tương đương 1 ly cà phê mỗi ngày để loại bỏ hoàn toàn rủi ro trùng lịch và rớt cọc.
            </p>

            {/* Toggle Switch Tháng / Năm */}
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex items-center p-1 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  THANH TOÁN THÁNG
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <span>THANH TOÁN NĂM</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 dark:text-orange-300 font-extrabold uppercase">
                    TIẾT KIỆM 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Horizontal Columns Grid on Desktop / Scrollable on Mobile */}
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-6 md:pb-0 snap-x snap-mandatory items-stretch">
            {/* ================= CARD 1: LENSY PORTAL ================= */}
            <div className="w-[85vw] sm:w-[360px] md:w-auto shrink-0 snap-center md:shrink p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase">
                    01. LENSY PORTAL
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black font-mono text-slate-950 dark:text-white">0đ</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">/ Miễn phí vĩnh viễn</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-zinc-900 font-mono text-xs text-slate-700 dark:text-zinc-300">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">MỤC TIÊU:</span>
                  Phù hợp Photographer cá nhân.
                </div>

                {/* Feature List */}
                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Giao ảnh online tối đa 10 show/tháng</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Cổng Client Proofing thả tim chọn ảnh</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Bàn giao file ảnh thương hiệu riêng</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400 dark:text-zinc-600">
                    <span>—</span>
                    <span>Không có CRM báo giá tự động</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400 dark:text-zinc-600">
                    <span>—</span>
                    <span>Không có Conflict Scanner thiết bị</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to={primaryCtaLink}
                  className="block w-full py-3.5 rounded-xl border border-slate-300 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-center text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white transition-all active:scale-95"
                >
                  Bắt Đầu Miễn Phí
                </Link>
              </div>
            </div>

            {/* ================= CARD 2: LENSY SOLO ================= */}
            <div className="w-[85vw] sm:w-[360px] md:w-auto shrink-0 snap-center md:shrink p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-500 dark:text-zinc-400 uppercase">
                    02. LENSY SOLO
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black font-mono text-slate-950 dark:text-white">
                      {billingCycle === 'monthly' ? '99.000đ' : '79.000đ'}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">/tháng</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-[11px] font-mono text-orange-600 dark:text-orange-400">
                      Thanh toán 948.000đ/năm (tiết kiệm 20%)
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-zinc-900 font-mono text-xs text-slate-700 dark:text-zinc-300">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">MỤC TIÊU:</span>
                  Phù hợp Freelancer chuyên nghiệp.
                </div>

                {/* Feature List */}
                <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Toàn bộ tính năng Lensy Portal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Full CRM Báo giá động & nhận cọc VietQR</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Kanban 5 bước quy trình sản xuất</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>01 Tài khoản quản trị độc lập</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400 dark:text-zinc-600">
                    <span>—</span>
                    <span>Không có phân quyền bảng lương ekip</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to={primaryCtaLink}
                  className="block w-full py-3.5 rounded-xl border border-slate-300 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-center text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white transition-all active:scale-95"
                >
                  Bắt Đầu Với Lensy Solo
                </Link>
              </div>
            </div>

            {/* ================= CARD 3: LENSY STUDIO (NỔI BẬT NHẤT) ================= */}
            <div className="w-[85vw] sm:w-[360px] md:w-auto shrink-0 snap-center md:shrink p-8 rounded-2xl border-2 border-orange-500 bg-white dark:bg-zinc-900/90 shadow-xl shadow-orange-500/10 flex flex-col justify-between relative">
              {/* Highlight Badge */}
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-orange-600 text-white font-mono text-[10px] font-black uppercase tracking-widest shadow-md">
                BÁN CHẠY NHẤT
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
                    03. LENSY STUDIO
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black font-mono text-slate-950 dark:text-white">
                      {billingCycle === 'monthly' ? '179.000đ' : '143.000đ'}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">/tháng</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">
                      Thanh toán 1.718.000đ/năm (tiết kiệm 20%)
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 font-mono text-xs text-orange-700 dark:text-orange-300">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">MỤC TIÊU:</span>
                  Phù hợp Studio đội ngũ & quy mô lớn.
                </div>

                {/* Feature List */}
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-mono">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span>Toàn bộ tính năng của gói Solo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span>Full ERP Studio: Tính ROI hoàn vốn thiết bị</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span>Conflict Scanner 2.0 chống trùng lịch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span>Bảng lương & tự động đối soát thù lao ekip</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">✓</span>
                    <span>Tối đa 05 tài khoản thành viên ekip</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to={primaryCtaLink}
                  className="block w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-center text-xs font-mono font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-600/25 transition-all active:scale-95"
                >
                  Dùng Thử Miễn Phí 30 Ngày
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 06. CHỨNG THỰC (SOCIAL PROOF)                                         */}
      {/* ==================================================================== */}
      <section id="bao-chung" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <span className="text-[11px] font-mono font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
            // BẢO CHỨNG THỰC CHIẾN
          </span>

          <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
            “Hệ thống giúp MIRMIA Studio chấm dứt hoàn toàn lỗi trùng lịch thiết bị và tự động hóa khâu thu công nợ.”
          </blockquote>

          <div className="pt-2 space-y-1">
            <p className="text-base font-bold text-slate-950 dark:text-white">
              Hồ Hoàng Long
            </p>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Founder — MIRMIA Studio & Academy
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 07. MINIMALIST FOOTER                                                */}
      {/* ==================================================================== */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#050505] text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-slate-950 dark:text-white">LENSY CRM</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-600">·</span>
              <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-500">
                STUDIO OPERATING SYSTEM
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">
              Bản quyền © 2026 Lensy CRM. Phát triển bởi Mirmia Studio & Academy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            <Link to="/book/johnnylongho" className="hover:text-orange-500 transition-colors">
              Cổng Đặt Lịch Mẫu
            </Link>
            <a href="#bang-gia" className="hover:text-orange-500 transition-colors">
              Bảng Giá
            </a>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ● HỆ THỐNG TRỰC TUYẾN 99.9%
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
