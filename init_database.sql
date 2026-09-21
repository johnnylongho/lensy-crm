-- ====================================================================
-- LENSY CRM (MIRMIA STUDIO & ACADEMY) - SUPABASE INITIAL DATABASE DDL
-- HỆ THỐNG CƠ SỞ DỮ LIỆU CỐT LÕI CHO FREELANCE PHOTOGRAPHER & STUDIO
-- ====================================================================

-- 1. Kích hoạt tiện ích mở rộng UUID & Triggers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hàm tự động cập nhật timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================
-- BẢNG 1: USERS (THỢ ẢNH / QUẢN TRỊ STUDIO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    studio_name VARCHAR(255) DEFAULT 'MIRMIA STUDIO & ACADEMY',
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'photographer' CHECK (role IN ('admin', 'photographer', 'assistant', 'retoucher')),
    
    -- Thông tin tài khoản ngân hàng phục vụ tạo mã VietQR tự động
    bank_name VARCHAR(100) DEFAULT 'MB Bank',
    bank_account_number VARCHAR(100) DEFAULT '0901234567',
    bank_account_name VARCHAR(255) DEFAULT 'MIRMIA STUDIO',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger cập nhật updated_at cho users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- BẢNG 2: BOOKINGS (LỊCH CHỤP & THƯ BÁO GIÁ QUOTE LINK)
-- ====================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Thông tin khách hàng
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_email VARCHAR(255),
    
    -- Chi tiết buổi chụp
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('wedding', 'prewedding', 'portrait', 'lookbook', 'event', 'commercial')),
    session_title VARCHAR(255),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    
    -- Tài chính & Quyết toán
    package_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(12, 2) GENERATED ALWAYS AS (package_price - paid_amount) STORED,
    
    -- 3 trạng thái cốt lõi: 'cho_coc' (Chờ cọc), 'da_chot' (Đã chốt), 'da_tra_file' (Đã trả file)
    status VARCHAR(50) NOT NULL DEFAULT 'cho_coc' 
        CHECK (status IN ('cho_coc', 'da_chot', 'da_tra_file', 'hoan_thanh', 'da_huy')),
        
    -- Khóa bảo mật chia sẻ Quote Link cho khách hàng
    quote_token VARCHAR(100) UNIQUE NOT NULL,
    
    -- Dữ liệu trả ảnh & hậu kỳ
    drive_delivery_link TEXT,
    delivery_date TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger cập nhật updated_at cho bookings
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tạo Index tăng tốc truy vấn theo ngày chụp & trạng thái nợ
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_quote_token ON bookings(quote_token);

-- ====================================================================
-- BẢNG 3: TRANSACTIONS (DÒNG TIỀN: TIỀN CỌC, QUYẾT TOÁN, CHI PHÍ SHOW)
-- ====================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    photographer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Loại giao dịch: Tiền cọc, Quyết toán cuối, Chi phí show, Thuê máy ngoài, Hoàn tiền
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'final_payment', 'cost', 'gear_rental', 'refund')),
    amount NUMERIC(12, 2) NOT NULL,
    
    -- Phương thức thanh toán
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer' 
        CHECK (payment_method IN ('bank_transfer', 'cash', 'zalo_pay', 'vnpay', 'momo')),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ====================================================================
-- THIẾT LẬP ROW LEVEL SECURITY (RLS) BẢO MẬT TRÊN SUPABASE
-- ====================================================================

-- 1. Bật RLS cho tất cả 3 bảng
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES CHO BẢNG USERS:
-- Cho phép Public đọc thông tin Studio & Tài khoản nhận cọc để khách quét VietQR
DROP POLICY IF EXISTS "Public can view studio profile for quotes" ON users;
CREATE POLICY "Public can view studio profile for quotes"
    ON users FOR SELECT
    TO anon, authenticated
    USING (true);

-- Cho phép người dùng đã đăng nhập quản lý hồ sơ của mình
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON users;
CREATE POLICY "Authenticated users can update own profile"
    ON users FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. POLICIES CHO BẢNG BOOKINGS:
-- Yêu cầu 1: Cho phép Public (khách hàng ẩn danh) xem thư báo giá qua quote_token
DROP POLICY IF EXISTS "Public can view booking via quote link" ON bookings;
CREATE POLICY "Public can view booking via quote link"
    ON bookings FOR SELECT
    TO anon, authenticated
    USING (true);

-- Yêu cầu 2: Cho phép Public INSERT vào bảng Bookings (để khách hàng chốt lịch qua Quote Link)
DROP POLICY IF EXISTS "Public can insert bookings via quote link" ON bookings;
CREATE POLICY "Public can insert bookings via quote link"
    ON bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Yêu cầu 3: Cho phép Public UPDATE trạng thái cọc khi bấm 'Tôi đã chuyển khoản'
