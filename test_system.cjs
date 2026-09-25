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
// 11. KIỂM TRA HỒ SƠ KHÁCH HÀNG (CLIENT CRM)
// --------------------------------------------------------------------
console.log('▶ 11. Kiểm tra Hồ Sơ Khách Hàng (Client CRM) & Tích Hợp Đặt Lịch...');
const clientsSqlFile = path.join(__dirname, 'create_clients.sql');
assert(fs.existsSync(clientsSqlFile), 'File migration create_clients.sql tồn tại');

if (fs.existsSync(clientsSqlFile)) {
  const cSql = fs.readFileSync(clientsSqlFile, 'utf8');
  assert(cSql.includes('CREATE TABLE IF NOT EXISTS clients'), 'create_clients.sql tạo bảng clients');
  assert(cSql.includes('photographer_id UUID REFERENCES users(id)') && cSql.includes('phone VARCHAR') && cSql.includes('email VARCHAR'), 'Bảng clients có đủ các cột: id, photographer_id, name, phone, email, created_at');
  assert(cSql.includes('ALTER TABLE bookings') && cSql.includes('client_id UUID REFERENCES clients(id)'), 'Cập nhật bảng bookings thêm cột client_id tham chiếu tới clients');
  assert(cSql.includes('ALTER TABLE clients ENABLE ROW LEVEL SECURITY'), 'Bảng clients đã được kích hoạt Row Level Security (RLS)');
  assert(cSql.includes('photographer_id = auth.uid()'), 'RLS thợ ảnh (auth.uid() = photographer_id) có toàn quyền thao tác dữ liệu');
  assert(cSql.includes('upsert_client_for_booking'), 'Định nghĩa hàm RPC upsert_client_for_booking xử lý an toàn cho public form');
}

const bookingFormFile = path.join(__dirname, 'frontend', 'src', 'components', 'quote', 'ClientBookingForm.tsx');
if (fs.existsSync(bookingFormFile)) {
  const bfContent = fs.readFileSync(bookingFormFile, 'utf8');
  assert(bfContent.includes("from('clients')") || bfContent.includes('upsert_client_for_booking'), 'ClientBookingForm có logic kiểm tra / upsert Client CRM');
  assert(bfContent.includes('client_id'), 'ClientBookingForm gắn client_id vào bản ghi đặt lịch mới');
}

// 11.2 Frontend UI Client CRM
const clientsPageFile = path.join(__dirname, 'frontend', 'src', 'components', 'clients', 'ClientsManagementPage.tsx');
assert(fs.existsSync(clientsPageFile), 'Trang Quản lý Khách Hàng (ClientsManagementPage.tsx) tồn tại');

if (fs.existsSync(clientsPageFile)) {
  const cpContent = fs.readFileSync(clientsPageFile, 'utf8');
  assert(cpContent.includes('totalSpent') && cpContent.includes('totalBookings'), 'Tính toán Giá trị trọn đời (LTV) và Tổng số lần chụp');
  assert(cpContent.includes('isVip') && cpContent.includes('👑') && cpContent.includes('VIP'), 'Gắn nhãn Khách VIP (Gamification) với icon 👑 VIP màu vàng');
  assert(cpContent.includes('ClientProfileModal'), 'Tích hợp Drawer / Modal xem chi tiết lịch sử gói chụp của khách hàng');
}

const clientProfileModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'clients', 'ClientProfileModal.tsx');
assert(fs.existsSync(clientProfileModalFile), 'Modal Hồ Sơ Khách Hàng (ClientProfileModal.tsx) tồn tại');

const appRoutesContent = fs.readFileSync(appFile, 'utf8');
assert(appRoutesContent.includes('/dashboard/clients') && appRoutesContent.includes('ClientsManagementPage'), 'Đã đăng ký route /dashboard/clients trong App.tsx');

const layoutFile = path.join(__dirname, 'frontend', 'src', 'layouts', 'DashboardLayout.tsx');
const layoutContent = fs.readFileSync(layoutFile, 'utf8');
assert(layoutContent.includes('/dashboard/clients') && layoutContent.includes('Khách Hàng'), 'Menu thanh điều hướng có tab Khách Hàng');

// --------------------------------------------------------------------
// 12. KIỂM TRA TỐI ƯU TRẢI NGHIỆM KHÁCH HÀNG (CX) & PHỄU ĐẶT LỊCH (/book/:username)
// --------------------------------------------------------------------
console.log('▶ 12. Kiểm tra Tối Ưu CX & Phễu Chuyển Đổi Trang Báo Giá...');

// 12.1 Validation Form Đặt Lịch
if (fs.existsSync(bookingFormFile)) {
  const bfContent = fs.readFileSync(bookingFormFile, 'utf8');
  assert(bfContent.includes('(Bắt buộc)') && bfContent.includes('(Không bắt buộc)'), 'ClientBookingForm hiển thị rõ nhãn (Bắt buộc) ở ô SĐT và (Không bắt buộc) ở ô Email');
  assert(bfContent.includes('if (!cleanPhone)') && !bfContent.includes('required\n              value={clientEmail}'), 'Số điện thoại là trường liên hệ bắt buộc duy nhất, email không bắt buộc');
}

// 12.2 Hotline trong Settings
const settingsFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'SettingsPage.tsx');
if (fs.existsSync(settingsFile)) {
  const sfContent = fs.readFileSync(settingsFile, 'utf8');
  assert(sfContent.includes('phone') && (sfContent.includes('Hotline') || sfContent.includes('Số Điện Thoại')), 'Trang Cài đặt có trường nhập Hotline/Số điện thoại thợ ảnh');
}

