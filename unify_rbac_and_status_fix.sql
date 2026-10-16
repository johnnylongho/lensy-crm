-- ====================================================================
-- FILE: unify_rbac_and_status_fix.sql
-- MỤC ĐÍCH: Hợp nhất RLS Multi-tenant + RBAC 3 tầng (Manager, Member, Freelancer),
--           hỗ trợ Thợ Makeup (MUA), cho phép Member kéo Kanban và chuẩn hóa Status
-- ====================================================================

BEGIN;

-- 0. BỔ SUNG CỘT role VÀ studio_id CHO BẢNG USERS (KHẮC PHỤC LỖI 42703)
-- Cần tạo 2 cột này trước khi định nghĩa các hàm is_studio_manager và is_studio_member
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'freelancer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'freelancer';

-- Cập nhật ràng buộc vai trò của users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('freelancer', 'manager', 'member', 'admin', 'photographer', 'assistant', 'retoucher'));

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_studio_id ON public.users(studio_id);

-- 1. ĐẢM BẢO CÁC CỘT PHÂN CÔNG NHÂN SỰ TỒN TẠI TRÊN BOOKINGS
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS makeup_artist_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON public.bookings(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_id ON public.bookings(photographer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON public.bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_makeup_artist_id ON public.bookings(makeup_artist_id);

-- 2. HÀM SECURITY DEFINER KIỂM TRA QUYỀN STUDIO MANAGER / OWNER
-- Tránh lỗi đệ quy RLS (Infinite Recursion) và đồng bộ giữa bảng studios, studio_members và users
CREATE OR REPLACE FUNCTION public.is_studio_manager(lookup_studio_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT CASE WHEN lookup_studio_id IS NULL OR lookup_user_id IS NULL THEN FALSE
  ELSE (
    EXISTS (
      SELECT 1 FROM public.studios s
      WHERE s.id = lookup_studio_id AND s.owner_id = lookup_user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.studio_members sm
      WHERE sm.studio_id = lookup_studio_id
        AND sm.user_id = lookup_user_id
        AND sm.status = 'approved'
        AND sm.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = lookup_user_id
        AND u.studio_id = lookup_studio_id
        AND u.role IN ('manager', 'admin')
    )
  ) END;
$$;

-- 3. HÀM SECURITY DEFINER KIỂM TRA THÀNH VIÊN STUDIO (BAO GỒM CẢ MANAGER, PHOTOGRAPHER, MUA)
CREATE OR REPLACE FUNCTION public.is_studio_member(lookup_studio_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT CASE WHEN lookup_studio_id IS NULL OR lookup_user_id IS NULL THEN FALSE
  ELSE (
    public.is_studio_manager(lookup_studio_id, lookup_user_id)
    OR EXISTS (
      SELECT 1 FROM public.studio_members sm
      WHERE sm.studio_id = lookup_studio_id
        AND sm.user_id = lookup_user_id
        AND sm.status = 'approved'
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = lookup_user_id
        AND u.studio_id = lookup_studio_id
    )
  ) END;
$$;

-- 4. XÓA CÁC POLICY BOOKINGS XUNG ĐỘT CŨ
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RBAC Bookings Select Policy" ON public.bookings;
DROP POLICY IF EXISTS "RBAC Bookings Manage Policy" ON public.bookings;
DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Select" ON public.bookings;
DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Insert" ON public.bookings;
DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Update" ON public.bookings;
DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Delete" ON public.bookings;
DROP POLICY IF EXISTS "Unified_Bookings_Select_Policy" ON public.bookings;
DROP POLICY IF EXISTS "Unified_Bookings_Insert_Policy" ON public.bookings;
DROP POLICY IF EXISTS "Unified_Bookings_Update_Policy" ON public.bookings;
DROP POLICY IF EXISTS "Unified_Bookings_Delete_Policy" ON public.bookings;

-- 5. THIẾT LẬP BỘ POLICY CHUẨN HÓA CHO BẢNG BOOKINGS
-- 5A. SELECT:
-- - Studio Manager: Xem toàn bộ lịch của Studio mình
-- - Studio Member (Thợ chụp / Makeup / Phụ máy): Xem lịch được gán cho mình (photographer_id, staff_id, makeup_artist_id)
-- - Freelancer / Cá nhân: Xem lịch do chính mình tạo (photographer_id = auth.uid())
CREATE POLICY "Unified_Bookings_Select_Policy"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    (studio_id IS NOT NULL AND public.is_studio_manager(studio_id, (select auth.uid())))
    OR photographer_id = (select auth.uid())
    OR staff_id = (select auth.uid())
    OR makeup_artist_id = (select auth.uid())
  );

-- 5B. INSERT (Dành cho người dùng đã đăng nhập: Manager hoặc Freelancer)
CREATE POLICY "Unified_Bookings_Insert_Policy"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    (studio_id IS NOT NULL AND public.is_studio_manager(studio_id, (select auth.uid())))
    OR (photographer_id = (select auth.uid()))
  );

-- 5C. UPDATE:
-- Cho phép cả Manager, Freelancer sở hữu show, VÀ Thành viên Ekip (Photographer/MUA) được phân công
-- cập nhật trạng thái Kanban (deposited -> shot -> editing -> done) hoặc gắn thiết bị
CREATE POLICY "Unified_Bookings_Update_Policy"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    (studio_id IS NOT NULL AND public.is_studio_manager(studio_id, (select auth.uid())))
    OR photographer_id = (select auth.uid())
    OR staff_id = (select auth.uid())
    OR makeup_artist_id = (select auth.uid())
  )
  WITH CHECK (
    (studio_id IS NOT NULL AND public.is_studio_manager(studio_id, (select auth.uid())))
    OR photographer_id = (select auth.uid())
    OR staff_id = (select auth.uid())
    OR makeup_artist_id = (select auth.uid())
  );

-- 5D. DELETE: Chỉ Manager của Studio hoặc Freelancer sở hữu show độc lập mới được xóa
CREATE POLICY "Unified_Bookings_Delete_Policy"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (
    (studio_id IS NOT NULL AND public.is_studio_manager(studio_id, (select auth.uid())))
    OR (studio_id IS NULL AND photographer_id = (select auth.uid()))
  );

-- 6. MỞ RỘNG RÀNG BUỘC TRẠNG THÁI (STATUS CHECK CONSTRAINT) HỖ TRỢ CẢ KANBAN & LEGACY
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'lead', 'deposited', 'shot', 'editing', 'done', 'cancelled',
    'cho_coc', 'cho_xac_nhan_coc', 'confirmed', 'da_chot', 'da_tra_file', 'hoan_thanh', 'da_huy'
  ));

-- 7. BỔ SUNG CỘT VÀ RPC BẢO MẬT CLIENT PROOFING + CHỐNG TRÙNG LẶP WEBHOOK
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12,2);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference_code VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference_code 
  ON public.transactions(reference_code) 
  WHERE reference_code IS NOT NULL;

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
  SELECT id, status INTO v_booking
  FROM public.bookings
  WHERE quote_token = p_quote_token
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found with token: %', p_quote_token;
  END IF;

  v_new_status := v_booking.status;
  v_is_locked := COALESCE((p_proofing_session->>'is_locked')::boolean, false);

  IF v_is_locked AND v_booking.status IN ('deposited', 'da_chot', 'shot') THEN
    v_new_status := 'editing';
  END IF;

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

GRANT EXECUTE ON FUNCTION public.submit_client_proofing_selection(TEXT, JSONB) TO anon, authenticated;

COMMIT;
