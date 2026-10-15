-- ====================================================================
-- LENSY CRM - MIGRATION DDL: PHÂN CÔNG Ê-KÍP & HẠCH TOÁN THÙ LAO (CREW & PAYROLL)
-- File: add_crew_assignments.sql
-- ====================================================================

-- 1. Bổ sung cột crew_assignments vào bảng bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS crew_assignments JSONB DEFAULT '[]'::jsonb;

-- 2. Đặt comment mô tả cột
COMMENT ON COLUMN bookings.crew_assignments IS 'Danh sách phân công ê-kíp (Thợ chính, Thợ phụ, Makeup, Retoucher, Quay phim...) kèm mức thù lao, hình thức tính và trạng thái thanh toán';

-- 3. Tạo GIN index tối ưu hóa truy vấn JSONB nếu cần tìm kiếm theo nhân sự
CREATE INDEX IF NOT EXISTS idx_bookings_crew_assignments ON bookings USING gin (crew_assignments);
