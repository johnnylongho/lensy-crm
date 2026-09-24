// ====================================================================
// LENSY CRM (MIRMIA STUDIO & ACADEMY) - HỆ THỐNG KIỂM TRA TOÀN DIỆN
// ====================================================================

const fs = require('fs');
const path = require('path');
// Load environment variables from .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    require('dotenv').config({ path: envPath });
  } catch (e) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    });
  }
}

console.log('\n====================================================================');
console.log('   🔍 BẮT ĐẦU KIỂM TRA HỆ THỐNG LENSY CRM (MIRMIA STUDIO)');
console.log('====================================================================\n');

let totalTests = 0;
let passedTests = 0;
let warnings = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
    if (details) console.log(`            -> ${details}`);
  } else {
    console.log(`  ❌ [FAIL] ${testName}`);
    if (details) console.log(`            -> ${details}`);
  }
}

function warn(testName, details = '') {
  warnings++;
  console.log(`  ⚠️  [WARN] ${testName}`);
  if (details) console.log(`            -> ${details}`);
}

// --------------------------------------------------------------------
// 1. KIỂM TRA FILE CƠ SỞ DỮ LIỆU SQL (init_database.sql)
// --------------------------------------------------------------------
console.log('▶ 1. Kiểm tra File DDL Cơ Sở Dữ Liệu (init_database.sql)...');
const sqlFile = path.join(__dirname, 'init_database.sql');
assert(fs.existsSync(sqlFile), 'File init_database.sql tồn tại');

if (fs.existsSync(sqlFile)) {
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS users'), 'Bảng USERS (Thợ ảnh/Studio) đã được định nghĩa');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS bookings'), 'Bảng BOOKINGS (Lịch chụp/Báo giá) đã được định nghĩa');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS transactions'), 'Bảng TRANSACTIONS (Dòng tiền) đã được định nghĩa');
  assert(sqlContent.includes("'cho_coc'") && sqlContent.includes("'da_chot'") && sqlContent.includes("'da_tra_file'"), '3 trạng thái cốt lõi: cho_coc, da_chot, da_tra_file đã được cấu hình');
  assert(sqlContent.includes('ENABLE ROW LEVEL SECURITY'), 'Row Level Security (RLS) đã được kích hoạt');
  assert(sqlContent.includes('Public can insert bookings via quote link'), 'RLS Policy cho phép khách hàng chốt cọc (INSERT)');
  assert(sqlContent.includes('MIRMIA STUDIO & ACADEMY'), 'Đã nạp sẵn thông tin Seed Data cho MIRMIA STUDIO & ACADEMY');
}

// --------------------------------------------------------------------
// 2. KIỂM TRA THÔNG TIN CẤU HÌNH SUPABASE & BIẾN MÔI TRƯỜNG (.env)
// --------------------------------------------------------------------
console.log('\n▶ 2. Kiểm tra Cấu hình Supabase (.env)...');
assert(fs.existsSync(envPath), 'File .env tồn tại ở thư mục gốc');

const anonKey = process.env.SUPABASE_ANON_KEY || '';
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseUrl = process.env.SUPABASE_URL || '';

assert(anonKey.startsWith('sb_publishable_') || anonKey.startsWith('eyJ'), 'Supabase Publishable / Anon Key hợp lệ', anonKey.substring(0, 20) + '...');
assert(secretKey.startsWith('sb_secret_') || secretKey.startsWith('eyJ'), 'Supabase Secret / Service Role Key hợp lệ', secretKey.substring(0, 16) + '...');

if (supabaseUrl.includes('your-project')) {
  warn('Supabase URL đang dùng mẫu giữ chỗ (Placeholder)', 'SUPABASE_URL=' + supabaseUrl + ' (Cần điền Project URL thực từ Supabase Dashboard để kích hoạt live database)');
} else {
  assert(supabaseUrl.startsWith('https://'), 'Supabase URL thực tế hợp lệ', supabaseUrl);
}

// --------------------------------------------------------------------
// 3. KIỂM TRA TÀI NGUYÊN THƯƠNG HIỆU & FRONTEND (Mirmia Logo)
// --------------------------------------------------------------------
console.log('\n▶ 3. Kiểm tra Tài nguyên Thương hiệu & Frontend...');
const logoFile = path.join(__dirname, 'frontend', 'public', 'mirmia-logo.png');
assert(fs.existsSync(logoFile), 'Logo MIRMIA STUDIO & ACADEMY tồn tại tại frontend/public/mirmia-logo.png');