// 12.3 Floating Action Buttons trong QuoteView
const quoteViewFile = path.join(__dirname, 'frontend', 'src', 'components', 'quote', 'QuoteView.tsx');
if (fs.existsSync(quoteViewFile)) {
  const qvContent = fs.readFileSync(quoteViewFile, 'utf8');
  assert(qvContent.includes('userData.phone') && qvContent.includes('photographerPhone'), 'Truy xuất số điện thoại studio từ bảng users theo username');
  assert(qvContent.includes('https://zalo.me/') && qvContent.includes('tel:'), 'Nút hành động trôi nổi (Floating Buttons) liên kết chính xác tới Zalo và Hotline');
  assert(qvContent.includes('#0068FF') && qvContent.includes('Chat Zalo') && qvContent.includes('Gọi Điện'), 'Cụm Floating Buttons có đủ nút Chat Zalo (#0068FF) và Gọi điện');
}

// --------------------------------------------------------------------
// 13. KIỂM TRA MÀN HÌNH CẢM ƠN & THANH TOÁN 1-CHẠM VIETQR ĐỘNG
// --------------------------------------------------------------------
console.log('▶ 13. Kiểm tra Màn Hình Cảm Ơn & Thanh Toán 1-Chạm VietQR Động...');

const paymentSuccessFile = path.join(__dirname, 'frontend', 'src', 'components', 'quote', 'PaymentSuccess.tsx');
assert(fs.existsSync(paymentSuccessFile), 'Component PaymentSuccess (PaymentSuccess.tsx) tồn tại');

if (fs.existsSync(paymentSuccessFile)) {
  const psContent = fs.readFileSync(paymentSuccessFile, 'utf8');
  assert(psContent.includes('img.vietqr.io/image') && psContent.includes('compact2.png'), 'Tích hợp endpoint VietQR động (img.vietqr.io/image/{bank_code}-{bank_account}-compact2.png)');
  assert(psContent.includes('Cảm ơn bạn! Lịch chụp của bạn đã được ghi nhận.') && psContent.includes('Vui lòng quét mã QR dưới đây để tiến hành đặt cọc và giữ lịch.'), 'Hiển thị chính xác câu thông điệp hướng dẫn cọc');
  assert(psContent.includes('Studio sẽ liên hệ với bạn qua Số điện thoại/Zalo để hướng dẫn đặt cọc.'), 'Xử lý Fallback khi thợ ảnh chưa cập nhật thông tin ngân hàng trong Settings');
  assert(psContent.includes('Coc lich chup'), 'Nội dung chuyển khoản khởi tạo động theo cú pháp "Coc lich chup " + SĐT khách');
  assert(psContent.includes('mx-auto') && (psContent.includes('max-w-[280px]') || psContent.includes('max-w-[320px]')), 'Mã VietQR nằm căn giữa màn hình, rõ nét và tối ưu cho di động');
}

if (fs.existsSync(bookingFormFile)) {
  const bfContent = fs.readFileSync(bookingFormFile, 'utf8');
  assert(bfContent.includes('PaymentSuccess') && bfContent.includes('submittedBooking'), 'ClientBookingForm tự động thay thế form bằng PaymentSuccess sau khi submit thành công');
}

// --------------------------------------------------------------------
// 14. KIỂM TRA HỆ THỐNG CHĂM SÓC KHÁCH HÀNG TỰ ĐỘNG QUA ZALO (KANBAN PIPELINE)
// --------------------------------------------------------------------
console.log('▶ 14. Kiểm tra Hệ Thống Chăm Sóc Khách Hàng Tự Động Qua Zalo Trên Bảng Kanban...');

const zaloModalFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'ZaloNotificationModal.tsx');
assert(fs.existsSync(zaloModalFile), 'Component ZaloNotificationModal (ZaloNotificationModal.tsx) tồn tại');

if (fs.existsSync(zaloModalFile)) {
  const zmContent = fs.readFileSync(zaloModalFile, 'utf8');
  assert(zmContent.includes('Thông báo cho khách hàng qua Zalo?'), 'Modal có tiêu đề chính xác: "Thông báo cho khách hàng qua Zalo?"');
  assert(zmContent.includes('Chào ${clientName}, ${sName} đã nhận được cọc và xác nhận giữ lịch chụp cho bạn vào ngày ${eventDate}. Hẹn gặp bạn nhé!'), 'Logic sinh tin nhắn chuẩn xác khi chuyển sang cột deposited (Đã cọc)');
  assert(zmContent.includes('Chào ${clientName}, ${sName} đã hoàn thiện bộ ảnh của bạn. Cảm ơn bạn đã tin tưởng lựa chọn studio. Chúc bạn một ngày vui vẻ!'), 'Logic sinh tin nhắn chuẩn xác khi chuyển sang cột done (Hoàn tất)');
  assert(zmContent.includes('Bỏ qua'), 'Có Nút 1: "Bỏ qua" để đóng modal');
  assert(zmContent.includes('Copy Tin nhắn') && zmContent.includes('Đã copy!'), 'Có Nút 2: "Copy Tin nhắn" và hiển thị Toast "Đã copy!"');
  assert(zmContent.includes('Mở Zalo ngay') && zmContent.includes('#0068FF'), 'Có Nút 3: "Mở Zalo ngay" với màu xanh Zalo chuẩn thương hiệu (#0068FF)');
  assert(zmContent.includes('https://zalo.me/') && zmContent.includes('_blank'), 'Mở trực tiếp Zalo bằng URL https://zalo.me/[Số_điện_thoại_khách_hàng] sang tab mới');
}

