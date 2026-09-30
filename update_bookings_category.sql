-- ====================================================================
-- LENSY CRM - MIGRATION BỔ SUNG CỘT CATEGORY & PACKAGE_TYPE
-- Cho phép tùy chỉnh Loại hình chụp (Studio, Outdoor, Event, Wedding, Lookbook, Portrait, Pre-wedding...)
-- ====================================================================

-- 1. Thêm cột category (loại hình chụp) và package_type (gói chụp) vào bảng bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS package_type VARCHAR(255);

-- 2. Đồng bộ dữ liệu hiện có từ session_type sang category nếu category đang null
UPDATE bookings SET category = session_type WHERE category IS NULL AND session_type IS NOT NULL;
UPDATE bookings SET category = session_type WHERE category IS NULL;

-- 3. Gỡ bỏ ràng buộc cứng check constraint cũ nếu có để hỗ trợ linh hoạt các loại hình mới
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_session_type_check;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_session_type_check' 
          AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_session_type_check;
    END IF;
END $$;

-- 4. Tạo Index tối ưu hóa tìm kiếm & lọc theo category
CREATE INDEX IF NOT EXISTS idx_bookings_category ON bookings(category);
CREATE INDEX IF NOT EXISTS idx_bookings_package_type ON bookings(package_type);