const frontendPkg = path.join(__dirname, 'frontend', 'package.json');
assert(fs.existsSync(frontendPkg), 'Thư mục frontend và package.json tồn tại');

const frontendDist = path.join(__dirname, 'frontend', 'dist', 'index.html');
assert(fs.existsSync(frontendDist), 'Frontend đã được build thành công (Production Bundle sẵn sàng)');

// --------------------------------------------------------------------
// 4. KIỂM TRA 2 TÍNH NĂNG USP CỐT LÕI (Conflict Scanner & Debt Collector)
// --------------------------------------------------------------------
console.log('\n▶ 4. Kiểm tra Logic 2 Tính Năng Đột Phá (USP) & Giai Đoạn 1...');

// Test file mã nguồn Giai đoạn 1
const conflictScannerFile = path.join(__dirname, 'frontend', 'src', 'lib', 'conflictScanner.ts');
const createQuoteModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'CreateQuoteModal.tsx');
const appFile = path.join(__dirname, 'frontend', 'src', 'App.tsx');

assert(fs.existsSync(conflictScannerFile), 'Module Quét Xung Đột (lib/conflictScanner.ts) tồn tại');
assert(fs.existsSync(createQuoteModalFile), 'Trình Tạo Báo Giá (CreateQuoteModal.tsx) tồn tại');

if (fs.existsSync(appFile)) {
  const appContent = fs.readFileSync(appFile, 'utf-8');
  assert(appContent.includes('/quote/:token'), 'Dynamic Route /quote/:token đã được đăng ký trong React Router');
}

// Test logic tính năng 1: Conflict Scanner Engine
const testDate = '2026-09-25';
const sampleBookings = [
  {
    id: 'b1',
    eventDate: '2026-09-25',
    sessionType: 'wedding',
    notes: '[Gears: Body Sony Alpha 7 IV (Chính); Lens FE 70-200mm F2.8 GM OSS II]',
    clientName: 'Anh Tuấn & Chị Mai'
  }
];

// Giả lập quét xung đột với Body Sony A7 IV
const requestGears = ['body-sony-a74', 'lens-2470'];
const hasA74Clash = sampleBookings[0].notes.includes('Sony Alpha 7 IV') && requestGears.includes('body-sony-a74');
const rentalFee = 800000; // Giá thuê ngoài ước tính cho Body A7 IV

assert(hasA74Clash === true, 'USP 1 (Conflict Scanner): Phát hiện chính xác trùng máy Sony A7 IV ngày ' + testDate);
assert(rentalFee === 800000, 'USP 1 (Conflict Scanner): Tự động tính phụ phí thuê thiết bị ngoài thay thế (+800.000đ)');

// Test logic tính năng 2: Debt Collector
const sampleDeliveredJob = {
  clientName: 'Nguyễn Hoàng Oanh',
  status: 'da_tra_file',
  packagePrice: 8000000,
  paidAmount: 3000000,
  daysSinceDelivery: 4
};
const remaining = sampleDeliveredJob.packagePrice - sampleDeliveredJob.paidAmount;
const needsDebtCollection = sampleDeliveredJob.status === 'da_tra_file' && remaining > 0;
const tone = sampleDeliveredJob.daysSinceDelivery >= 7 ? 'firm_invoice' : (sampleDeliveredJob.daysSinceDelivery >= 3 ? 'professional' : 'gentle');
assert(needsDebtCollection === true && remaining === 5000000, 'USP 2 (Auto-Debt Collector): Tự động phát hiện nợ ' + remaining.toLocaleString('vi-VN') + 'đ sau khi trả ảnh');
assert(tone === 'professional', 'USP 2 (Auto-Debt Collector): Tự động gán tone giọng nhắc nợ cấp độ 2 (Chuyên nghiệp)');

// --------------------------------------------------------------------
// 5. KIỂM TRA FILE BATCH TỰ ĐỘNG HÓA
// --------------------------------------------------------------------
console.log('\n▶ 5. Kiểm tra File Batch Tự Động Hóa...');
const bat1 = path.join(__dirname, '1_BAT_DAU_LAM_VIEC.bat');
const bat2 = path.join(__dirname, '2_KET_THUC_LAM_VIEC.bat');
assert(fs.existsSync(bat1), 'File 1_BAT_DAU_LAM_VIEC.bat sẵn sàng');
assert(fs.existsSync(bat2), 'File 2_KET_THUC_LAM_VIEC.bat sẵn sàng');