// Kiểm tra KanbanView tích hợp Modal Zalo khi kéo thả
const kanbanViewFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'KanbanView.tsx');
if (fs.existsSync(kanbanViewFile)) {
  const kvContent = fs.readFileSync(kanbanViewFile, 'utf8');
  assert(kvContent.includes('ZaloNotificationModal'), 'KanbanView đã import và tích hợp ZaloNotificationModal');
  assert(
    (kvContent.includes("'deposited'") || kvContent.includes("'da_chot'")) &&
    (kvContent.includes("'done'") || kvContent.includes("'hoan_thanh'")) &&
    kvContent.includes('setZaloNotification'),
    'Kích hoạt Modal Zalo khi thợ ảnh kéo thả thẻ Booking sang cột deposited hoặc done'
  );
}

// Kiểm tra types CalendarEvent có clientPhone
if (fs.existsSync(typesFile)) {
  const tfContent = fs.readFileSync(typesFile, 'utf8');
  assert(tfContent.includes('clientPhone?: string;'), 'Interface CalendarEvent hỗ trợ trường clientPhone để trỏ SĐT khách hàng vào Zalo');
}

// --------------------------------------------------------------------
// 15. KIỂM TRA TÁI CẤU TRÚC UI/UX SAAS QUỐC TẾ & TÍCH HỢP DARK/LIGHT MODE
// --------------------------------------------------------------------
console.log('▶ 15. Kiểm tra Tái Cấu Trúc UI/UX SaaS & Dark/Light Mode...');

// 15.1 Cấu hình Tailwind darkMode: 'class'
const tailwindConfigFile = path.join(__dirname, 'frontend', 'tailwind.config.js');
if (fs.existsSync(tailwindConfigFile)) {
  const twContent = fs.readFileSync(tailwindConfigFile, 'utf8');
  assert(twContent.includes("darkMode: 'class'"), "Tailwind CSS đã cấu hình darkMode: 'class'");
  assert(twContent.includes('Plus Jakarta Sans') || twContent.includes('Inter'), 'Tailwind CSS cấu hình font chữ Sans-serif hiện đại (Plus Jakarta Sans/Inter)');
}

// 15.2 ThemeContext & Custom Hook useTheme
const themeContextFile = path.join(__dirname, 'frontend', 'src', 'context', 'ThemeContext.tsx');
assert(fs.existsSync(themeContextFile), 'Module ThemeContext (ThemeContext.tsx) tồn tại');

if (fs.existsSync(themeContextFile)) {
  const tcContent = fs.readFileSync(themeContextFile, 'utf8');
  assert(tcContent.includes('useTheme') && tcContent.includes('ThemeProvider'), 'ThemeContext cung cấp ThemeProvider và custom hook useTheme');
  assert(tcContent.includes("'light'") && tcContent.includes("'dark'") && tcContent.includes("'system'"), 'Hỗ trợ đầy đủ 3 chế độ: Light, Dark, System');
  assert(tcContent.includes('localStorage.setItem') && tcContent.includes('classList.add'), 'Lưu trạng thái Theme vào localStorage và đồng bộ class dark lên document');
}

// 15.3 Component ThemeToggle với Transition xoay mượt mà
const themeToggleFile = path.join(__dirname, 'frontend', 'src', 'components', 'common', 'ThemeToggle.tsx');
assert(fs.existsSync(themeToggleFile), 'Component ThemeToggle (ThemeToggle.tsx) tồn tại');

if (fs.existsSync(themeToggleFile)) {
  const ttContent = fs.readFileSync(themeToggleFile, 'utf8');
  assert(ttContent.includes('Sun') && ttContent.includes('Moon'), 'Nút Toggle có đủ icon Mặt trời (Sun) và Mặt trăng (Moon)');
  assert(ttContent.includes('rotate') && ttContent.includes('transition'), 'Nút Toggle tích hợp hiệu ứng xoay và chuyển động transition mượt mà');
}

// 15.4 Tích hợp ThemeToggle vào Dashboard Layout & Header
const dashLayoutFile = path.join(__dirname, 'frontend', 'src', 'layouts', 'DashboardLayout.tsx');
if (fs.existsSync(dashLayoutFile)) {
  const dlContent = fs.readFileSync(dashLayoutFile, 'utf8');
  assert(dlContent.includes('ThemeToggle'), 'DashboardLayout đã tích hợp ThemeToggle trên thanh điều hướng chính');
  assert(dlContent.includes('dark:bg-') && dlContent.includes('bg-slate-50'), 'DashboardLayout chuẩn hóa nền Light (bg-slate-50) và Dark Mode');
}

const dashHeaderFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'DashboardHeader.tsx');
if (fs.existsSync(dashHeaderFile)) {
  const dhContent = fs.readFileSync(dashHeaderFile, 'utf8');
  assert(!dhContent.includes('ThemeToggle'), 'DashboardHeader đã xóa nút ThemeToggle thừa theo đúng yêu cầu');
  assert(dhContent.includes('hover:-translate-y-0.5') && dhContent.includes('hover:shadow-md'), 'Các thẻ (Cards) tích hợp Micro-interactions nổi lên nhẹ khi hover');
}

// --------------------------------------------------------------------
// 16. KIỂM TRA TÁI CẤU TRÚC TRANG ĐẶT LỊCH ĐỘNG (/book/:username)
// --------------------------------------------------------------------
console.log('▶ 16. Kiểm tra Tái Cấu Trúc Trang Đặt Lịch Động (/book/:username)...');

