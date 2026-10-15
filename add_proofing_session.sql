-- Migration: Thêm trường proofing_session vào bảng bookings để lưu trữ thông tin chọn ảnh của khách hàng (Client Proofing Portal)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS proofing_session JSONB DEFAULT '{}'::jsonb;

-- Comment mô tả
COMMENT ON COLUMN bookings.proofing_session IS 'Lưu trữ thông tin phiên chọn ảnh: link preview, số lượng tối đa, danh sách file khách chọn (selected_filenames, items), trạng thái khóa (is_locked), thời gian khóa và ghi chú yêu cầu retouch.';
