-- ====================================================================
-- LENSY CRM - NÂNG CẤP CƠ SỞ DỮ LIỆU MULTI-TENANCY (SAAS ĐA NGƯỜI DÙNG)
-- File: update_rls.sql
-- ====================================================================

-- 1. Bổ sung cột photographer_id (UUID) vào bảng bookings để định danh thợ ảnh/studio
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Tạo index để tối ưu tốc độ lọc lịch chụp theo thợ ảnh
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_id ON bookings(photographer_id);

-- Đảm bảo Row Level Security (RLS) đã được bật trên bảng bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 2. XÓA CÁC CHÍNH SÁCH (POLICIES) CŨ CỦA BẢNG BOOKINGS (NẾU CÓ)
-- ====================================================================
DROP POLICY IF EXISTS "Public can view booking via quote link" ON bookings;
DROP POLICY IF EXISTS "Public can insert bookings via quote link" ON bookings;
DROP POLICY IF EXISTS "Public can update deposit status via quote link" ON bookings;
DROP POLICY IF EXISTS "Photographers can manage their bookings" ON bookings;
DROP POLICY IF EXISTS "Photographers can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Photographers can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Public can insert bookings with valid photographer" ON bookings;

-- ====================================================================
-- 3. THIẾT LẬP 3 CHÍNH SÁCH RLS MỚI CỰC KỲ CHẶT CHẼ
-- ====================================================================

-- Policy 1: SELECT (Đọc)
-- Thợ ảnh chỉ được phép xem các Booking nếu photographer_id bằng chính auth.uid() của họ
CREATE POLICY "Photographers can view own bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (photographer_id = auth.uid());

-- Policy 2: UPDATE (Sửa)
-- Thợ ảnh chỉ được phép đổi trạng thái / cập nhật Booking nếu photographer_id bằng chính auth.uid() của họ
CREATE POLICY "Photographers can update own bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Policy 3: INSERT (Thêm mới)
-- Cho phép khách vãng lai (ẩn danh) được quyền GỬI form đặt lịch, nhưng dữ liệu gửi lên bắt buộc phải chứa photographer_id hợp lệ (NOT NULL)
CREATE POLICY "Public can insert bookings with valid photographer"
    ON bookings FOR INSERT
    TO anon, authenticated
    WITH CHECK (photographer_id IS NOT NULL);