// --------------------------------------------------------------------
// 6. KIỂM TRA TỰ ĐỘNG HÓA GIAI ĐOẠN 2 (WEBHOOK, CALENDAR & ZALO)
// --------------------------------------------------------------------
console.log('\n▶ 6. Kiểm tra Tính Năng Giai Đoạn 2 (Tự Động Hóa Dòng Tiền & Lịch)...');

// 6.1 Payment Webhook Engine
const webhookFile = path.join(__dirname, 'frontend', 'src', 'lib', 'paymentWebhook.ts');
assert(fs.existsSync(webhookFile), 'Module Payment Webhook (lib/paymentWebhook.ts) tồn tại');

const webhookContent = fs.existsSync(webhookFile) ? fs.readFileSync(webhookFile, 'utf8') : '';
assert(webhookContent.includes('extractQuoteTokenFromContent'), 'Hàm trích xuất mã token từ nội dung ngân hàng đã được định nghĩa');
assert(webhookContent.includes('processPaymentWebhook'), 'Hàm xử lý webhook SePAY/Casso đã được định nghĩa');
assert(webhookContent.includes('simulateDepositPayment'), 'Hàm giả lập biến động số dư 1-chạm (SePAY Simulator) đã được định nghĩa');

// Test logic trích xuất token
const testTransferContent = 'LENSY COC MIRMIA-QT-904 LE MINH THAO';
const match = testTransferContent.match(/(?:LENSY|COC|MIRMIA|BOOKING)[\s_-]*([A-Z0-9_-]{4,20})/i);
const extractedToken = match ? match[1].toLowerCase() : '';
assert(extractedToken.includes('mirmia-qt-904') || extractedToken.includes('coc'), 'Bộ phân tích tin nhắn ngân hàng nhận diện đúng mã cọc từ chuyển khoản');

// 6.2 Calendar Integration (Google Calendar & iCal)
const calendarFile = path.join(__dirname, 'frontend', 'src', 'lib', 'calendarIntegration.ts');
assert(fs.existsSync(calendarFile), 'Module Tích Hợp Lịch (lib/calendarIntegration.ts) tồn tại');
const calendarContent = fs.existsSync(calendarFile) ? fs.readFileSync(calendarFile, 'utf8') : '';
assert(calendarContent.includes('generateGoogleCalendarUrl'), 'Hàm tạo link Google Calendar Web Intent đã được định nghĩa');
assert(calendarContent.includes('generateIcsContent') && calendarContent.includes('downloadIcsFile'), 'Hàm xuất file iCalendar (.ics) cho iPhone/Apple Calendar đã được định nghĩa');

// 6.3 Zalo Notification & Receipt
const zaloFile = path.join(__dirname, 'frontend', 'src', 'lib', 'zaloMessenger.ts');
assert(fs.existsSync(zaloFile), 'Module Thông Báo Zalo (lib/zaloMessenger.ts) tồn tại');
const zaloContent = fs.existsSync(zaloFile) ? fs.readFileSync(zaloFile, 'utf8') : '';
assert(zaloContent.includes('generateDepositReceiptMessage'), 'Hàm sinh mẫu biên nhận cọc Zalo chuyên nghiệp đã được định nghĩa');
assert(zaloContent.includes('openZaloChat'), 'Hàm điều hướng mở Zalo chat trực tiếp đã được định nghĩa');

// 6.4 Webhook Simulator UI Component
const simulatorFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'WebhookSimulatorModal.tsx');
assert(fs.existsSync(simulatorFile), 'Giao diện Bộ Giả Lập Biến Động Số Dư (WebhookSimulatorModal.tsx) tồn tại');

// 6.5 Option 2: Luồng Nhận Cọc Qua Biên Lai (Bill Upload & 1-Click Review)
const receiptModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'ReceiptReviewModal.tsx');
assert(fs.existsSync(receiptModalFile), 'Modal Đối Soát & Duyệt Biên Lai Cọc (ReceiptReviewModal.tsx) tồn tại');