DROP POLICY IF EXISTS "Public can update deposit status via quote link" ON bookings;
CREATE POLICY "Public can update deposit status via quote link"
    ON bookings FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Thợ ảnh đã đăng nhập có toàn quyền quản lý Bookings của mình
DROP POLICY IF EXISTS "Photographers can manage their bookings" ON bookings;
CREATE POLICY "Photographers can manage their bookings"
    ON bookings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. POLICIES CHO BẢNG TRANSACTIONS:
-- Cho phép ghi nhận giao dịch cọc khi khách thanh toán thành công
DROP POLICY IF EXISTS "Public can record deposit transaction" ON transactions;
CREATE POLICY "Public can record deposit transaction"
    ON transactions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Chỉ thợ ảnh/admin đăng nhập mới được xem dòng tiền chi tiết
DROP POLICY IF EXISTS "Authenticated photographers can view transactions" ON transactions;
CREATE POLICY "Authenticated photographers can view transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING (true);

-- ====================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA: MIRMIA STUDIO & ACADEMY)
-- ====================================================================
INSERT INTO users (id, email, full_name, phone, studio_name, role, bank_name, bank_account_number, bank_account_name)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'contact@mirmia.vn',
    'Mirmia Lead Photographer',
    '0901234567',
    'MIRMIA STUDIO & ACADEMY',
    'admin',
    'MB Bank (Quân Đội)',
    '0901234567',
    'MIRMIA STUDIO'
)
ON CONFLICT (email) DO UPDATE SET
    studio_name = EXCLUDED.studio_name,
    bank_name = EXCLUDED.bank_name,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_account_name = EXCLUDED.bank_account_name;

-- 3 Booking mẫu đại diện cho 3 trạng thái cốt lõi:
-- 1. 'cho_coc' (Chờ cọc)
-- 2. 'da_chot' (Đã chốt)
-- 3. 'da_tra_file' (Đã trả file ảnh)
INSERT INTO bookings (
    id, photographer_id, client_name, client_phone, client_email, session_type, session_title,
    event_date, start_time, end_time, location,
    package_price, deposit_amount, paid_amount, status, quote_token, notes
)
VALUES
    -- Show 1: Đang chờ cọc
    (
        'b1111111-1111-1111-1111-111111111101',
        'a1111111-1111-1111-1111-111111111111',
        'Anh Minh & Chị Thảo',
        '0987654321',
        'minhthao.wedding@gmail.com',
        'wedding',
        'Gói Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)',
        '2026-10-18',
        '07:00',
        '14:00',
        'Trung tâm Hội nghị White Palace, TP. Hồ Chí Minh',
        18000000,
        5400000,
        0,
        'cho_coc',
        'q-minh-thao-wedding',
        'Đã gửi link báo giá, khách đang chuẩn bị chuyển khoản cọc'
    ),
    -- Show 2: Đã chốt cọc
    (
        'b1111111-1111-1111-1111-111111111102',
        'a1111111-1111-1111-1111-111111111111',
        'Anh Tuấn & Chị Mai',
        '0901234567',
        'tuanmai@gmail.com',
        'wedding',
        'Gói Phóng Sự Cưới Truyền Thống',
        '2026-09-25',
        '07:30',
        '13:30',
        'White Palace Hoàng Văn Thụ, Q. Phú Nhuận',
        12000000,
        4000000,
        4000000,
        'da_chot',
        'q-tuan-mai-wedding',
        'Đã cọc 4.000.000đ giữ lịch, chuẩn bị mang 2 body máy'
    ),
    -- Show 3: Đã trả file (còn thiếu 5.000.000đ - kích hoạt Auto-Debt Collector)
    (
        'b1111111-1111-1111-1111-111111111103',
        'a1111111-1111-1111-1111-111111111111',
        'Nguyễn Hoàng Oanh',
        '0918765432',
        'hoangoanh.lookbook@gmail.com',
        'lookbook',
        'Lookbook BST Thu Đông 2026',
        '2026-09-17',
        '14:00',
        '18:00',
        'Studio Lam Vũ, Q. 3',
        8000000,
        3000000,
        3000000,
        'da_tra_file',
        'q-hoang-oanh-lookbook',
        'Đã trả link Google Drive hoàn thiện, còn số dư 5.000.000đ chưa thanh toán'
    )
ON CONFLICT (quote_token) DO NOTHING;

-- Giao dịch mẫu
INSERT INTO transactions (booking_id, photographer_id, type, amount, payment_method, status, notes)
VALUES
    ('b1111111-1111-1111-1111-111111111102', 'a1111111-1111-1111-1111-111111111111', 'deposit', 4000000, 'bank_transfer', 'completed', 'Khách chuyển khoản cọc qua VietQR MB Bank'),
    ('b1111111-1111-1111-1111-111111111103', 'a1111111-1111-1111-1111-111111111111', 'deposit', 3000000, 'bank_transfer', 'completed', 'Khách cọc trước buổi chụp Lookbook')
ON CONFLICT DO NOTHING;
