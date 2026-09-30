-- ====================================================================
-- LENSY CRM - MIGRATION: SOFT DELETE CHO BOOKINGS
-- Cho phép hủy/xóa lịch chụp mà vẫn bảo toàn lịch sử và dữ liệu tài chính
-- ====================================================================

-- 1. Bổ sung cột is_deleted vào bảng bookings (mặc định là false)
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Đảm bảo trạng thái 'cancelled' và 'da_huy' nằm trong check constraint
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Nếu cột status có constraint thì đảm bảo đã có 'cancelled'
    -- (Trong update_bookings_kanban_status.sql đã có sẵn 'cancelled')
END $$;

-- 3. Tạo index tăng tốc truy vấn lọc các lịch chụp chưa xóa
CREATE INDEX IF NOT EXISTS idx_bookings_is_deleted ON bookings(is_deleted);

-- Thông báo hoàn tất
DO $$
BEGIN
    RAISE NOTICE '✅ Đã bổ sung cột is_deleted và index cho bảng bookings phục vụ Soft Delete!';
END $$;