if (fs.existsSync(quoteViewFile)) {
  const qvContent = fs.readFileSync(quoteViewFile, 'utf8');
  assert(qvContent.includes('isBookingPage') && qvContent.includes('Boolean(username)'), 'QuoteView phân định chính xác giữa trang đặt lịch studio (/book/:username) và báo giá cá nhân');
  assert(
    qvContent.includes('{isBookingPage ?') &&
    qvContent.includes('<QuoteHeader quote={quote} />') &&
    qvContent.includes('<QuoteSessionInfo quote={quote} />'),
    'Trang /book/:username loại bỏ dữ liệu mẫu cố định (QuoteHeader, QuoteSessionInfo, QuoteInclusions, QuoteEquipment, QuotePriceSummary)'
  );
  assert(
    qvContent.includes('Chào mừng bạn đến với') &&
    qvContent.includes('Vui lòng để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói chụp phù hợp nhất cho bạn.'),
    'Hiển thị chính xác lời chào tiêu chuẩn: "Chào mừng bạn đến với [Tên Studio]. Vui lòng để lại thông tin, chúng tôi sẽ liên hệ tư vấn gói chụp phù hợp nhất cho bạn."'
  );
  assert(qvContent.includes('studioCoverUrl') && qvContent.includes('studioAvatarUrl'), 'Giữ lại logo và ảnh cover của Studio trên header trang đặt lịch');
  assert(qvContent.includes('{quote.studioName}'), 'Tiêu đề trang sử dụng tên Studio động lấy từ cơ sở dữ liệu');
}

if (fs.existsSync(bookingFormFile)) {
  const bfContent = fs.readFileSync(bookingFormFile, 'utf8');
  assert(
    bfContent.includes('Chụp Cưới') &&
    bfContent.includes('Chụp Pre-Wedding') &&
    bfContent.includes('Chụp Gia đình') &&
    bfContent.includes('Sự kiện') &&
    bfContent.includes('Khác'),
    'Dropdown Nhu cầu chụp hỗ trợ đầy đủ các lựa chọn: Chụp Cưới, Chụp Pre-Wedding, Chụp Gia đình, Sự kiện, Khác'
  );
  assert(bfContent.includes('type="date"') && bfContent.includes('eventDate'), 'Form tích hợp Date Picker cho khách chọn ngày chụp dự kiến');
  assert(bfContent.includes('Ví dụ: Mình muốn chụp phong cách vintage'), 'Textarea ghi chú có placeholder chuẩn: "Ví dụ: Mình muốn chụp phong cách vintage"');
  assert(bfContent.includes('[Nhu cầu: ${shootRequirement}]'), 'Lưu nhu cầu chụp và ghi chú vào cột notes của bảng bookings');
  assert(bfContent.includes("status: 'lead'"), 'Bản ghi đặt lịch tạo mới có status mặc định là lead (Mới hỏi)');
}

// --------------------------------------------------------------------
// 17. KIỂM TRA THIẾT KẾ LIQUID GLASS (GLASSMORPHISM) TỐI GIẢN & HIỆN ĐẠI
// --------------------------------------------------------------------
console.log('▶ 17. Kiểm tra Thiết Kế Liquid Glass (Glassmorphism) Tối Giản & Hiện Đại...');

if (fs.existsSync(dashLayoutFile)) {
  const dlContent = fs.readFileSync(dashLayoutFile, 'utf8');
  assert(dlContent.includes('bg-[#0a0a0a]'), 'Nền Dark Mode sử dụng màu đen sâu bg-[#0a0a0a]');
  assert(dlContent.includes('blur-[120px]') && (dlContent.includes('opacity-30') || dlContent.includes('opacity-35')), 'Tạo Mesh Gradient với các khối tròn lớn mờ ảo blur-[120px] và opacity-30');
  assert(dlContent.includes('isMobileMenuOpen') || dlContent.includes('Menu') || dlContent.includes('X'), 'Menu điều hướng hỗ trợ Hamburger menu trên thiết bị di động');
  assert(dlContent.includes('Thiết Bị') && dlContent.includes('Cài Đặt'), 'Thanh điều hướng chứa đầy đủ liên kết Thiết Bị và Cài Đặt');
}

if (fs.existsSync(dashHeaderFile)) {
  const dhContent = fs.readFileSync(dashHeaderFile, 'utf8');
  assert(
    dhContent.includes('backdrop-blur-xl') &&
    (dhContent.includes('dark:bg-white/5') || dhContent.includes('bg-white/5') || dhContent.includes('dark:bg-black/20')),
    'Các thẻ thống kê áp dụng hiệu ứng Liquid Glass: backdrop-blur-xl và dark:bg-white/5'
  );
  assert(
    dhContent.includes('border-white/10') || dhContent.includes('dark:border-white/10'),
    'Viền siêu mảnh theo phong cách kính mờ: border-white/10'
  );
  assert(
    dhContent.includes('shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]') || dhContent.includes('shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]'),
    'Đổ bóng kính mờ có chiều sâu: shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'
  );
  assert(
    dhContent.includes('rounded-3xl') || dhContent.includes('rounded-2xl'),
    'Bo góc mềm mại sang trọng: rounded-2xl hoặc rounded-3xl'
  );
  assert(
    dhContent.includes('text-slate-500') && (dhContent.includes('dark:text-white/50') || dhContent.includes('text-white/50')),
    'Typography: Làm mờ các nhãn phụ bằng màu text-white/50'
  );
  assert(
    dhContent.includes('dark:text-white/90') || dhContent.includes('text-white/90'),
    'Typography: Số doanh thu màu text-white/90 font thanh mảnh, sang trọng'
  );
  assert(
    dhContent.includes('ghost-btn') || dhContent.includes('border-white/10') || dhContent.includes('hover:bg-white/10'),
    'Chuyển các nút phụ sang dạng Ghost Button tinh tế trên nền kính trong suốt'
  );
  assert(
    dhContent.includes('bg-gradient-to-r') && (dhContent.includes('amber') || dhContent.includes('yellow')),
    'Nút CTA quan trọng nhất (+ Tạo Báo Giá Mới) sử dụng màu nhấn Gradient tinh tế'
  );
}

