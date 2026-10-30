-- =========================================================================
-- MIGRATION: LẤY LỊCH TRỐNG AN TOÀN CHO PUBLIC BOOKING PAGE (REAL-TIME AVAILABILITY)
-- =========================================================================
-- Đảm bảo KHÔNG rò rỉ bất kỳ thông tin nhạy cảm nào (tên khách hàng, SĐT, tiền, ghi chú)
-- CHỈ trả về: event_date, start_time, end_time, status cho các booking đã xác nhận/đặt cọc

CREATE OR REPLACE FUNCTION get_public_unavailable_dates(
  p_studio_id UUID DEFAULT NULL,
  p_photographer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  event_date DATE,
  start_time TIME,
  end_time TIME,
  status VARCHAR(50)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.event_date,
    b.start_time,
    b.end_time,
    b.status
  FROM bookings b
  WHERE 
    b.status IN ('deposited', 'shot', 'editing', 'done', 'da_chot', 'da_tra_file', 'hoan_thanh')
    AND (
      (p_studio_id IS NOT NULL AND b.studio_id = p_studio_id)
      OR 
      (p_photographer_id IS NOT NULL AND b.photographer_id = p_photographer_id)
      OR
      (p_studio_id IS NULL AND p_photographer_id IS NULL)
    );
END;
$$;

-- Cấp quyền thực thi cho anonymous và authenticated client
GRANT EXECUTE ON FUNCTION get_public_unavailable_dates(UUID, UUID) TO anon, authenticated;

