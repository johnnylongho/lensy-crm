import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // 1. Kiểm tra trạng thái xác thực
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono tracking-widest uppercase">
          Khởi động Lensy CRM...
        </p>
      </div>
    );
  }

  // 2. Nếu đã đăng nhập -> Chuyển hướng trực tiếp vào Dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* ==================================================================== */}
      {/* 1. TOP NAVIGATION BAR (KHÔNG SỬ DỤNG BẤT KỲ ICON NÀO)                 */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Brand Typography */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              LENSY <span className="text-orange-500">CRM</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900">
              Studio OS
            </span>
          </Link>

          {/* Quick Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-slate-600 dark:text-zinc-400">
            <a href="#pain-points" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Giải Pháp
            </a>
            <a href="#features" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Tính Năng Cốt Lõi
            </a>
            <a href="#social-proof" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Thực Chiến
            </a>
            <a href="#pricing" className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Biểu Giá
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Minimalist Theme Text Toggle (Không dùng icon) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer"
              title="Chuyển đổi giao diện Sáng / Tối"
            >
              {isDark ? 'LIGHT MODE' : 'DARK MODE'}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 transition-colors"
            >
              Đăng Nhập
            </Link>

            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-xs transition-all tracking-wide cursor-pointer"
            >
              Trải Nghiệm Miễn Phí
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION: TYPOGRAPHY ĐỈNH CAO & THUYẾT PHỤC                   */}
      {/* ==================================================================== */}
      <section className="relative px-4 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 max-w-6xl mx-auto text-center">
        {/* Sub-label định vị thương hiệu */}
        <div className="inline-block mb-6">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10">
            Hệ Điều Hành Quản Trị Studio & Nhiếp Ảnh Gia Chuyên Nghiệp
          </span>
        </div>

        {/* Headline chính */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.15] max-w-4xl mx-auto">
          Biến mỗi buổi chụp thành quy trình vận hành chính xác và lợi nhuận cao.
        </h1>

        {/* Phụ đề sắc nét */}
        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Tự động hóa toàn bộ luồng cọc ngân hàng SePAY, kiểm soát xung đột máy và nhân sự theo ngày giờ,
          bàn giao ảnh qua cổng Client Portal và đối soát thù lao ekip chỉ trong một nền tảng duy nhất.
        </p>

        {/* Nhóm nút CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-extrabold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/20 transition-all tracking-wide text-center cursor-pointer"
          >
            Trải Nghiệm Miễn Phí Ngay
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-700 transition-all text-center cursor-pointer"
          >
            Khám Phá Các Phân Hệ
          </a>
        </div>

        {/* Trust Badges Minimalist */}
        <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500">
          <span>Khởi tạo trong 60 giây</span>
          <span className="hidden sm:inline">•</span>
          <span>Không cần thẻ tín dụng</span>
          <span className="hidden sm:inline">•</span>
          <span>Thực chiến tại MIRMIA Studio</span>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. PAIN POINTS: 3 NỖI ĐAU THỰC TẾ & LỜI GIẢI TỪ LENSY CRM             */}
      {/* ==================================================================== */}
      <section id="pain-points" className="px-4 sm:px-8 py-16 sm:py-20 border-t border-slate-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 block mb-2">
              Khoảng Trống Vận Hành
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Những rủi ro âm thầm làm xói mòn lợi nhuận của studio nhiếp ảnh.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pain Point 01 */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-black text-orange-500 tracking-widest block">
                  VẤN ĐỀ 01
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  Trùng lịch thiết bị & Chồng chéo nhân sự
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Quản lý show qua sổ tay và tin nhắn rời rạc khiến 2 thợ chụp cùng lấy 1 body máy hoặc bị đụng lịch cùng giờ vào ngày cao điểm.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 block mb-1">
                  Giải pháp Lensy CRM:
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 leading-relaxed">
                  Conflict Scanner 2.0 quét tự động theo thời gian thực với buffer 60 phút, cảnh báo cứng khi trùng giờ và hỗ trợ phương án máy dự phòng.
                </p>
              </div>
            </div>

            {/* Pain Point 02 */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-black text-orange-500 tracking-widest block">
                  VẤN ĐỀ 02
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  Thất thoát tiền cọc & Khó đối soát thù lao
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Khách chuyển khoản nhưng quên chụp màn hình, studio quên ghi sổ và cuối tháng đau đầu tính tiền công cho thợ chụp, makeup, trợ lý.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 block mb-1">
                  Giải pháp Lensy CRM:
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 leading-relaxed">
                  Webhook ngân hàng SePAY tự động khớp cọc trong 3 giây. Phân hệ Payroll tính sẵn thù lao theo show và tất toán 1-chạm qua VietQR.
                </p>
              </div>
            </div>

            {/* Pain Point 03 */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-black text-orange-500 tracking-widest block">
                  VẤN ĐỀ 03
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  Tốn giờ tư vấn & Gửi link Drive thủ công
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Mỗi lần khách hỏi giá phải soạn lại hợp đồng, khách chọn ảnh retouch bằng cách nhắn số thứ tự qua Zalo gây nhầm lẫn file gốc.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 block mb-1">
                  Giải pháp Lensy CRM:
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 leading-relaxed">
                  Cổng báo giá và Client Portal thông minh cho phép khách lướt ảnh thả tim chọn retouch và tự động copy mã file cho thư viện Lightroom.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. CORE FEATURES: 3 TÍNH NĂNG CHỦ LỰC (ĐÁNH SỐ TRANG TRỌNG 01, 02, 03) */}
      {/* ==================================================================== */}
      <section id="features" className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 block mb-2">
            Năng Lực Cốt Lõi
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Ba trụ cột xây dựng tiêu chuẩn vận hành vượt trội.
          </h2>
        </div>

        <div className="space-y-12">
          {/* Feature 01 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-2xl sm:text-3xl font-mono font-black text-orange-500">
                01
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Thời Khóa Biểu Tuần & Điều Phối Tiến Độ Kanban
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
                Giao diện lưới giờ chuẩn xác từ 07:00 đến 18:00, phân nhóm theo 7 ngày trong tuần với cơ chế highlight hôm nay nổi bật. Thao tác kéo thả thẻ show mượt mà giữa các giai đoạn: Đặt cọc, Đã chụp, Đang retouch, Đã trả file.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Lưới Giờ 07:00 - 18:00</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Highlight Hôm Nay</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Lọc Theo Thợ Chụp</span>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400">
                <span>THỜI KHÓA BIỂU TUẦN NÀY</span>
                <span className="text-orange-500 font-bold">12 SHOWS ĐÃ XẾP LỊCH</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border-l-4 border-purple-500 border-y border-r border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Đám Cưới Minh & Thảo</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">08:00 - 12:00 • Phim Trường Quận 2</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">ĐÃ CỌC</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border-l-4 border-amber-500 border-y border-r border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Lookbook BST Thu Đông</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">14:00 - 18:00 • Studio Room A</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">ĐÃ CHỤP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-2xl sm:text-3xl font-mono font-black text-orange-500">
                02
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Cổng Khách Hàng Chọn Ảnh & Bàn Giao File Trực Tuyến
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
                Khách hàng nhận link riêng mang tên miền studio. Trải nghiệm lướt lưới ảnh preview siêu mượt, bấm thả tim chọn mã ảnh theo hạn mức của gói và khóa chốt danh sách. Hệ thống tự động chuyển trạng thái sang Đang hậu kỳ và cho phép sao chép mã file sang Lightroom trong 1 click.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Lưới Ảnh Visual Gallery</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Khóa Chốt Hạn Mức</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Xuất Mã Lightroom</span>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400">
                <span>CLIENT PROOFING PORTAL</span>
                <span className="text-emerald-500 font-bold">20 / 20 ẢNH ĐÃ CHỌN</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[10px]">
                  <span>DANH SÁCH MÃ FILE CHO LIGHTROOM:</span>
                  <span className="text-orange-500 font-bold">ĐÃ CHỐT CHỌN</span>
                </div>
                <p className="text-[11px] text-slate-900 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-950 p-2.5 rounded-lg break-all">
                  IMG_2041.JPG, IMG_2042.JPG, IMG_2048.JPG, IMG_2052.JPG, IMG_2060.JPG...
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-zinc-400 pt-1">
                  <span>Trạng thái: Khách đã xác nhận</span>
                  <span className="text-emerald-500 font-bold">Tự Động Nâng Cấp Tiến Độ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="text-2xl sm:text-3xl font-mono font-black text-orange-500">
                03
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Hạch Toán Chi Phí & Đối Soát Bảng Lương Ekip
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
                Mỗi buổi chụp đều được tính toán tự động: Doanh thu thực tế trừ đi thù lao Thợ chụp, Makeup, Hậu kỳ và chi phí thuê studio/di chuyển để hiển thị Lợi nhuận ròng chính xác. Hỗ trợ quyết toán toàn bộ công nợ nhân sự cuối tháng 1-chạm qua VietQR.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Công Thức Job Costing</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Lợi Nhuận Ròng Thực Tế</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">Quyết Toán VietQR</span>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400">
                <span>HẠCH TOÁN CHI PHÍ SHOW</span>
                <span className="text-emerald-500 font-bold">BIÊN LỢI NHUẬN: 68%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Doanh Thu Gói</span>
                  <span className="font-bold text-slate-900 dark:text-white">15.000.000 đ</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Thù Lao & Chi Phí</span>
                  <span className="font-bold text-rose-500">-4.800.000 đ</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Lợi Nhuận Ròng</span>
                  <span className="font-bold text-emerald-500">+10.200.000 đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. SOCIAL PROOF: TRÍCH DẪN THỰC CHIẾN TỪ MIRMIA STUDIO & ACADEMY      */}
      {/* ==================================================================== */}
      <section id="social-proof" className="px-4 sm:px-8 py-16 sm:py-20 border-y border-slate-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900/40">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 block">
            Bảo Chứng Thực Chiến
          </span>

          <blockquote className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-relaxed">
            "Từ khi ứng dụng Lensy CRM vào quy trình vận hành của studio và học viện, chúng tôi đã loại bỏ 100% tình trạng chồng chéo máy chụp, tăng tỷ lệ chuyển đổi cọc lên 45% nhờ hệ thống báo giá tự động và tiết kiệm hơn 15 giờ làm việc mỗi tuần cho đội ngũ quản lý."
          </blockquote>

          <div className="pt-4 space-y-1">
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              Ban Điều Hành Vận Hành
            </p>
            <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              MIRMIA Studio & Academy
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. PRICING TIERS: 2 GÓI CƯỚC MINH BẠCH                                */}
      {/* ==================================================================== */}
      <section id="pricing" className="px-4 sm:px-8 py-16 sm:py-24 max-w-5xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 block mb-2">
            Biểu Giá Minh Bạch
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Đầu tư xứng đáng cho sự chuyên nghiệp của studio.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Gói Solo Freelancer */}
          <div className="p-8 sm:p-9 rounded-3xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 block">
                DÀNH CHO CÁ NHÂN
              </span>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                Solo Freelancer
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Giải pháp toàn diện cho nhiếp ảnh gia hoạt động độc lập cần chuyên nghiệp hóa quy trình báo giá và giữ lịch.
              </p>
              <div className="pt-2">
                <span className="text-4xl font-black text-slate-950 dark:text-white font-mono">0 đ</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono ml-2">/ Miễn phí trọn đời</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Quản lý lịch chụp cá nhân</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Không giới hạn</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tạo báo giá trực tuyến chuyên nghiệp</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Có</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quét xung đột thiết bị cơ bản</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Có</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Theo dõi công nợ khách hàng</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Có</span>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl text-center text-xs font-extrabold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white transition-all cursor-pointer block"
            >
              Bắt Đầu Miễn Phí
            </Link>
          </div>

          {/* Gói Studio Pro */}
          <div className="p-8 sm:p-9 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-orange-500 shadow-xl shadow-orange-500/10 flex flex-col justify-between space-y-8 relative">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full bg-orange-500 text-white shadow-xs">
                PHỔ BIẾN NHẤT
              </span>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-500 block">
                DÀNH CHO DOANH NGHIỆP
              </span>
              <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                Studio Pro
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Tối ưu hóa vận hành cho các studio ảnh cưới, lookbook và baby có đội ngũ ê-kíp đông đảo cần phân quyền chặt chẽ.
              </p>
              <div className="pt-2">
                <span className="text-4xl font-black text-slate-950 dark:text-white font-mono">299.000 đ</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono ml-2">/ tháng</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Toàn bộ tính năng gói Freelancer</span>
                <span className="font-mono text-emerald-500 font-bold">Đầy đủ</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phân quyền RBAC 3 tầng (Manager, Member, Solo)</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Không giới hạn</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Webhook ngân hàng SePAY chốt cọc 2 chiều</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Tự động 100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cổng khách hàng chọn ảnh (Client Proofing Portal)</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Có</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quản lý bảng lương & Quyết toán VietQR 1-chạm</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Có</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bộ quét xung đột Conflict Scanner 2.0 có buffer</span>
                <span className="font-mono text-slate-950 dark:text-white font-bold">Chính xác</span>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl text-center text-xs font-extrabold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer block tracking-wide"
            >
              Nâng Cấp Studio Pro
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. BOTTOM CALL TO ACTION & FOOTER                                    */}
      {/* ==================================================================== */}
      <section className="px-4 sm:px-8 py-16 sm:py-20 bg-slate-900 text-white dark:bg-black text-center border-t border-slate-800">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400 block">
            Bắt Đầu Ngay Hôm Nay
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Sẵn sàng nâng tầm tiêu chuẩn vận hành cho studio của bạn?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Hơn hàng trăm buổi chụp đã được Lensy CRM bảo vệ an toàn khỏi trùng máy, thất thoát cọc và chậm tiến độ.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-block px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer tracking-wide"
            >
              Khởi Tạo Không Gian Làm Việc Ngay
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-8 py-8 border-t border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-950 dark:text-white">LENSY CRM</span> — Hệ thống quản trị chuyên sâu cho ngành nhiếp ảnh thương mại.
          </div>
          <div className="font-mono text-[11px]">
            Powered by Lensy - Developed by Mirmia Studio & Academy
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