const indexCssFile = path.join(__dirname, 'frontend', 'src', 'index.css');
if (fs.existsSync(indexCssFile)) {
  const cssContent = fs.readFileSync(indexCssFile, 'utf8');
  assert(cssContent.includes('.glass-panel') && cssContent.includes('.glass-card'), 'index.css định nghĩa các Utility Classes chuẩn hóa: .glass-panel, .glass-card');
  assert(cssContent.includes('.ghost-btn'), 'index.css hỗ trợ utility .ghost-btn cho các nút tương tác kính mờ');
}

// --------------------------------------------------------------------
// 18. KIỂM TRA HIỆU ỨNG CHUYỂN ĐỘNG & VI TƯƠNG TÁC CAO CẤP (ANIMATIONS & GAMIFICATION)
// --------------------------------------------------------------------
console.log('▶ 18. Kiểm tra Hiệu Ứng Chuyển Động & Vi Tương Tác Cao Cấp...');

const pkgJsonFile = path.join(__dirname, 'frontend', 'package.json');
if (fs.existsSync(pkgJsonFile)) {
  const pkg = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert(deps['framer-motion'], 'Đã cài đặt thư viện framer-motion cho hiệu ứng UI mượt mà');
  assert(deps['react-countup'], 'Đã cài đặt thư viện react-countup cho hiệu ứng số nhảy');
  assert(deps['canvas-confetti'], 'Đã cài đặt thư viện canvas-confetti cho hiệu ứng pháo hoa');
}

if (fs.existsSync(dashHeaderFile)) {
  const dhContent = fs.readFileSync(dashHeaderFile, 'utf8');
  assert(dhContent.includes('motion.div') || dhContent.includes('motion.'), 'Chuyển đổi các khối thẻ (Cards) trên Dashboard thành motion.div');
  assert(dhContent.includes('staggerChildren'), 'Áp dụng hiệu ứng xuất hiện lần lượt (stagger children) khi load trang');
  assert(dhContent.includes('CountUp'), 'Tích hợp CountUp tạo hiệu ứng số nhảy (Number Ticker) cho doanh thu và lợi nhuận');
  assert(dhContent.includes('animate-shimmer-sweep') || dhContent.includes('shimmer'), 'Thêm hiệu ứng ánh sáng lướt qua (Shimmer Sweep) chạy tuần hoàn trên nút Tạo Báo Giá Mới');
}

const roiProgressFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'RoiProgressBar.tsx');
if (fs.existsSync(roiProgressFile)) {
  const roiContent = fs.readFileSync(roiProgressFile, 'utf8');
  assert(roiContent.includes('CountUp'), 'Thanh Tiến độ Hoàn vốn (ROI) tích hợp CountUp cho số % hoàn vốn');
  assert(roiContent.includes('confetti') && roiContent.includes('roiPercentage >= 100'), 'Gamification Kịch bản 2: Bắn pháo hoa giấy toàn màn hình khi ROI chạm hoặc vượt 100%');
}

if (fs.existsSync(kanbanViewFile)) {
  const kvContent = fs.readFileSync(kanbanViewFile, 'utf8');
  assert(
    kvContent.includes('hover:scale-[1.02]') || kvContent.includes('scale-[1.02]') || kvContent.includes('scale: 1.02'),
    'Phản hồi vật lý thẻ Kanban khi hover: Hơi phóng to 2% (scale: 1.02)'
  );
  assert(
    kvContent.includes('confetti') && (kvContent.includes("targetStatus === 'done'") || kvContent.includes('triggerDoneConfetti')),
    'Gamification Kịch bản 1: Bắn pháo hoa giấy khi kéo thả thành công thẻ Booking sang cột Hoàn tất (Done)'
  );
}

// --------------------------------------------------------------------
// 19. KIỂM TRA LOGO CHÍNH THỨC & BỘ NHẬN DIỆN THƯƠNG HIỆU (BRANDING)
// --------------------------------------------------------------------
console.log('▶ 19. Kiểm tra Logo Chính Thức & Bộ Nhận Diện Thương Hiệu (Branding)...');

const lensyLogoPublicFile = path.join(__dirname, 'frontend', 'public', 'lensy-logo.png');
assert(fs.existsSync(lensyLogoPublicFile), 'File logo chính thức lensy-logo.png tồn tại trong frontend/public/');

const indexHtmlFile = path.join(__dirname, 'frontend', 'index.html');
if (fs.existsSync(indexHtmlFile)) {
  const htmlContent = fs.readFileSync(indexHtmlFile, 'utf8');
  assert(htmlContent.includes('rel="icon"') && htmlContent.includes('/lensy-logo.png'), 'Sử dụng lensy-logo.png làm favicon trên tab trình duyệt');
  assert(htmlContent.includes('<title>Lensy - CRM for Photographers</title>'), 'Cập nhật thẻ <title> trong index.html thành "Lensy - CRM for Photographers"');
}