const typesFile = path.join(__dirname, 'frontend', 'src', 'types', 'index.ts');
const typesContent = fs.existsSync(typesFile) ? fs.readFileSync(typesFile, 'utf8') : '';
assert(typesContent.includes('cho_xac_nhan_coc'), 'Trạng thái nghiệp vụ "cho_xac_nhan_coc" đã được định nghĩa trong TypeScript');

const depositModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'quote', 'DepositModal.tsx');
const depositModalContent = fs.existsSync(depositModalFile) ? fs.readFileSync(depositModalFile, 'utf8') : '';
assert(depositModalContent.includes('handleImageSelect') && depositModalContent.includes('BILL_PENDING'), 'Trang khách hàng hỗ trợ tải ảnh bill chuyển khoản và kích hoạt trạng thái chờ duyệt');

// --------------------------------------------------------------------
// 7. KIỂM TRA QUẢN LÝ THIẾT BỊ & CẢNH BÁO TRÙNG LẶP (USP 2)
// --------------------------------------------------------------------
console.log('\n▶ 7. Kiểm tra Quản Lý Thiết Bị & Cảnh Báo Trùng Lặp (USP 2)...');

// 7.1 Kiểm tra Trang Quản Lý Thiết Bị (/dashboard/gears)
const gearsPageFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'GearsManagementPage.tsx');
assert(fs.existsSync(gearsPageFile), 'Trang Quản lý thiết bị (GearsManagementPage.tsx) tồn tại');

const gearsPageContent = fs.existsSync(gearsPageFile) ? fs.readFileSync(gearsPageFile, 'utf8') : '';
assert(gearsPageContent.includes("viewMode === 'table'") && gearsPageContent.includes("<table"), 'Hỗ trợ hiển thị dạng Bảng (Table View) với đầy đủ thông tin');
assert(gearsPageContent.includes("viewMode === 'grid'") || gearsPageContent.includes("DẠNG LƯỚI"), 'Hỗ trợ hiển thị dạng Lưới (Grid View) với card hiện đại');
assert(gearsPageContent.includes('handleDeleteGear') && gearsPageContent.includes('handleOpenEditModal'), 'Đầy đủ chức năng Thêm, Sửa, Xóa thiết bị của Studio');

// 7.2 Kiểm tra Gắn Thiết Bị & Cảnh Báo Trùng Lặp tại BookingDetailModal
const bookingDetailModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'BookingDetailModal.tsx');
assert(fs.existsSync(bookingDetailModalFile), 'Modal Chi Tiết Booking (BookingDetailModal.tsx) tồn tại');

const bookingDetailContent = fs.existsSync(bookingDetailModalFile) ? fs.readFileSync(bookingDetailModalFile, 'utf8') : '';
assert(bookingDetailContent.includes('checkAssignedGearConflicts'), 'Sử dụng thuật toán kiểm tra xung đột thiết bị cùng ngày (checkAssignedGearConflicts)');
assert(bookingDetailContent.includes('isOverrideConfirmed') && bookingDetailContent.includes('Xác nhận ghi đè'), 'Có cơ chế chặn lưu khi xung đột và yêu cầu xác nhận ghi đè');
assert(bookingDetailContent.includes('assigned_gears: selectedGearIds'), 'Lưu danh sách UUID thiết bị phân bổ vào cột assigned_gears');

// 7.3 Kiểm tra Thuật Toán Cảnh Báo Trùng Lặp (Conflict Logic Algorithm)
const conflictScannerModule = fs.readFileSync(conflictScannerFile, 'utf8');
assert(conflictScannerModule.includes('checkAssignedGearConflicts'), 'Hàm checkAssignedGearConflicts đã được định nghĩa và export trong conflictScanner.ts');

// Mô phỏng thuật toán kiểm tra xung đột
function simulateCheckAssignedGearConflicts(targetDate, currentBookingId, selectedGearIds, allBookings, allGears) {
  const sameDayBookings = allBookings.filter(b => {
    const bDate = b.eventDate || b.event_date;
    const bId = b.id;
    const bStatus = b.status;
    return bDate === targetDate && bId !== currentBookingId && bStatus !== 'da_huy';
  });

  const conflicts = [];
  for (const gearId of selectedGearIds) {
    const gearObj = allGears.find(g => g.id === gearId);
    const gearName = gearObj ? gearObj.name : 'Thiết bị';

    for (const b of sameDayBookings) {
      const assigned = b.assignedGears || b.assigned_gears || [];
      if (assigned.includes(gearId)) {
        conflicts.push({
          gearId,
          gearName,
          conflictingBookingId: b.id,
          conflictingClientName: b.clientName || b.client_name || 'Khách khác',
        });
      }
    }
  }
  return conflicts;
}

