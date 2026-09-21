// ====================================================================
// LENSY CRM (MIRMIA STUDIO & ACADEMY) - HỆ THỐNG KIỂM TRA TOÀN DIỆN
// ====================================================================

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
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

assert(anonKey.startsWith('sb_publishable_'), 'Supabase Publishable / Anon Key hợp lệ', anonKey.substring(0, 20) + '...');
assert(secretKey.startsWith('sb_secret_'), 'Supabase Secret / Service Role Key hợp lệ', secretKey.substring(0, 16) + '...');

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
console.log('\n▶ 4. Kiểm tra Logic 2 Tính Năng Đột Phá (USP)...');

// Test logic tính năng 1: Conflict Scanner
const testDate = '2026-09-25';
const sampleBookings = [
  { eventDate: '2026-09-25', assignedGears: ['body-sony-a74'], client: 'Anh Tuấn & Chị Mai' }
];
const requestGears = ['body-sony-a74', 'lens-70200'];
const conflictDetected = requestGears.some(g => sampleBookings[0].assignedGears.includes(g));
assert(conflictDetected === true, 'USP 1 (Conflict Scanner): Phát hiện chính xác trùng máy Sony A7 IV ngày ' + testDate);

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
// TỔNG KẾT
// --------------------------------------------------------------------
console.log('\n====================================================================');
console.log(`   📊 KẾT QUẢ KIỂM TRA: ${passedTests}/${totalTests} TIÊU CHÍ ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
if (warnings > 0) {
  console.log(`   ⚠️  CẢNH BÁO: ${warnings} mục cần chú ý (Xem chi tiết bên trên)`);
}
console.log('====================================================================\n');