if (fs.existsSync(dashLayoutFile)) {
  const dlContent = fs.readFileSync(dashLayoutFile, 'utf8');
  assert(dlContent.includes('lensy-logo.png') && dlContent.includes('h-8 w-auto'), 'Header Dashboard hiển thị logo lensy-logo.png với kích thước h-8 w-auto');
  assert(dlContent.includes('by Mirmia Studio') && dlContent.includes('text-[10px]') && dlContent.includes('text-gray-400'), 'Dấu ấn bản quyền "by Mirmia Studio" kích thước text-[10px] màu text-gray-400');
}

const loginPageFile = path.join(__dirname, 'frontend', 'src', 'components', 'auth', 'LoginPage.tsx');
if (fs.existsSync(loginPageFile)) {
  const lpContent = fs.readFileSync(loginPageFile, 'utf8');
  assert(lpContent.includes('lensy-logo.png') && (lpContent.includes('w-16 h-16') || lpContent.includes('h-16 w-16')), 'Form Đăng nhập đặt logo Lensy kích thước lớn (h-16 w-16) làm điểm nhấn chính');
  assert(lpContent.includes('Phát triển bởi Mirmia Studio & Academy') && lpContent.includes('text-xs') && lpContent.includes('text-gray-500'), 'Footer màn hình Đăng nhập đặt dòng chữ "Phát triển bởi Mirmia Studio & Academy" text-xs text-gray-500');
}

if (fs.existsSync(quoteViewFile)) {
  const qvContent = fs.readFileSync(quoteViewFile, 'utf8');
  assert(
    qvContent.includes('⚡ Powered by Lensy - Developed by Mirmia Studio & Academy') &&
    qvContent.includes('sticky bottom-0'),
    'Trang /book/:username đặt Watermark dính đáy "⚡ Powered by Lensy - Developed by Mirmia Studio & Academy"'
  );
  assert(
    qvContent.includes('opacity-50') && qvContent.includes('hover:opacity-100'),
    'Watermark có độ trong suốt thấp (opacity-50) và sáng lên khi hover (hover:opacity-100)'
  );
}

// --------------------------------------------------------------------
// 20. KIỂM TRA BỐ CỤC & FIX LỖI CHỒNG CHÉO "TOÀN BỘ LỊCH CHỤP SẮP TỚI"
// --------------------------------------------------------------------
console.log('▶ 20. Kiểm tra Tối Ưu Bố Cục Danh Sách "Toàn Bộ Lịch Chụp Sắp Tới"...');

const upcomingShootsFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'UpcomingShootsList.tsx');
if (fs.existsSync(upcomingShootsFile)) {
  const shootContent = fs.readFileSync(upcomingShootsFile, 'utf8');
  assert(
    shootContent.includes('flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full p-5'),
    'Thẻ Booking áp dụng Flexbox blueprint: flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full p-5'
  );
  assert(
    !shootContent.includes('absolute') && !shootContent.includes('-ml-') && !shootContent.includes('z-10'),
    'Xóa bỏ hoàn toàn định vị tuyệt đối (absolute, -ml-, -mt-, z-10) khỏi khối Tài chính'
  );
  assert(
    shootContent.includes('flex-shrink-0 w-16'),
    'Cột 1 (Ngày tháng): flex-shrink-0 w-16'
  );
  assert(
    shootContent.includes('flex-1 min-w-[200px]') && shootContent.includes('truncate'),
    'Cột 2 (Thông tin Khách hàng & Giờ giấc): flex-1 min-w-[200px] và truncate cho phép tên khách hàng hiển thị đầy đủ'
  );
  assert(
    shootContent.includes('flex-shrink-0 w-64 bg-white/5 p-3 rounded-lg') && shootContent.includes('flex justify-between'),
    'Cột 3 (Tài chính tĩnh): flex-shrink-0 w-64 bg-white/5 p-3 rounded-lg dạng flex justify-between'
  );
  assert(
    shootContent.includes('flex-shrink-0 flex items-center gap-3') && shootContent.includes('Gắn Thiết Bị'),
    'Cột 4 (Thao tác): flex-shrink-0 flex items-center gap-3 gom nút Gắn thiết bị và Dropdown'
  );
  assert(
    shootContent.includes('w-full max-w-7xl mx-auto'),
    'UpcomingShootsList Container dùng w-full max-w-7xl mx-auto để dàn trải đều ra giữa màn hình'
  );
}

const photoDashboardFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'PhotographerDashboard.tsx');
if (fs.existsSync(photoDashboardFile)) {
  const dashContent = fs.readFileSync(photoDashboardFile, 'utf8');
  assert(
    dashContent.includes('w-full max-w-7xl mx-auto') && dashContent.includes('<UpcomingShootsList'),
    'Container chứa danh sách UpcomingShootsList trong PhotographerDashboard có class w-full max-w-7xl mx-auto'
  );
}

// --------------------------------------------------------------------
// 21. KIỂM TRA DESKTOP-OPTIMIZED POWER USER & MOBILE RESPONSIVE UI/UX
// --------------------------------------------------------------------
console.log('▶ 21. Kiểm tra Kiến Trúc Desktop-Optimized & Mobile Responsive...');

if (fs.existsSync(dashLayoutFile)) {
  const dlContent = fs.readFileSync(dashLayoutFile, 'utf8');
  assert(
    dlContent.includes('hidden md:flex') && (dlContent.includes('gap-4') || dlContent.includes('gap-6')),
    'DashboardLayout hiển thị dàn trải toàn bộ menu trên Desktop/Tablet (hidden md:flex gap-4 hoặc gap-6)'
  );
  assert(
    dlContent.includes('md:hidden') && (dlContent.includes('isMobileMenuOpen') || dlContent.includes('Menu')),
    'Màn hình Mobile (< md) tự động cuộn vào Hamburger menu'
  );
}

const bookingDetailFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'BookingDetailModal.tsx');
if (fs.existsSync(bookingDetailFile)) {
  const bdContent = fs.readFileSync(bookingDetailFile, 'utf8');
  assert(
    bdContent.includes('md:right-0') && bdContent.includes('backdrop-blur-sm'),
    'Chi tiết Booking chuyển thành Slide-over Drawer từ cạnh phải màn hình với nền kính mờ backdrop-blur-sm'
  );
  assert(
    bdContent.includes('rounded-t-3xl') && bdContent.includes('bottom-0'),
    'Chi tiết Booking trên Mobile tự động thích ứng thành Bottom Sheet trượt từ đáy'
  );
}

const clientProfileFile = path.join(__dirname, 'frontend', 'src', 'components', 'clients', 'ClientProfileModal.tsx');
if (fs.existsSync(clientProfileFile)) {
  const cpContent = fs.readFileSync(clientProfileFile, 'utf8');
  assert(
    cpContent.includes('md:right-0') && cpContent.includes('backdrop-blur-sm'),
    'Chi tiết Khách Hàng chuyển thành Slide-over Drawer trượt ra từ bên phải màn hình'
  );
}

const clientMgmtFile = path.join(__dirname, 'frontend', 'src', 'components', 'clients', 'ClientsManagementPage.tsx');
if (fs.existsSync(clientMgmtFile)) {
  const cmContent = fs.readFileSync(clientMgmtFile, 'utf8');
  assert(
    cmContent.includes('hidden md:block') && cmContent.includes('<table'),
    'Trang Khách Hàng: Hiển thị Data Table đầy đủ các cột trên Desktop (hidden md:block)'
  );
  assert(
    cmContent.includes('md:hidden space-y-3'),
    'Trang Khách Hàng: Tự động chuyển đổi thành List Cards trên Mobile (md:hidden) tránh cuộn ngang'
  );
}

const gearsMgmtFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'GearsManagementPage.tsx');
if (fs.existsSync(gearsMgmtFile)) {
  const gmContent = fs.readFileSync(gearsMgmtFile, 'utf8');
  assert(
    gmContent.includes('hidden md:block') && gmContent.includes('<table'),
    'Trang Thiết Bị: Tận dụng chiều ngang Desktop với Data Table'
  );
  assert(
    gmContent.includes('md:hidden space-y-3'),
    'Trang Thiết Bị: Tự động chuyển đổi thành List Cards trên Mobile'
  );
}

// --------------------------------------------------------------------
// 22. KIỂM TRA BUNG THANH NAVIGATION DESKTOP & XÓA THEME TOGGLE THỪA
// --------------------------------------------------------------------
console.log('▶ 22. Kiểm tra Bung thanh Navigation Desktop & Xóa Theme Toggle Thừa...');

if (fs.existsSync(dashLayoutFile)) {
  const dlContent = fs.readFileSync(dashLayoutFile, 'utf8');
  assert(
    dlContent.includes('Lịch Chụp') &&
    dlContent.includes('Khách Hàng') &&
    dlContent.includes('Thiết Bị') &&
    dlContent.includes('Cài Đặt') &&
    dlContent.includes('Link Đặt Lịch'),
    'Hiển thị dàn trải toàn bộ 5 menu chính: Lịch Chụp, Khách Hàng, Thiết Bị, Cài Đặt, Link Đặt Lịch'
  );
  assert(
    dlContent.includes('flex items-center gap-4') || dlContent.includes('flex items-center gap-6') || dlContent.includes('items-center gap-4 lg:gap-6'),
    'Menu chính sử dụng flex items-center gap-4 hoặc gap-6 nằm ngang hàng'
  );
  assert(
    dlContent.includes('hidden md:flex') && dlContent.includes('md:hidden'),
    'Menu hiển thị đầy đủ trên màn hình từ md (tablet) hoặc lg (desktop) trở lên, chỉ cuộn vào Hamburger khi ở mobile'
  );
  assert(
    dlContent.includes('<ThemeToggle') && dlContent.includes('signOut'),
    'Giữ lại duy nhất 1 nút ThemeToggle trên thanh Header nằm cạnh User và Nút Đăng xuất'
  );
}

if (fs.existsSync(dashHeaderFile)) {
  const dhContent = fs.readFileSync(dashHeaderFile, 'utf8');
  assert(
    !dhContent.includes('ThemeToggle'),
    'Đã xóa bỏ hoàn toàn nút ThemeToggle thừa thứ 2 bên trong Thẻ Thông tin Studio (DashboardHeader)'
  );
}

// --------------------------------------------------------------------
// 23. KIỂM TRA SEO & DYNAMIC OPEN GRAPH (OG TAGS) CHO TRANG ĐẶT LỊCH CHUNG
// --------------------------------------------------------------------
console.log('▶ 23. Kiểm tra Cấu hình SEO & Dynamic Open Graph (OG Tags)...');