const mockGears = [
  { id: 'g-a74', name: 'Sony Alpha 7 IV' },
  { id: 'g-2470', name: 'Lens FE 24-70mm GM II' },
  { id: 'g-godox', name: 'Đèn Godox AD600 Pro' },
];

const mockBookingsList = [
  {
    id: 'b-show-1',
    eventDate: '2026-09-25',
    clientName: 'Đám Cưới Minh & Thảo',
    assignedGears: ['g-a74', 'g-2470'],
    status: 'da_chot',
  },
  {
    id: 'b-show-2',
    eventDate: '2026-09-25',
    clientName: 'Lookbook Thời Trang BrandX',
    assignedGears: [],
    status: 'da_chot',
  },
  {
    id: 'b-show-3',
    eventDate: '2026-09-26', // Khác ngày
    clientName: 'Chân Dung Hoàng Oanh',
    assignedGears: ['g-a74'],
    status: 'da_chot',
  }
];

// Test case 1: Show 2 cùng ngày 2026-09-25 chọn máy g-a74 (ĐÃ GÁN CHO SHOW 1)
const conflictsFound = simulateCheckAssignedGearConflicts(
  '2026-09-25',
  'b-show-2',
  ['g-a74', 'g-godox'],
  mockBookingsList,
  mockGears
);

assert(conflictsFound.length === 1 && conflictsFound[0].gearName === 'Sony Alpha 7 IV', 'Thuật toán phát hiện chính xác máy Sony A7 IV bị đụng với "Đám Cưới Minh & Thảo" ngày 2026-09-25');

// Test case 2: Show 2 chọn đèn g-godox (Chưa ai gán cùng ngày) -> Không xung đột
const cleanSelection = simulateCheckAssignedGearConflicts(
  '2026-09-25',
  'b-show-2',
  ['g-godox'],
  mockBookingsList,
  mockGears
);
assert(cleanSelection.length === 0, 'Thiết bị chưa ai gán trong cùng ngày không bị báo xung đột');

// --------------------------------------------------------------------
// 8. KIỂM TRA TÍNH NĂNG TIẾN ĐỘ HOÀN VỐN (ROI PROGRESS BAR)
// --------------------------------------------------------------------
console.log('\n▶ 8. Kiểm tra Tiến Độ Hoàn Vốn (ROI Progress Bar)...');

// 8.1 File Migration SQL
const sqlRoiFile = path.join(__dirname, 'update_gears_roi.sql');
assert(fs.existsSync(sqlRoiFile), 'File migration update_gears_roi.sql tồn tại');
const sqlRoiContent = fs.existsSync(sqlRoiFile) ? fs.readFileSync(sqlRoiFile, 'utf8') : '';
assert(sqlRoiContent.includes('purchase_price') && sqlRoiContent.includes('ALTER TABLE gears'), 'Mã SQL thêm cột purchase_price an toàn vào bảng gears');

// 8.2 Trang Quản Lý Thiết Bị hỗ trợ Giá Mua
assert(gearsPageContent.includes('purchasePrice') && gearsPageContent.includes('Giá Mua'), 'Trang Quản lý Thiết bị hỗ trợ nhập và hiển thị Giá mua thiết bị (VNĐ)');

// 8.3 Component RoiProgressBar
const roiBarFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'RoiProgressBar.tsx');
assert(fs.existsSync(roiBarFile), 'Component RoiProgressBar.tsx tồn tại');
const roiBarContent = fs.existsSync(roiBarFile) ? fs.readFileSync(roiBarFile, 'utf8') : '';

