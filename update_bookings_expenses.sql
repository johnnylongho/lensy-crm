-- ==========================================================
-- Lensy CRM - Migration: Add expenses & expense_details for Net Profit
-- Mục tiêu: Nâng cấp bảng `bookings` để lưu trữ chi phí phát sinh
-- của từng lịch chụp, phục vụ tính toán Lợi nhuận ròng (Net Profit).
-- ==========================================================

-- 1. Thêm cột tổng chi phí `expenses` (Kiểu NUMERIC(12, 2), mặc định 0) an toàn với IF NOT EXISTS
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS expenses NUMERIC(12, 2) DEFAULT 0;

-- 2. Thêm cột chi tiết các khoản chi `expense_details` (Kiểu JSONB, mặc định mảng rỗng [])
-- Cấu trúc mẫu: [{"name": "Makeup", "amount": 1500000}, {"name": "Taxi / Di chuyển", "amount": 300000}]
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS expense_details JSONB DEFAULT '[]'::jsonb;

-- 3. Gắn chú thích mô tả cho cột (Metadata trên Supabase Studio)
COMMENT ON COLUMN bookings.expenses IS 'Tổng chi phí phát sinh của lịch chụp (VNĐ) phục vụ tính Lợi nhuận ròng (Net Profit)';
COMMENT ON COLUMN bookings.expense_details IS 'Danh sách chi tiết các khoản chi phí dạng JSONB array: [{"name": "Makeup", "amount": 1500000}, {"name": "Taxi", "amount": 300000}]';

-- 4. (Tùy chọn) Gán dữ liệu mẫu chi phí cho booking đầu tiên để sẵn sàng kiểm thử giao diện
UPDATE bookings 
SET 
    expenses = 1800000,
    expense_details = '[{"name": "Makeup artist", "amount": 1500000}, {"name": "Taxi di chuyển", "amount": 300000}]'::jsonb
WHERE id = (
    SELECT id FROM bookings 
    WHERE (expenses IS NULL OR expenses = 0)
    ORDER BY created_at DESC 
    LIMIT 1
);
