-- ====================================================================
-- FILE: update_proofing_and_webhook_rpc.sql
-- MỤC ĐÍCH: Nâng cấp RPC bảo mật cho Cổng Khách Hàng Chọn Ảnh (Client Proofing)
--           và bổ sung cột thanh toán 2 chiều SePAY / Casso (Idempotency)
-- ====================================================================

BEGIN;

-- 1. Đảm bảo bảng bookings có các cột paid_amount và remaining_amount
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12,2);

-- 2. Đảm bảo bảng transactions có cột reference_code và unique index chống trùng lặp
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference_code VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference_code 
  ON public.transactions(reference_code) 
  WHERE reference_code IS NOT NULL;

-- 3. Tạo hàm RPC bảo mật submit_client_proofing_selection
CREATE OR REPLACE FUNCTION public.submit_client_proofing_selection(
  p_quote_token TEXT,
  p_proofing_session JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_new_status VARCHAR(50);
  v_is_locked BOOLEAN;
BEGIN
  -- Tìm booking qua quote_token
  SELECT id, status INTO v_booking
  FROM public.bookings
  WHERE quote_token = p_quote_token
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found with token: %', p_quote_token;
  END IF;

  v_new_status := v_booking.status;
  v_is_locked := COALESCE((p_proofing_session->>'is_locked')::boolean, false);

  -- Nếu khách đã khóa chốt và đang ở trạng thái deposited, da_chot hoặc shot -> chuyển sang editing
  IF v_is_locked AND v_booking.status IN ('deposited', 'da_chot', 'shot') THEN
    v_new_status := 'editing';
  END IF;

  -- Cập nhật booking
  UPDATE public.bookings
  SET 
    proofing_session = p_proofing_session,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking.id,
    'status', v_new_status,
    'is_locked', v_is_locked
  );
END;
$$;

-- Cấp quyền gọi hàm cho anon và authenticated (dành cho Cổng Client Portal)
GRANT EXECUTE ON FUNCTION public.submit_client_proofing_selection(TEXT, JSONB) TO anon, authenticated;

COMMIT;