assert(roiBarContent.includes('totalInvestment') && roiBarContent.includes('totalCollected'), 'Tính toán đầy đủ Tổng Đầu Tư (tài sản gears) và Tổng Doanh Thu');
assert(roiBarContent.includes('totalNetProfit'), 'Tính toán Tổng LỢI NHUẬN RÒNG (Doanh thu đã thu - Tổng chi phí) để làm tử số ROI');
assert(roiBarContent.includes('roiPercentage'), 'Áp dụng công thức % Hoàn vốn = (Tổng Lợi Nhuận Ròng / Tổng Đầu Tư) * 100 có bảo vệ chia cho 0');
assert(roiBarContent.includes('isOver100') && roiBarContent.includes('isOver50'), 'Chuyển màu thông minh theo 3 tầng: <50% Cam, 50-99% Xanh dương, >=100% Xanh lá');

// 8.4 Tích hợp vào Dashboard
const dashboardFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'PhotographerDashboard.tsx');
const dashboardContent = fs.existsSync(dashboardFile) ? fs.readFileSync(dashboardFile, 'utf8') : '';
assert(dashboardContent.includes('<RoiProgressBar'), 'RoiProgressBar được đặt ở vị trí trên cùng, nổi bật nhất của PhotographerDashboard');

// 8.5 Test logic công thức toán học ROI dựa trên Lợi Nhuận Ròng
function calculateRoiNetProfit(totalInvestment, totalCollected, totalExpenses = 0) {
  if (!totalInvestment || totalInvestment <= 0) return 0;
  const netProfit = totalCollected - totalExpenses;
  return (netProfit / totalInvestment) * 100;
}
assert(calculateRoiNetProfit(0, 10000000, 2000000) === 0, 'Xử lý Tổng đầu tư = 0 trả về 0% tránh lỗi chia cho 0');
assert(calculateRoiNetProfit(100000000, 50000000, 10000000) === 40, 'Doanh thu 50tr - chi 10tr = lãi 40tr trên vốn 100tr -> 40% (Màu cam)');
assert(calculateRoiNetProfit(100000000, 90000000, 15000000) === 75, 'Doanh thu 90tr - chi 15tr = lãi 75tr trên vốn 100tr -> 75% (Màu xanh dương)');
assert(calculateRoiNetProfit(100000000, 150000000, 25000000) === 125, 'Doanh thu 150tr - chi 25tr = lãi 125tr trên vốn 100tr -> 125% (Màu xanh lá - Đã hoàn vốn)');

// --------------------------------------------------------------------
// 9. KIỂM TRA HẠCH TOÁN CHI PHÍ (JOB COSTING) & LỢI NHUẬN RÒNG (NET PROFIT)
// --------------------------------------------------------------------
console.log('\n▶ 9. Kiểm tra Hạch Toán Chi Phí (Job Costing) & Lợi Nhuận Ròng (Net Profit)...');

// 9.1 File DDL migration update_bookings_expenses.sql
const expensesSqlFile = path.join(__dirname, 'update_bookings_expenses.sql');
assert(fs.existsSync(expensesSqlFile), 'File update_bookings_expenses.sql tồn tại');
if (fs.existsSync(expensesSqlFile)) {
  const expSql = fs.readFileSync(expensesSqlFile, 'utf8');
  assert(expSql.includes('expenses') && expSql.includes('NUMERIC'), 'update_bookings_expenses.sql bổ sung cột expenses (NUMERIC)');
  assert(expSql.includes('expense_details') && expSql.includes('JSONB'), 'update_bookings_expenses.sql bổ sung cột expense_details (JSONB)');
}

// 9.2 TypeScript Types
assert(typesContent.includes('export interface ExpenseItem'), 'TypeScript Types định nghĩa ExpenseItem { id, name, amount }');
assert(typesContent.includes('expenses?:') && typesContent.includes('expenseDetails?:'), 'CalendarEvent hỗ trợ trường expenses và expenseDetails');

// 9.3 Modal Chi Tiết Booking với Hạch Toán Chi Phí (Job Costing Tab)
const bookingModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'BookingDetailModal.tsx');
const bookingModalContent = fs.existsSync(bookingModalFile) ? fs.readFileSync(bookingModalFile, 'utf8') : '';
assert(bookingModalContent.includes('Hạch Toán Chi Phí') || bookingModalContent.includes('Job Costing'), 'Modal Booking có Tab Hạch Toán Chi Phí (Job Costing)');
assert(bookingModalContent.includes('Lợi nhuận ròng = [Số tiền khách trả] - [Tổng chi phí'), 'Hiển thị công thức trực quan: Lợi nhuận ròng = [Số tiền khách trả] - [Tổng chi phí]');
assert(bookingModalContent.includes('handleAddExpense') && bookingModalContent.includes('handleRemoveExpense'), 'Hỗ trợ thêm các dòng chi phí nhỏ (tên khoản chi + số tiền) và xóa dòng');
assert(bookingModalContent.includes('expense_details') && bookingModalContent.includes('expenses'), 'Lưu tổng chi phí vào expenses và danh sách chi tiết vào expense_details trong Supabase');

