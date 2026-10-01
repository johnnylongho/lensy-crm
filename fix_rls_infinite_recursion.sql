-- ====================================================================
-- LENSY CRM - FIX ROW LEVEL SECURITY (RLS) INFINITE RECURSION
-- File: fix_rls_infinite_recursion.sql
-- Khắc phục triệt để lỗi: infinite recursion detected in policy for relation "studio_members"
-- khi thực hiện Thêm/Sửa/Xóa lịch chụp (bookings) hoặc truy vấn thành viên Studio.
-- ====================================================================

-- 1. ĐẢM BẢO CÁC HÀM SECURITY DEFINER ĐƯỢC ĐỊNH NGHĨA CHUẨN XÁC
-- Các hàm SECURITY DEFINER được chạy với quyền quản trị viên DB,
-- giúp bypass RLS bên trong hàm và chặn đứng đệ quy vô hạn.

CREATE OR REPLACE FUNCTION is_studio_member(lookup_studio_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM studios s
        WHERE s.id = lookup_studio_id
          AND s.owner_id = lookup_user_id
    ) OR EXISTS (
        SELECT 1 FROM studio_members sm
        WHERE sm.studio_id = lookup_studio_id
          AND sm.user_id = lookup_user_id
          AND sm.status = 'approved'
    );
$$;

CREATE OR REPLACE FUNCTION is_studio_admin_or_owner(lookup_studio_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM studios s
        WHERE s.id = lookup_studio_id
          AND s.owner_id = lookup_user_id
    ) OR EXISTS (
        SELECT 1 FROM studio_members sm
        WHERE sm.studio_id = lookup_studio_id
          AND sm.user_id = lookup_user_id
          AND sm.role = 'admin'
          AND sm.status = 'approved'
    );
$$;

-- Hàm lấy danh sách studio_id mà user tham gia (Security Definer tránh loop RLS)
CREATE OR REPLACE FUNCTION get_user_approved_studio_ids(lookup_user_id UUID)
RETURNS TABLE (studio_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT sm.studio_id FROM studio_members sm
    WHERE sm.user_id = lookup_user_id
      AND sm.status = 'approved';
$$;


-- ====================================================================
-- 2. TÁI THIẾT KẾ POLICIES CHO BẢNG STUDIO_MEMBERS (NGUYÊN NHÂN GỐC RỄ ĐỆ QUY)
-- ====================================================================
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp toàn bộ policies cũ có thể chứa subquery tự lặp
DROP POLICY IF EXISTS "Users can view members of their studios or own requests" ON studio_members;
DROP POLICY IF EXISTS "Users can request to join studio as pending" ON studio_members;
DROP POLICY IF EXISTS "Only studio admins or owners can update member status" ON studio_members;
DROP POLICY IF EXISTS "Users can cancel pending requests or admins remove members" ON studio_members;
DROP POLICY IF EXISTS "studio_members_select_policy" ON studio_members;
DROP POLICY IF EXISTS "studio_members_insert_policy" ON studio_members;
DROP POLICY IF EXISTS "studio_members_update_policy" ON studio_members;
DROP POLICY IF EXISTS "studio_members_delete_policy" ON studio_members;

-- 2.1 Policy SELECT: 
-- User xem bản ghi của chính họ HOẶC xem các thành viên thuộc Studio mà họ làm chủ / đã duyệt.
-- SỬ DỤNG HÀM get_user_approved_studio_ids VÀ studios owner_id (KHÔNG SUBQUERY TRỰC TIẾP LẠI studio_members)
CREATE POLICY "studio_members_select_policy"
    ON studio_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR studio_id IN (SELECT s.id FROM studios s WHERE s.owner_id = auth.uid())
        OR studio_id IN (SELECT studio_id FROM get_user_approved_studio_ids(auth.uid()))
    );

-- 2.2 Policy INSERT:
CREATE POLICY "studio_members_insert_policy"
    ON studio_members FOR INSERT
    TO authenticated
    WITH CHECK (
        (user_id = auth.uid() AND status = 'pending')
        OR is_studio_admin_or_owner(studio_id, auth.uid())
    );

-- 2.3 Policy UPDATE:
CREATE POLICY "studio_members_update_policy"
    ON studio_members FOR UPDATE
    TO authenticated
    USING (is_studio_admin_or_owner(studio_id, auth.uid()))
    WITH CHECK (is_studio_admin_or_owner(studio_id, auth.uid()));

-- 2.4 Policy DELETE:
CREATE POLICY "studio_members_delete_policy"
    ON studio_members FOR DELETE
    TO authenticated
    USING (
        (user_id = auth.uid() AND status = 'pending')
        OR is_studio_admin_or_owner(studio_id, auth.uid())
    );


-- ====================================================================
-- 3. TÁI THIẾT KẾ POLICIES CHO BẢNG BOOKINGS (LỊCH CHỤP)
-- ====================================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp triệt để các policies cũ và các policies có subquery gây loop
DROP POLICY IF EXISTS "Photographers and studio members manage bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can view assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can update assigned bookings" ON bookings;
DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings;

-- 3.1 Policy SELECT (Xem lịch chụp):
-- Thợ ảnh tạo show, Thợ Makeup được phân công, hoặc bất kỳ thành viên Studio nào đã approved
CREATE POLICY "bookings_select_policy"
    ON bookings FOR SELECT
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR makeup_artist_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

-- 3.2 Policy INSERT (Tạo mới lịch chụp / báo giá):
CREATE POLICY "bookings_insert_policy"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

-- 3.3 Policy UPDATE (Cập nhật lịch chụp & Soft delete):
-- Thợ chụp, Thợ Makeup phụ trách show hoặc Admin/Owner của Studio
CREATE POLICY "bookings_update_policy"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR makeup_artist_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    )
    WITH CHECK (
        photographer_id = auth.uid()
        OR makeup_artist_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

-- 3.4 Policy DELETE (Xóa cứng nếu có):
CREATE POLICY "bookings_delete_policy"
    ON bookings FOR DELETE
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_admin_or_owner(studio_id, auth.uid()))
    );

-- Thông báo hoàn thành
DO $$
BEGIN
    RAISE NOTICE '✅ Đã khắc phục triệt để lỗi Infinite Recursion RLS trên studio_members và bookings!';
END $$;