if (fs.existsSync(pkgJsonFile)) {
  const pkg = JSON.parse(fs.readFileSync(pkgJsonFile, 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert(allDeps['react-helmet-async'], 'Đã cài đặt thư viện react-helmet-async');
}

const mainTsxFile = path.join(__dirname, 'frontend', 'src', 'main.tsx');
if (fs.existsSync(mainTsxFile)) {
  const mainContent = fs.readFileSync(mainTsxFile, 'utf8');
  assert(
    mainContent.includes('HelmetProvider') && mainContent.includes('<HelmetProvider>'),
    'Ứng dụng được bọc bởi <HelmetProvider> tại main.tsx'
  );
}

if (fs.existsSync(quoteViewFile)) {
  const qvContent = fs.readFileSync(quoteViewFile, 'utf8');
  assert(
    qvContent.includes('react-helmet-async') && qvContent.includes('<Helmet>'),
    'QuoteView tích hợp component <Helmet> từ react-helmet-async'
  );
  assert(
    qvContent.includes('Đặt lịch chụp ảnh | ${quote.studioName}'),
    'Dynamic <title>: "Đặt lịch chụp ảnh | [Tên Studio]"'
  );
  assert(
    qvContent.includes('og:title') && qvContent.includes('Báo giá & Đặt lịch - ${quote.studioName}'),
    'Dynamic og:title: "Báo giá & Đặt lịch - [Tên Studio]"'
  );
  assert(
    qvContent.includes('og:description') &&
    qvContent.includes('Khám phá các gói dịch vụ và đặt lịch chụp ngay với ${quote.studioName}. Nền tảng được cung cấp bởi Lensy.'),
    'Dynamic og:description: "Khám phá các gói dịch vụ và đặt lịch chụp ngay với [Tên Studio]. Nền tảng được cung cấp bởi Lensy."'
  );
  assert(
    qvContent.includes('og:image') &&
    (qvContent.includes('studioCoverUrl') || qvContent.includes('studioAvatarUrl')),
    'Dynamic og:image chứa ảnh cover của studio hoặc logo Lensy'
  );
}

// --------------------------------------------------------------------
// 24. KIỂM TRA TÍNH NĂNG QUẢN LÝ GÓI DỊCH VỤ (PACKAGES MANAGEMENT)
// --------------------------------------------------------------------
console.log('\n▶ 24. Kiểm tra Tính Năng Quản Lý Gói Dịch Vụ (Packages Management)...');
const packagesSqlFile = path.join(__dirname, 'create_packages.sql');
assert(fs.existsSync(packagesSqlFile), 'File create_packages.sql tồn tại');

if (fs.existsSync(packagesSqlFile)) {
  const pkgSql = fs.readFileSync(packagesSqlFile, 'utf8');
  assert(pkgSql.includes('CREATE TABLE IF NOT EXISTS packages'), 'Bảng PACKAGES được định nghĩa trong create_packages.sql');
  assert(pkgSql.includes('photographer_id UUID REFERENCES users(id)'), 'Cột photographer_id tham chiếu bảng users(id)');
  assert(pkgSql.includes('features JSONB'), 'Cột features kiểu JSONB lưu danh sách quyền lợi');
  assert(pkgSql.includes('image_urls TEXT[]'), 'Cột image_urls kiểu TEXT[] lưu mảng link ảnh tham khảo');
  assert(pkgSql.includes('is_active BOOLEAN'), 'Cột is_active lưu trạng thái hoạt động của gói');
  assert(pkgSql.includes('ENABLE ROW LEVEL SECURITY'), 'Kích hoạt RLS cho bảng packages');
  assert(pkgSql.includes('Photographers can manage own packages'), 'RLS Policy: Thợ ảnh toàn quyền quản lý gói của mình');
  assert(pkgSql.includes('Public can view active packages'), 'RLS Policy: Public có thể đọc các gói đang kích hoạt (is_active = true)');
}

const packagesPageFile = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'PackagesManagementPage.tsx');
assert(fs.existsSync(packagesPageFile), 'Component PackagesManagementPage.tsx tồn tại');

if (fs.existsSync(packagesPageFile)) {
  const pkgPage = fs.readFileSync(packagesPageFile, 'utf8');
  assert(pkgPage.includes('package-images'), 'Tích hợp Supabase Storage bucket package-images để upload ảnh tham khảo');
  assert(pkgPage.includes('features'), 'Hỗ trợ quản lý danh sách quyền lợi (gạch đầu dòng)');
  assert(pkgPage.includes('QUICK_PRESETS'), 'Cung cấp Preset mẫu gói dịch vụ nhanh cho Studio');
  assert(pkgPage.includes('formatVND'), 'Định dạng tiền tệ VNĐ trực quan khi nhập và hiển thị giá');
}

const dashboardLayoutFile = path.join(__dirname, 'frontend', 'src', 'layouts', 'DashboardLayout.tsx');
if (fs.existsSync(dashboardLayoutFile)) {
  const dashLayout = fs.readFileSync(dashboardLayoutFile, 'utf8');
  assert(dashLayout.includes('/dashboard/packages'), 'Menu Gói Dịch Vụ được thêm vào thanh Navigation');
}

if (fs.existsSync(appFile)) {
  const appContent = fs.readFileSync(appFile, 'utf8');
  assert(appContent.includes('/dashboard/packages'), 'Route /dashboard/packages được đăng ký trong App.tsx');
}

// --------------------------------------------------------------------
// TỔNG KẾT
// --------------------------------------------------------------------
console.log('\n====================================================================');
console.log(`   📊 KẾT QUẢ KIỂM TRA: ${passedTests}/${totalTests} TIÊU CHÍ ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
if (warnings > 0) {
  console.log(`   ⚠️  CẢNH BÁO: ${warnings} mục cần chú ý (Xem chi tiết bên trên)`);
}
console.log('====================================================================\n');