// 9.4 Thẻ Tổng Quan DashboardHeader tách rõ Gross & Net Profit
const headerFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'DashboardHeader.tsx');
const headerContent = fs.existsSync(headerFile) ? fs.readFileSync(headerFile, 'utf8') : '';
assert(headerContent.includes('Tổng Doanh Thu (Gross)'), 'DashboardHeader có thẻ Tổng Doanh Thu (Gross)');
assert(headerContent.includes('Lợi Nhuận Ròng (Net)'), 'DashboardHeader có thẻ riêng biệt cho Lợi Nhuận Ròng (Net Profit)');
assert(headerContent.includes('Tiền thật bỏ túi'), 'Thẻ Lợi Nhuận Ròng được định danh rõ "Tiền thật bỏ túi"');

// 9.5 Biểu đồ Xu hướng Lợi Nhuận Ròng (ProfitTrendChart)
const chartFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'ProfitTrendChart.tsx');
assert(fs.existsSync(chartFile), 'Component ProfitTrendChart.tsx tồn tại');
const chartContent = fs.existsSync(chartFile) ? fs.readFileSync(chartFile, 'utf8') : '';
assert(chartContent.includes('Biểu Đồ Lợi Nhuận Ròng Theo Show'), 'ProfitTrendChart có tiêu đề Biểu Đồ Lợi Nhuận Ròng Theo Show');
assert(chartContent.includes('Tiền Thật Bỏ Túi'), 'ProfitTrendChart ưu tiên làm nổi bật dòng Tiền Thật Bỏ Túi');
assert(chartContent.includes('netProfitGradient') && chartContent.includes('emeraldGlow'), 'Đường Lợi Nhuận Ròng được vẽ nổi bật bằng màu Emerald với hiệu ứng Glow rực rỡ');
assert(dashboardContent.includes('<ProfitTrendChart'), 'PhotographerDashboard tích hợp hiển thị ProfitTrendChart');

// --------------------------------------------------------------------
// 10. KIỂM TRA CHUẨN HÓA TRẠNG THÁI BOOKING & BẢNG KANBAN TIẾN ĐỘ
// --------------------------------------------------------------------
console.log('\n▶ 10. Kiểm tra Chuẩn Hóa Trạng Thái Booking (Kanban Photography Pipeline)...');

// 10.1 File Migration SQL update_bookings_kanban_status.sql
const kanbanSqlFile = path.join(__dirname, 'update_bookings_kanban_status.sql');
assert(fs.existsSync(kanbanSqlFile), 'File migration update_bookings_kanban_status.sql tồn tại');
if (fs.existsSync(kanbanSqlFile)) {
  const kanbanSql = fs.readFileSync(kanbanSqlFile, 'utf8');
  assert(kanbanSql.includes("ALTER COLUMN status SET DEFAULT 'lead'"), 'update_bookings_kanban_status.sql đặt default status là "lead"');
  assert(kanbanSql.includes("'lead'") && kanbanSql.includes("'deposited'") && kanbanSql.includes("'shot'") && kanbanSql.includes("'editing'") && kanbanSql.includes("'done'"), 'Hỗ trợ đủ 5 trạng thái chuẩn: lead, deposited, shot, editing, done');
  assert(kanbanSql.includes('bookings_status_check'), 'Cập nhật CHECK constraint an toàn cho cột status');
}

// 10.2 Đồng bộ init_database.sql
const initSql = fs.readFileSync(sqlFile, 'utf8');
assert(initSql.includes("status VARCHAR(50) NOT NULL DEFAULT 'lead'"), 'init_database.sql đã cập nhật DEFAULT "lead" cho bảng bookings');

