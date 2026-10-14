-- ====================================================================
-- MIGRATION: BỔ SUNG THÔNG TIN BÀN GIAO FILE ẢNH & CLIENT PORTAL
-- ====================================================================

-- 1. Bổ sung các cột lưu thông tin bàn giao vào bảng bookings
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS drive_delivery_link TEXT,
    ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- 2. Đánh Index tăng tốc tìm kiếm các show đã hoặc chưa trả link ảnh
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_date ON bookings(delivery_date);

-- 3. Cập nhật comment giải thích
COMMENT ON COLUMN bookings.drive_delivery_link IS 'Đường dẫn link Google Drive, Pixieset hoặc Dropbox để khách tải ảnh';
COMMENT ON COLUMN bookings.delivery_date IS 'Thời điểm bàn giao ảnh hoàn tất cho khách hàng';
COMMENT ON COLUMN bookings.delivery_notes IS 'Ghi chú bàn giao ảnh (mật khẩu giải nén, hạn lưu trữ link, lời nhắn)';
