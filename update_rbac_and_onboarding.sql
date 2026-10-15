-- ====================================================================
-- LENSY CRM - HỆ THỐNG PHÂN QUYỀN RBAC & ONBOARDING ROLE SELECTION
-- HỖ TRỢ 3 ĐỐI TƯỢNG: FREELANCER, STUDIO MANAGER, VÀ STUDIO MEMBER
-- File: update_rbac_and_onboarding.sql
-- ====================================================================

-- 1. NÂNG CẤP BẢNG USERS VỚI 2 CỘT QUAN TRỌNG: role & studio_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'freelancer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE SET NULL;

-- Cập nhật ràng buộc vai trò chuẩn xác 3 nhóm: freelancer, manager, member
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('freelancer', 'manager', 'member', 'admin', 'photographer', 'assistant', 'retoucher'));

-- 2. BỔ SUNG CỘT invite_code CHO BẢNG STUDIOS
ALTER TABLE studios ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;

-- Sinh mã mời mặc định cho các studio hiện có nếu chưa có mã mời
UPDATE studios
SET invite_code = 'MIRMIA-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))
WHERE invite_code IS NULL;

-- 3. ĐỒNG BỘ DỮ LIỆU CŨ SANG HỆ THỐNG ROLE MỚI
-- A. Quản lý / Chủ studio: Nếu sở hữu studio trong bảng studios
UPDATE users u
SET role = 'manager', studio_id = s.id
FROM studios s
WHERE s.owner_id = u.id AND (u.role IS NULL OR u.role IN ('admin', 'freelancer'));

-- B. Thành viên studio: Nếu có trong bảng studio_members
UPDATE users u
SET role = 'member', studio_id = sm.studio_id
FROM studio_members sm
WHERE sm.user_id = u.id AND sm.status = 'approved' AND u.role NOT IN ('manager');

-- C. Các tài khoản còn lại: Mặc định là freelancer
UPDATE users
SET role = 'freelancer'
WHERE role IS NULL OR role NOT IN ('freelancer', 'manager', 'member');

-- Tạo index tăng tốc truy vấn theo role và studio_id
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_studio_id ON users(studio_id);
CREATE INDEX IF NOT EXISTS idx_studios_invite_code ON studios(invite_code);

-- 4. BỔ SUNG CỘT staff_id CHO BẢNG BOOKINGS (NẾU CHƯA CÓ)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);

-- Gán mặc định staff_id = photographer_id cho dữ liệu hiện hữu
UPDATE bookings
SET staff_id = photographer_id
WHERE staff_id IS NULL AND photographer_id IS NOT NULL;

-- 5. THIẾT LẬP ROW LEVEL SECURITY (RLS) THEO PHÂN QUYỀN RBAC
-- Kích hoạt RLS trên bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Xóa các policy select cũ liên quan
DROP POLICY IF EXISTS "RBAC Bookings Select Policy" ON bookings;
DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Select" ON bookings;

-- A. POLICY SELECT: 
-- - Manager: Xem toàn bộ bookings của studio_id mình quản lý
-- - Member: CHỈ xem bookings có staff_id = auth.uid() HOẶC photographer_id = auth.uid()
-- - Freelancer: Xem bookings có photographer_id = auth.uid() và không gắn studio
CREATE POLICY "RBAC Bookings Select Policy"
    ON bookings FOR SELECT
    TO authenticated
    USING (
        -- Trường hợp 1: User là Manager của Studio
        (studio_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
              AND u.role = 'manager'
              AND u.studio_id = bookings.studio_id
        ))
        OR
        -- Trường hợp 2: User là Member của Studio (CHỈ XEM LỊCH GẮN VỚI MÌNH)
        (EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
              AND u.role = 'member'
              AND (bookings.staff_id = auth.uid() OR bookings.photographer_id = auth.uid())
        ))
        OR
        -- Trường hợp 3: User là Freelancer (Lịch cá nhân)
        (photographer_id = auth.uid() AND (studio_id IS NULL OR EXISTS (
            SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'freelancer'
        )))
    );

-- B. POLICY INSERT / UPDATE / DELETE DÀNH CHO MANAGER & FREELANCER
DROP POLICY IF EXISTS "RBAC Bookings Manage Policy" ON bookings;
CREATE POLICY "RBAC Bookings Manage Policy"
    ON bookings FOR ALL
    TO authenticated
    USING (
        -- Manager được toàn quyền (CRUD) trên các record cùng studio_id
        (studio_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
              AND u.role = 'manager'
              AND u.studio_id = bookings.studio_id
        ))
        OR
        -- Freelancer được toàn quyền trên lịch chụp của chính mình
        (photographer_id = auth.uid() AND studio_id IS NULL)
    )
    WITH CHECK (
        (studio_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
              AND u.role = 'manager'
              AND u.studio_id = bookings.studio_id
        ))
        OR
        (photographer_id = auth.uid() AND studio_id IS NULL)
    );

COMMENT ON COLUMN users.role IS 'Phân quyền tài khoản Lensy: freelancer, manager, member';
COMMENT ON COLUMN users.studio_id IS 'Mã Studio trực thuộc (nếu là manager hoặc member)';
COMMENT ON COLUMN studios.invite_code IS 'Mã tham gia studio dành cho thành viên ekip';