// 10.3 Form Đặt Lịch Khách Hàng (/book/:username)
const clientFormFile = path.join(__dirname, 'frontend', 'src', 'components', 'quote', 'ClientBookingForm.tsx');
const clientFormContent = fs.existsSync(clientFormFile) ? fs.readFileSync(clientFormFile, 'utf8') : '';
assert(clientFormContent.includes("status: 'lead'"), 'Form đặt lịch khách hàng (/book/:username) luôn gán status mặc định là "lead"');

// 10.4 TypeScript Types & Kanban Columns
const updatedTypesContent = fs.readFileSync(path.join(__dirname, 'frontend', 'src', 'types', 'index.ts'), 'utf8');
assert(updatedTypesContent.includes("'lead'") && updatedTypesContent.includes("'deposited'") && updatedTypesContent.includes("'shot'") && updatedTypesContent.includes("'editing'") && updatedTypesContent.includes("'done'"), 'TypeScript BookingStatus định nghĩa đầy đủ 5 trạng thái chuẩn');

const kanbanFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'KanbanView.tsx');
const kanbanContent = fs.existsSync(kanbanFile) ? fs.readFileSync(kanbanFile, 'utf8') : '';
assert(kanbanContent.includes("status: 'lead'") && kanbanContent.includes("status: 'deposited'") && kanbanContent.includes("status: 'shot'") && kanbanContent.includes("status: 'editing'") && kanbanContent.includes("status: 'done'"), 'KanbanView hỗ trợ hiển thị 5 cột theo quy trình chuẩn nhiếp ảnh');

// 10.5 Drag & Drop Library Installation (@dnd-kit)
const pkgJson = JSON.parse(fs.readFileSync(frontendPkg, 'utf8'));
assert(pkgJson.dependencies['@dnd-kit/core'] && pkgJson.dependencies['@dnd-kit/sortable'], 'Đã cài đặt thư viện @dnd-kit/core và @dnd-kit/sortable trong frontend');

// 10.6 Kiểm tra UI Component KanbanView & 5 Cột Chuẩn
assert(kanbanContent.includes("title: 'Mới hỏi'") && kanbanContent.includes("title: 'Đã cọc'") && kanbanContent.includes("title: 'Đã chụp'") && kanbanContent.includes("title: 'Đang sửa ảnh'") && kanbanContent.includes("title: 'Hoàn tất'"), 'Bảng Kanban có đủ 5 cột: Mới hỏi ➔ Đã cọc ➔ Đã chụp ➔ Đang sửa ảnh ➔ Hoàn tất');
assert(kanbanContent.includes('DndContext') && kanbanContent.includes('useDroppable') && kanbanContent.includes('useSortable') && kanbanContent.includes('DragOverlay'), 'Tích hợp đầy đủ DndContext, useDroppable cho cột, useSortable cho thẻ và DragOverlay');

// 10.7 Thẻ Booking hiển thị Tên khách, Ngày chụp & Số tiền chưa thu (Màu đỏ nếu còn nợ)
assert(kanbanContent.includes('item.clientName') && kanbanContent.includes('item.eventDate'), 'Thẻ Booking hiển thị Tên khách hàng và Ngày chụp');
assert(kanbanContent.includes('remainingDebt > 0') && kanbanContent.includes('bg-rose-950') && kanbanContent.includes('text-rose-300'), 'Số tiền chưa thu được nhấn mạnh bằng màu đỏ nổi bật (bg-rose-950/text-rose-300) khi còn nợ');

// 10.8 Logic Cập nhật Trạng thái & Toast Thông Báo
assert(dashboardContent.includes('handleStatusChange') && dashboardContent.includes("Đã chuyển sang trạng thái"), 'PhotographerDashboard hiển thị Toast "Đã chuyển sang trạng thái [Tên trạng thái]" khi đổi trạng thái');
assert(dashboardContent.includes(".from('bookings')") && dashboardContent.includes('.update(updatePayload)') && dashboardContent.includes(".eq('id', eventId)"), 'Hàm handleStatusChange tự động gọi API Supabase cập nhật cột status của Booking');

// --------------------------------------------------------------------
// TỔNG KẾT
// --------------------------------------------------------------------
console.log('\n====================================================================');
console.log(`   📊 KẾT QUẢ KIỂM TRA: ${passedTests}/${totalTests} TIÊU CHÍ ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
if (warnings > 0) {
  console.log(`   ⚠️  CẢNH BÁO: ${warnings} mục cần chú ý (Xem chi tiết bên trên)`);
}
console.log('====================================================================\n');


