import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type BillingCycle = 'monthly' | 'yearly';
export type QuotaTier = 'starter' | 'growth' | 'pro' | 'unlimited';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // State quản lý Bảng giá tương tác đa chiều
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [quotaTier, setQuotaTier] = useState<QuotaTier>('starter');

  // Xác định đường dẫn và chữ hiển thị của nút CTA chính theo trạng thái đăng nhập
  const primaryCtaLink = user ? '/dashboard' : '/login';
  const primaryCtaText = user ? 'Vào Bảng Điều Khiển' : 'Bắt Đầu Miễn Phí Ngay';
  const headerCtaText = user ? 'Vào Bảng Điều Khiển' : 'Đăng Nhập / Dùng Thử';

  // Dữ liệu bảng giá theo từng Mức Quy Mô Vận Hành (Studio Scale Selector)
  const pricingMatrix = {
    starter: {
      albumLimitLabel: '10 Show / tháng',
      isAdvancedUnlocked: false,
      col1: {
        title: 'LENSY PORTAL',
        desc: 'Dành cho Photographer chỉ cần Cổng khách hàng thả tim chọn ảnh & bàn giao file thương hiệu riêng.',
        price: '0 đ',
        periodText: 'Miễn phí vĩnh viễn',
        origPrice: null,
        yearlyNote: null,
        cta: 'Bắt Đầu Miễn Phí',
      },
      col2: {
        title: 'LENSY SOLO CRM',
        desc: 'Dành cho Freelancer độc lập: Full hệ thống Báo giá động, Nhận cọc VietQR SePAY, Kanban 5 bước, Hạch toán lợi nhuận ròng, 01 thành viên.',
        monthly: {
          price: '99.000 đ',
          origPrice: '119.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '990.000 đ',
          origPrice: '1.190.000 đ',
          periodText: '/năm',
          note: '= 83.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Bắt đầu với Lensy Solo CRM',
      },
      col3: {
        title: 'LENSY STUDIO COMMAND',
        desc: 'Dành cho Studio có đội ngũ: Toàn bộ CRM Solo + Quản lý kho thiết bị & ROI hoàn vốn, Conflict Scanner 2.0 và Bảng lương Ekip, 05 thành viên.',
        badge: 'ĐƯỢC CHỌN NHIỀU NHẤT',
        monthly: {
          price: '179.000 đ',
          origPrice: '219.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '1.790.000 đ',
          origPrice: '2.190.000 đ',
          periodText: '/năm',
          note: '= 149.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Dùng thử miễn phí 30 ngày',
      },
    },
    growth: {
      albumLimitLabel: '30 Show / tháng',
      isAdvancedUnlocked: true,
      col1: {
        title: 'LENSY PORTAL',
        desc: 'Dành cho Photographer chỉ cần Cổng khách hàng thả tim chọn ảnh & bàn giao file thương hiệu riêng.',
        monthly: {
          price: '49.000 đ',
          origPrice: '59.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '478.000 đ',
          origPrice: '598.000 đ',
          periodText: '/năm',
          note: '= 40.000 đ/tháng · tiết kiệm 19%',
        },
        cta: 'Bắt đầu với Lensy Portal',
      },
      col2: {
        title: 'LENSY SOLO CRM',
        desc: 'Dành cho Freelancer độc lập: Full hệ thống Báo giá động, Nhận cọc VietQR SePAY, Kanban 5 bước, Hạch toán lợi nhuận ròng, 01 thành viên.',
        monthly: {
          price: '148.000 đ',
          origPrice: '178.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '1.468.000 đ',
          origPrice: '1.788.000 đ',
          periodText: '/năm',
          note: '= 122.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Bắt đầu với Lensy Solo CRM',
      },
      col3: {
        title: 'LENSY STUDIO COMMAND',
        desc: 'Dành cho Studio có đội ngũ: Toàn bộ CRM Solo + Quản lý kho thiết bị & ROI hoàn vốn, Conflict Scanner 2.0 và Bảng lương Ekip, 05 thành viên.',
        badge: 'ĐƯỢC CHỌN NHIỀU NHẤT',
        monthly: {
          price: '228.000 đ',
          origPrice: '278.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '2.268.000 đ',
          origPrice: '2.788.000 đ',
          periodText: '/năm',
          note: '= 189.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Dùng thử miễn phí 30 ngày',
      },
    },
    pro: {
      albumLimitLabel: '50 Show / tháng',
      isAdvancedUnlocked: true,
      col1: {
        title: 'LENSY PORTAL',
        desc: 'Dành cho Photographer chỉ cần Cổng khách hàng thả tim chọn ảnh & bàn giao file thương hiệu riêng.',
        monthly: {
          price: '69.000 đ',
          origPrice: '84.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '678.000 đ',
          origPrice: '838.000 đ',
          periodText: '/năm',
          note: '= 57.000 đ/tháng · tiết kiệm 18%',
        },
        cta: 'Bắt đầu với Lensy Portal',
      },
      col2: {
        title: 'LENSY SOLO CRM',
        desc: 'Dành cho Freelancer độc lập: Full hệ thống Báo giá động, Nhận cọc VietQR SePAY, Kanban 5 bước, Hạch toán lợi nhuận ròng, 01 thành viên.',
        monthly: {
          price: '168.000 đ',
          origPrice: '203.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '1.668.000 đ',
          origPrice: '2.028.000 đ',
          periodText: '/năm',
          note: '= 139.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Bắt đầu với Lensy Solo CRM',
      },
      col3: {
        title: 'LENSY STUDIO COMMAND',
        desc: 'Dành cho Studio có đội ngũ: Toàn bộ CRM Solo + Quản lý kho thiết bị & ROI hoàn vốn, Conflict Scanner 2.0 và Bảng lương Ekip, 05 thành viên.',
        badge: 'ĐƯỢC CHỌN NHIỀU NHẤT',
        monthly: {
          price: '248.000 đ',
          origPrice: '303.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '2.468.000 đ',
          origPrice: '3.028.000 đ',
          periodText: '/năm',
          note: '= 206.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Dùng thử miễn phí 30 ngày',
      },
    },
    unlimited: {
      albumLimitLabel: 'Không giới hạn',
      isAdvancedUnlocked: true,
      col1: {
        title: 'LENSY PORTAL',
        desc: 'Dành cho Photographer chỉ cần Cổng khách hàng thả tim chọn ảnh & bàn giao file thương hiệu riêng.',
        monthly: {
          price: '89.000 đ',
          origPrice: '109.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '878.000 đ',
          origPrice: '1.090.000 đ',
          periodText: '/năm',
          note: '= 73.000 đ/tháng · tiết kiệm 18%',
        },
        cta: 'Bắt đầu với Lensy Portal',
      },
      col2: {
        title: 'LENSY SOLO CRM',
        desc: 'Dành cho Freelancer độc lập: Full hệ thống Báo giá động, Nhận cọc VietQR SePAY, Kanban 5 bước, Hạch toán lợi nhuận ròng, 01 thành viên.',
        monthly: {
          price: '188.000 đ',
          origPrice: '228.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '1.868.000 đ',
          origPrice: '2.280.000 đ',
          periodText: '/năm',
          note: '= 156.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Bắt đầu với Lensy Solo CRM',
      },
      col3: {
        title: 'LENSY STUDIO COMMAND',
        desc: 'Dành cho Studio có đội ngũ: Toàn bộ CRM Solo + Quản lý kho thiết bị & ROI hoàn vốn, Conflict Scanner 2.0 và Bảng lương Ekip, 05 thành viên.',
        badge: 'ĐƯỢC CHỌN NHIỀU NHẤT',
        monthly: {
          price: '268.000 đ',
          origPrice: '328.000 đ',
          periodText: '/tháng',
          note: null,
        },
        yearly: {
          price: '2.668.000 đ',
          origPrice: '3.280.000 đ',
          periodText: '/năm',
          note: '= 222.000 đ/tháng · tiết kiệm 17%',
        },
        cta: 'Dùng thử miễn phí 30 ngày',
      },
    },
  };

  const currentTab = pricingMatrix[quotaTier];

  // Helper render giá cho từng cột
  const renderPriceBlock = (colData: any) => {
    // Trường hợp gói Free ở mức 'starter' (giá 0 đ vĩnh viễn)
    if (colData.periodText && !colData.monthly && !colData.yearly) {
      return (
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-mono font-black text-slate-950 dark:text-white">
              {colData.price}
            </span>
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            {colData.periodText}
          </p>
        </div>
      );
    }

    const priceInfo = billingCycle === 'monthly' ? colData.monthly : colData.yearly;
    return (
      <div className="space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl sm:text-4xl font-mono font-black text-slate-950 dark:text-white">
            {priceInfo.price}
          </span>
          {priceInfo.origPrice && (
            <span className="text-xs sm:text-sm font-mono text-slate-400 dark:text-zinc-600 line-through">
              {priceInfo.origPrice}
            </span>
          )}
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            {priceInfo.periodText}
          </span>
        </div>
        {priceInfo.note && (
          <p className="text-[11px] font-mono font-semibold text-orange-600 dark:text-orange-400">
            {priceInfo.note}
          </p>
        )}
      </div>
    );
  };

  const scaleOptions: { key: QuotaTier; label: string }[] = [
    { key: 'starter', label: 'Khởi Đầu (10 Show/tháng)' },
    { key: 'growth', label: 'Tăng Trưởng (30 Show/tháng)' },
    { key: 'pro', label: 'Chuyên Nghiệp (50 Show/tháng)' },
    { key: 'unlimited', label: 'Không Giới Hạn (Unlimited)' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-950 dark:text-white flex flex-col font-sans selection:bg-orange-600 selection:text-white transition-colors duration-200">
      {/* ==================================================================== */}
      {/* PHẦN A: HEADER NAVIGATION (STRICT NO-ICON)                           */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand Typography */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Lensy
            </span>
            <span className="border border-orange-500 text-orange-600 dark:text-orange-400 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              CRM
            </span>
            <span className="hidden sm:inline-block text-[9px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-500 border-l border-slate-300 dark:border-zinc-800 pl-2.5">
              BY MIRMIA STUDIO
            </span>
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            <a
              href="#pain-points"
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Giải Pháp
            </a>
            <a
              href="#features"
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Tính Năng
            </a>
            <a
              href="#pricing"
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Bảng Giá
            </a>
          </nav>

          {/* Actions: Theme Toggle + Demo Link + CTA */}
          <div className="flex items-center gap-3">
            {/* Pure text Theme Switcher (No icon) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="text-[11px] font-mono font-bold tracking-wide px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer"
              title="Chuyển đổi giao diện Sáng / Tối"
            >
              {isDark ? 'Giao diện: Sáng' : 'Giao diện: Tối'}
            </button>

            {/* Xem Demo */}
            <Link
              to="/book/johnnylongho"
              className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 px-2 py-1.5 transition-colors"
            >
              Xem Demo
            </Link>

            {/* Primary CTA Header */}
            <Link
              to={primaryCtaLink}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all tracking-wide cursor-pointer text-center"
            >
              {headerCtaText}
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* PHẦN B: HERO SECTION                                                */}
      {/* ==================================================================== */}
      <section className="relative px-4 sm:px-8 pt-16 sm:pt-24 pb-16 sm:pb-20 max-w-6xl mx-auto text-center">
        {/* Brand Label */}
        <div className="inline-block mb-6">
          <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10">
            NỀN TẢNG QUẢN TRỊ STUDIO & ĐẶT LỊCH NHIẾP ẢNH CHUYÊN NGHIỆP
          </span>
        </div>

        {/* Headline H1 */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.15] max-w-5xl mx-auto">
          Quản Lý Lịch Chụp, Dòng Tiền Và Thiết Bị.
          <span className="block mt-2 text-orange-600 dark:text-orange-400">
            Chuẩn Xác Tuyệt Đối. Tự Động Hóa Toàn Diện.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
          Chấm dứt tình trạng trùng lịch máy móc, thất thoát tiền cọc hay rối loạn bảng lương ekip. Lensy CRM giúp Freelancer và Studio tự động hóa từ khâu gửi báo giá, nhận cọc VietQR 3 giây, quét xung đột thiết bị đến cổng khách hàng chọn ảnh trực tuyến.
        </p>

        {/* CTA Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={primaryCtaLink}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition-all tracking-wide text-center cursor-pointer"
          >
            {primaryCtaText}
          </Link>

          <Link
            to="/book/johnnylongho"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 hover:border-orange-500 dark:hover:border-orange-500 transition-all text-center cursor-pointer"
          >
            Trải Nghiệm Cổng Đặt Lịch Mẫu
          </Link>
        </div>

        {/* Real-world Metrics Strip (4 Columns Typography) */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <span className="text-2xl sm:text-3xl font-mono font-black text-orange-600 dark:text-orange-400 tracking-tight block">
              03 GIÂY
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Tự động xác nhận tiền cọc qua VietQR & SePAY Webhook
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <span className="text-2xl sm:text-3xl font-mono font-black text-slate-950 dark:text-white tracking-tight block">
              60 PHÚT
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Độ trễ đệm an toàn trong thuật toán quét trùng lịch thiết bị & nhân sự
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <span className="text-2xl sm:text-3xl font-mono font-black text-orange-600 dark:text-orange-400 tracking-tight block">
              100%
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Minh bạch hóa lợi nhuận ròng (Net Profit) và tiến độ hoàn vốn máy móc (ROI)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800">
            <span className="text-2xl sm:text-3xl font-mono font-black text-slate-950 dark:text-white tracking-tight block">
              05 BƯỚC
            </span>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Quy trình Kanban chuẩn ngành ảnh từ lúc khách mới hỏi đến khi trả file
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PHẦN C: NỖI ĐAU & GIẢI PHÁP (PAIN POINTS COMPARISON - #pain-points)  */}
      {/* ==================================================================== */}
      <section
        id="pain-points"
        className="px-4 sm:px-8 py-16 sm:py-24 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="max-w-3xl">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block mb-2">
              ĐỐI CHIẾU HIỆU SUẤT VẬN HÀNH
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Sự Khác Biệt Giữa Vận Hành Thủ Công Và Hệ Sinh Thái Lensy CRM
            </h2>
          </div>

          {/* 3-Column Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Cột 01 */}
            <div className="p-7 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                  01
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  Tư Vấn & Giữ Lịch
                </h3>

                {/* Khối thủ công */}
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    THỦ CÔNG TRUYỀN THỐNG
                  </span>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Nhắn tin báo giá rời rạc qua Zalo, khách xem xong im lặng, quên thu cọc dẫn đến hủy show sát ngày.
                  </p>
                </div>

                {/* Khối Lensy */}
                <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                    CƠ CHẾ LENSY CRM
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 leading-relaxed">
                    Gửi 01 đường link báo giá động duy nhất. Khách tự chọn gói, quét mã VietQR đặt cọc 30% và hệ thống tự động khóa lịch.
                  </p>
                </div>
              </div>
            </div>

            {/* Cột 02 */}
            <div className="p-7 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                  02
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  Điều Phối Thiết Bị & Nhân Sự
                </h3>

                {/* Khối thủ công */}
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    THỦ CÔNG TRUYỀN THỐNG
                  </span>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Ghi chép sổ tay hoặc Excel, thường xuyên đụng lịch Body máy ảnh, ống kính hoặc trùng giờ Thợ chụp / Thợ Makeup vào mùa cưới.
                  </p>
                </div>

                {/* Khối Lensy */}
                <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                    CƠ CHẾ LENSY CRM
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 leading-relaxed">
                    Bộ quét Conflict Scanner 2.0 kiểm tra giao thoa khung giờ thực tế, cảnh báo đỏ ngay khi phân bổ trùng thiết bị hoặc nhân sự.
                  </p>
                </div>
              </div>
            </div>

            {/* Cột 03 */}
            <div className="p-7 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                  03
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  Dòng Tiền, Công Nợ & Bảng Lương
                </h3>

                {/* Khối thủ công */}
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    THỦ CÔNG TRUYỀN THỐNG
                  </span>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    Giao ảnh xong quên thu nốt 70% công nợ còn lại; cuối tháng mất hàng giờ cộng sổ tính lương cho từng thợ chụp, makeup, retoucher.
                  </p>
                </div>

                {/* Khối Lensy */}
                <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                    CƠ CHẾ LENSY CRM
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200 leading-relaxed">
                    Tự động cảnh báo nợ đọng trên thẻ Kanban, tích hợp Cổng khách hàng quyết toán trước khi tải ảnh và đối soát lương Ekip bằng VietQR 1 chạm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PHẦN D: 04 PHÂN HỆ CỐT LÕI (CORE ARCHITECTURE - #features)           */}
      {/* ==================================================================== */}
      <section id="features" className="px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto space-y-16">
        <div className="max-w-3xl">
          <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block mb-2">
            KIẾN TRÚC VẬN HÀNH TOÀN DIỆN
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Bốn Phân Hệ Cốt Lõi Kiến Tạo Tiêu Chuẩn Studio 5 Sao
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            Mỗi module được thiết kế chuyên biệt dựa trên kinh nghiệm vận hành thực tế tại MIRMIA Studio & Academy.
          </p>
        </div>

        {/* 2x2 Grid with huge 01, 02, 03, 04 numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Phân hệ 01 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-4xl sm:text-5xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                01
              </span>
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-950 dark:text-white">
                QUẢN TRỊ TIẾN ĐỘ KANBAN & CRM KHÁCH HÀNG
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Theo dõi trực quan 5 cột trạng thái (Mới hỏi, Đã cọc, Đã chụp, Đang sửa ảnh, Hoàn tất), tự động tính Giá trị trọn đời khách hàng (LTV) và tích hợp mẫu nhắc lịch/nhắc nợ Zalo.
              </p>
            </div>

            {/* Typography Minimalist Data Chips & Box */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  5 CỘT KANBAN CHUẨN
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  TÍNH LTV TỰ ĐỘNG
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  NHẮC LỊCH ZALO 1-CHẠM
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[10px]">
                  <span>HÔM NAY · 3 SHOW ĐANG CHẠY</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">KANBAN REAL-TIME</span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-zinc-200">
                  Mới hỏi (1) — Đã cọc 30% (2) — Đang sửa ảnh (4) — Hoàn tất (18)
                </div>
              </div>
            </div>
          </div>

          {/* Phân hệ 02 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-4xl sm:text-5xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                02
              </span>
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-950 dark:text-white">
                CONFLICT SCANNER 2.0 & KHẤU HAO THIẾT BỊ (ROI)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Quản lý danh mục máy ảnh, ống kính, đèn flash. Tự động chặn lưu khi trùng thiết bị cùng khung giờ và đo lường chính xác phần trăm hoàn vốn trên từng thiết bị đầu tư.
              </p>
            </div>

            {/* Typography Minimalist Data Chips & Box */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  BUFFER 60 PHÚT AN TOÀN
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  CHẶN XUNG ĐỘT REAL-TIME
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  ĐO LƯỜNG HOÀN VỐN ROI
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[10px]">
                  <span>SONY ALPHA 7 IV · ROI: 74.2%</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 XUNG ĐỘT TUẦN NÀY</span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-zinc-200">
                  Khấu hao: 350.000 đ/show · Đệm thời gian an toàn: 60 phút
                </div>
              </div>
            </div>
          </div>

          {/* Phân hệ 03 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-4xl sm:text-5xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                03
              </span>
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-950 dark:text-white">
                CỔNG KHÁCH HÀNG CHỌN ẢNH (CLIENT PROOFING PORTAL)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Nén ảnh xem trước siêu tốc ngay trên trình duyệt, khách hàng thả tim chọn ảnh retouch trực tuyến, xuất chuỗi mã file đồng bộ thẳng vào bộ lọc Lightroom chỉ với 1 lần sao chép.
              </p>
            </div>

            {/* Typography Minimalist Data Chips & Box */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  NÉN ẢNH TRÊN TRÌNH DUYỆT
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  THẢ TIM CHỌN ẢNH
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  XUẤT MÃ LIGHTROOM 1-CHẠM
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[10px]">
                  <span>MÃ FILE ĐÃ CHỐT (20/20 ẢNH)</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">ĐỒNG BỘ 1 CHẠM</span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-zinc-200 truncate">
                  IMG_4012, IMG_4019, IMG_4024, IMG_4050, IMG_4068, IMG_4091...
                </div>
              </div>
            </div>
          </div>

          {/* Phân hệ 04 */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-4xl sm:text-5xl font-mono font-black text-orange-600 dark:text-orange-400 block">
                04
              </span>
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-950 dark:text-white">
                HẠCH TOÁN JOB COSTING & BẢNG LƯƠNG EKIP (PAYROLL)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Tự động khấu trừ chi phí phát sinh và thù lao nhân sự (theo % gói hoặc số tiền cố định) để tính Tiền thật bỏ túi (Net Profit) trên từng show chụp.
              </p>
            </div>

            {/* Typography Minimalist Data Chips & Box */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  NET PROFIT THỰC TẾ
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  TÍNH THÙ LAO THEO SHOW
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  QUYẾT TOÁN VIETQR 1-CHẠM
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[10px]">
                  <span>DOANH THU: 12.000.000 đ</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">BIÊN LỢI NHUẬN: 68.3%</span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-zinc-200">
                  Thù lao Ekip: -3.800.000 đ — Lợi nhuận ròng: +8.200.000 đ
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PHẦN E: BẢNG GIÁ LENSY EDITORIAL BENTO (#pricing)                   */}
      {/* ==================================================================== */}
      <section
        id="pricing"
        className="px-4 sm:px-8 py-16 sm:py-24 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40"
      >
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block">
              BIỂU PHÍ ĐẦU TƯ MINH BẠCH
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Định Giá Linh Hoạt Theo Quy Mô Vận Hành Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Không giới hạn tiềm năng sáng tạo. Chọn mức quy mô phù hợp và mở rộng tức thì khi mùa cưới cao điểm.
            </p>
          </div>

          {/* LENSY COMMAND BAR: Studio Scale Selector & Billing Cycle Toggle */}
          <div className="max-w-4xl mx-auto rounded-2xl bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
            {/* Segmented Control: Quy mô vận hành (Studio Scale Selector) */}
            <div className="flex items-center gap-1.5 flex-1">
              <span className="hidden lg:inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 px-2 shrink-0">
                QUY MÔ:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full bg-white/60 dark:bg-zinc-950/60 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                {scaleOptions.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setQuotaTier(opt.key)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center truncate ${
                      quotaTier === opt.key
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Segmented Control: Chu kỳ thanh toán (Billing Cycle) */}
            <div className="flex items-center justify-center shrink-0">
              <div className="inline-flex items-center gap-1 bg-white/60 dark:bg-zinc-950/60 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-zinc-950 text-white dark:bg-zinc-800 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  Theo Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-zinc-950 text-white dark:bg-zinc-800 shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <span>Theo Năm</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white uppercase tracking-wider">
                    -20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 CỘT GÓI CƯỚC THEO PHONG CÁCH EDITORIAL BENTO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
            {/* CỘT 01: LENSY PORTAL */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-mono font-black text-orange-600 dark:text-orange-400">
                      01
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800">
                      CLIENT PROOFING
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                    {currentTab.col1.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                    {currentTab.col1.desc}
                  </p>
                </div>

                {renderPriceBlock(currentTab.col1)}

                <Link
                  to={primaryCtaLink}
                  className="w-full py-3 rounded-xl text-center text-xs font-bold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 text-slate-900 dark:text-white transition-all cursor-pointer block"
                >
                  {user ? 'Vào Bảng Điều Khiển' : currentTab.col1.cta}
                </Link>

                {/* Danh sách tính năng Cột 01 */}
                <div className="space-y-5 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs">
                  {/* Nhóm 1: CRM & Dòng tiền (Cột 01 Không có) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-600 block">
                      QUẢN LÝ STUDIO (CRM & DÒNG TIỀN)
                    </span>
                    <ul className="space-y-2 text-slate-400 dark:text-zinc-600">
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Dashboard tổng quan & Biểu đồ lợi nhuận ròng</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quản lý lịch hẹn & Bảng tiến độ Kanban 5 bước</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Báo giá động & Nhận cọc VietQR tự động (SePAY)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quản lý hồ sơ khách hàng (CRM & phân hạng VIP)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Hạch toán chi phí show (Job Costing) & Nhắc nợ Zalo</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nhóm 2: Điều phối chuyên sâu (Cột 01 Không có) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-600 block">
                      CÔNG CỤ ĐIỀU PHỐI STUDIO CHUYÊN SÂU
                    </span>
                    <ul className="space-y-2 text-slate-400 dark:text-zinc-600">
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Bảng phân công nhân sự (Thợ chụp, Makeup, Hậu kỳ)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quản lý bảng lương Ekip & Quyết toán VietQR</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quản lý kho thiết bị & Đo lường hoàn vốn (ROI)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quét trùng lịch thiết bị & nhân sự (Conflict Scanner 2.0)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Báo cáo tổng hợp, nhập/xuất dữ liệu CSV & Google Sheets</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nhóm 3: Client Portal (Cột 01 Có) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      CỔNG KHÁCH CHỌN ẢNH & BÀN GIAO (CLIENT PORTAL)
                    </span>
                    <ul className="space-y-2 text-slate-700 dark:text-zinc-300">
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Cổng khách hàng thả tim chọn ảnh trực tuyến</span>
                      </li>
                      <li className="flex items-start justify-between">
                        <div className="flex items-start">
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                          <span>Hạn mức show tạo mới mỗi tháng</span>
                        </div>
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 ml-2">
                          {currentTab.albumLimitLabel}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Xuất nhanh mã file ảnh chọn cho Lightroom Library</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Bàn giao link tải ảnh & Thu hồi công nợ cuối kỳ</span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Chọn ảnh theo bộ sưu tập & ghi chú từng ảnh
                        </span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Đổi thương hiệu & Logo Studio riêng
                        </span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Liên kết đặt lịch cá nhân hóa theo Slug Studio
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT 02: LENSY SOLO CRM */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-mono font-black text-orange-600 dark:text-orange-400">
                      02
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                      FREELANCER SOLO
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                    {currentTab.col2.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                    {currentTab.col2.desc}
                  </p>
                </div>

                {renderPriceBlock(currentTab.col2)}

                <Link
                  to={primaryCtaLink}
                  className="w-full py-3 rounded-xl text-center text-xs font-bold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 text-slate-900 dark:text-white transition-all cursor-pointer block"
                >
                  {user ? 'Vào Bảng Điều Khiển' : currentTab.col2.cta}
                </Link>

                {/* Danh sách tính năng Cột 02 */}
                <div className="space-y-5 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs">
                  {/* Nhóm 1: CRM & Dòng tiền (Cột 02 Có) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      QUẢN LÝ STUDIO (CRM & DÒNG TIỀN)
                    </span>
                    <ul className="space-y-2 text-slate-700 dark:text-zinc-300">
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Dashboard tổng quan & Biểu đồ lợi nhuận ròng</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Quản lý lịch hẹn & Bảng tiến độ Kanban 5 bước</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Báo giá động & Nhận cọc VietQR tự động (SePAY)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Quản lý hồ sơ khách hàng (CRM & phân hạng VIP)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Hạch toán chi phí show (Job Costing) & Nhắc nợ Zalo</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nhóm 2: Điều phối chuyên sâu (Cột 02 Không có) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-600 block">
                      CÔNG CỤ ĐIỀU PHỐI STUDIO CHUYÊN SÂU
                    </span>
                    <ul className="space-y-2 text-slate-400 dark:text-zinc-600">
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Bảng phân công nhân sự (Thợ chụp, Makeup, Hậu kỳ)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quản lý bảng lương Ekip & Quyết toán VietQR</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quản lý kho thiết bị & Đo lường hoàn vốn (ROI)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Quét trùng lịch thiết bị & nhân sự (Conflict Scanner 2.0)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-mono font-bold mr-2 text-slate-400 dark:text-zinc-600">—</span>
                        <span>Báo cáo tổng hợp, nhập/xuất dữ liệu CSV & Google Sheets</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nhóm 3: Client Portal (Cột 02 Có) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      CỔNG KHÁCH CHỌN ẢNH & BÀN GIAO (CLIENT PORTAL)
                    </span>
                    <ul className="space-y-2 text-slate-700 dark:text-zinc-300">
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Cổng khách hàng thả tim chọn ảnh trực tuyến</span>
                      </li>
                      <li className="flex items-start justify-between">
                        <div className="flex items-start">
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                          <span>Hạn mức show tạo mới mỗi tháng</span>
                        </div>
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 ml-2">
                          {currentTab.albumLimitLabel}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Xuất nhanh mã file ảnh chọn cho Lightroom Library</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Bàn giao link tải ảnh & Thu hồi công nợ cuối kỳ</span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Chọn ảnh theo bộ sưu tập & ghi chú từng ảnh
                        </span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Đổi thương hiệu & Logo Studio riêng
                        </span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Liên kết đặt lịch cá nhân hóa theo Slug Studio
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT 03: LENSY STUDIO COMMAND */}
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-orange-500 shadow-xl shadow-orange-500/10 flex flex-col justify-between space-y-8 relative">
              {/* Badge nổi bật */}
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded-full bg-orange-600 text-white shadow-md">
                  {currentTab.col3.badge}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-mono font-black text-orange-600 dark:text-orange-400">
                      03
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                      STUDIO COMMAND
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                    {currentTab.col3.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                    {currentTab.col3.desc}
                  </p>
                </div>

                {renderPriceBlock(currentTab.col3)}

                <Link
                  to={primaryCtaLink}
                  className="w-full py-3 rounded-xl text-center text-xs font-bold bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all cursor-pointer block tracking-wide"
                >
                  {user ? 'Vào Bảng Điều Khiển' : currentTab.col3.cta}
                </Link>

                {/* Danh sách tính năng Cột 03 (Đầy đủ cả 3 nhóm) */}
                <div className="space-y-5 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs">
                  {/* Nhóm 1: CRM & Dòng tiền */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      QUẢN LÝ STUDIO (CRM & DÒNG TIỀN)
                    </span>
                    <ul className="space-y-2 text-slate-700 dark:text-zinc-300">
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Dashboard tổng quan & Biểu đồ lợi nhuận ròng</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Quản lý lịch hẹn & Bảng tiến độ Kanban 5 bước</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Báo giá động & Nhận cọc VietQR tự động (SePAY)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Quản lý hồ sơ khách hàng (CRM & phân hạng VIP)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Hạch toán chi phí show (Job Costing) & Nhắc nợ Zalo</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nhóm 2: Điều phối chuyên sâu (Ưu thế độc quyền của Lensy) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      CÔNG CỤ ĐIỀU PHỐI STUDIO CHUYÊN SÂU
                    </span>
                    <ul className="space-y-2 text-slate-700 dark:text-zinc-300">
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Bảng phân công nhân sự (Thợ chụp, Makeup, Hậu kỳ)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Quản lý bảng lương Ekip & Quyết toán VietQR</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>Quản lý kho thiết bị & Đo lường hoàn vốn (ROI)</span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ĐÃ SẴN SÀNG
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>Quét trùng lịch thiết bị & nhân sự (Conflict Scanner 2.0)</span>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                            ĐỘC QUYỀN
                          </span>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Báo cáo tổng hợp, nhập/xuất dữ liệu CSV & Google Sheets</span>
                      </li>
                    </ul>
                  </div>

                  {/* Nhóm 3: Client Portal */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                      CỔNG KHÁCH CHỌN ẢNH & BÀN GIAO (CLIENT PORTAL)
                    </span>
                    <ul className="space-y-2 text-slate-700 dark:text-zinc-300">
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Cổng khách hàng thả tim chọn ảnh trực tuyến</span>
                      </li>
                      <li className="flex items-start justify-between">
                        <div className="flex items-start">
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                          <span>Hạn mức show tạo mới mỗi tháng</span>
                        </div>
                        <span className="font-mono font-bold text-orange-600 dark:text-orange-400 ml-2">
                          {currentTab.albumLimitLabel}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Xuất nhanh mã file ảnh chọn cho Lightroom Library</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        <span>Bàn giao link tải ảnh & Thu hồi công nợ cuối kỳ</span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Chọn ảnh theo bộ sưu tập & ghi chú từng ảnh
                        </span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Đổi thương hiệu & Logo Studio riêng
                        </span>
                      </li>
                      <li className="flex items-start">
                        {currentTab.isAdvancedUnlocked ? (
                          <span className="text-orange-600 dark:text-orange-400 font-bold font-mono mr-2">+</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono font-bold mr-2">—</span>
                        )}
                        <span className={currentTab.isAdvancedUnlocked ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-400 dark:text-zinc-600'}>
                          Liên kết đặt lịch cá nhân hóa theo Slug Studio
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI MỞ RỘNG LINH HOẠT (ADD-ON NOTIFICATION BOX) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            <span className="font-mono font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block sm:inline mr-2">
              MỞ RỘNG LINH HOẠT THEO NHU CẦU:
            </span>
            Không cần nâng cấp toàn bộ gói nếu bạn chỉ phát sinh nhu cầu nhỏ. Hỗ trợ mua lẻ +10 Album/tháng (20.000 đ) hoặc thêm thành viên Ekip Studio (+30.000 đ/thành viên/tháng).
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PHẦN F: BẢO CHỨNG THỰC CHIẾN (SOCIAL PROOF) & FOOTER                 */}
      {/* ==================================================================== */}
      <section className="px-4 sm:px-8 py-16 sm:py-24 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 block">
            BẢO CHỨNG THỰC CHIẾN
          </span>

          <blockquote className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-relaxed max-w-3xl mx-auto">
            "Từ khi đưa Lensy CRM vào quy trình vận hành tại MIRMIA Studio & Academy, chúng tôi đã giải quyết triệt để 100% bài toán trùng thiết bị và thợ chụp vào mùa cưới cao điểm. Luồng cọc VietQR qua SePAY xác nhận trong 3 giây giúp tỷ lệ chốt show tăng vọt 45%, đồng thời tiết kiệm hơn 20 giờ đối soát sổ sách bảng lương mỗi tháng."
          </blockquote>

          <div className="pt-4 space-y-1">
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              Hồ Hoàng Long (Johnny Long Ho)
            </p>
            <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Founder & Giám Đốc Điều Hành — MIRMIA Studio & Academy
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 sm:px-8 py-10 border-t border-slate-200 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-slate-950 dark:text-white">LENSY CRM</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-600">
                · STUDIO OPERATING SYSTEM
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-500">
              Powered by Lensy CRM — Developed by Mirmia Studio & Academy
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-wider">
            <Link
              to="/book/johnnylongho"
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Cổng Đặt Lịch Mẫu
            </Link>
            <a
              href="#pricing"
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Bảng Giá
            </a>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              HỆ THỐNG HOẠT ĐỘNG 99.98%
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
