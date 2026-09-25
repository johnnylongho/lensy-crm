-- ====================================================================
-- LENSY CRM (MIRMIA STUDIO & ACADEMY) - MULTI-TENANT MIGRATION DDL
-- TÁI CẤU TRÚC CƠ SỞ DỮ LIỆU SANG MÔ HÌNH MULTI-TENANTS (WORKSPACES)
-- QUẢN LÝ FREELANCER VÀ STUDIO VỚI CƠ CHẾ XÁC THỰC BẮT TAY KÉP
-- File: multi_tenant_migration.sql
-- ====================================================================

-- 0. KÍCH HOẠT TIỆN ÍCH MỞ RỘNG CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Hàm tiện ích cập nhật updated_at (nếu chưa có)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 1. ĐỊNH NGHĨA CÁC KIỂU ENUM CHO HỆ THỐNG MULTI-TENANT
-- ====================================================================

-- Enum loại tài khoản người dùng: thợ tự do (freelancer) hoặc thuộc studio (studio_member)
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('freelancer', 'studio_member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum vai trò thành viên trong Studio: Quản trị viên (admin) hoặc Thợ ảnh (photographer)
DO $$ BEGIN
    CREATE TYPE studio_role_enum AS ENUM ('admin', 'photographer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum trạng thái thành viên (Cơ chế Bắt tay kép): Chờ duyệt (pending), Đã duyệt (approved), Từ chối (rejected)
DO $$ BEGIN
    CREATE TYPE member_status_enum AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 2. CẬP NHẬT BẢNG USERS
-- ====================================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_type account_type_enum NOT NULL DEFAULT 'freelancer';

-- Index tăng tốc lọc người dùng theo loại tài khoản
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- ====================================================================
-- 3. TẠO BẢNG STUDIOS (ĐẠI DIỆN CHO TENANT / WORKSPACE)
-- ====================================================================
CREATE TABLE IF NOT EXISTS studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    verified_status BOOLEAN NOT NULL DEFAULT false,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index tăng tốc tìm kiếm và quản lý studio
CREATE INDEX IF NOT EXISTS idx_studios_owner_id ON studios(owner_id);
CREATE INDEX IF NOT EXISTS idx_studios_name ON studios(name);
CREATE INDEX IF NOT EXISTS idx_studios_verified_status ON studios(verified_status);

-- Trigger cập nhật updated_at cho studios
DROP TRIGGER IF EXISTS trg_studios_updated_at ON studios;
CREATE TRIGGER trg_studios_updated_at
    BEFORE UPDATE ON studios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 4. TẠO BẢNG STUDIO_MEMBERS (CƠ CHẾ XÁC THỰC BẮT TAY KÉP)
-- ====================================================================
-- Logic:
-- Khi thợ ảnh muốn gia nhập Studio, tạo bản ghi với status = 'pending'.
-- Chỉ khi Admin của Studio duyệt (update status = 'approved') thì thợ ảnh
-- mới chính thức thuộc Studio.
CREATE TABLE IF NOT EXISTS studio_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role studio_role_enum NOT NULL DEFAULT 'photographer',
    status member_status_enum NOT NULL DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ràng buộc chống trùng lặp: mỗi user chỉ có 1 quan hệ với 1 studio tại 1 thời điểm
    CONSTRAINT unique_studio_member UNIQUE (studio_id, user_id)
);

-- Index tăng tốc truy vấn phân quyền & danh sách thành viên
CREATE INDEX IF NOT EXISTS idx_studio_members_studio_id ON studio_members(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_members_user_id ON studio_members(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_members_status ON studio_members(status);
CREATE INDEX IF NOT EXISTS idx_studio_members_role ON studio_members(role);

-- Trigger cập nhật updated_at cho studio_members
DROP TRIGGER IF EXISTS trg_studio_members_updated_at ON studio_members;
CREATE TRIGGER trg_studio_members_updated_at
    BEFORE UPDATE ON studio_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 5. HÀM HỖ TRỢ BẢO MẬT & TRIGGER TỰ ĐỘNG GÁN OWNER LÀ ADMIN
-- ====================================================================

-- Hàm kiểm tra quyền Admin hoặc Owner của Studio (SECURITY DEFINER để tránh đệ quy RLS)
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

-- Trigger tự động thêm Owner của Studio vào bảng studio_members với role='admin' & status='approved'
CREATE OR REPLACE FUNCTION handle_new_studio_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO studio_members (studio_id, user_id, role, status)
    VALUES (NEW.id, NEW.owner_id, 'admin', 'approved')
    ON CONFLICT (studio_id, user_id) 
    DO UPDATE SET role = 'admin', status = 'approved', updated_at = NOW();
    
    -- Tùy chọn: Đồng bộ cập nhật account_type của user thành 'studio_member'
    UPDATE users 
    SET account_type = 'studio_member' 
    WHERE id = NEW.owner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_studio_owner_member ON studios;
CREATE TRIGGER trg_studio_owner_member
    AFTER INSERT ON studios
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_studio_owner();

-- ====================================================================
-- 6. THIẾT LẬP ROW LEVEL SECURITY (RLS) CHẶT CHẼ
-- ====================================================================

-- --------------------------------------------------------------------
-- A. RLS CHO BẢNG STUDIOS
-- --------------------------------------------------------------------
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp policies cũ nếu có
DROP POLICY IF EXISTS "Allow authenticated users to view studios" ON studios;
DROP POLICY IF EXISTS "Allow users to create their own studio" ON studios;
DROP POLICY IF EXISTS "Studio owners and admins can update studio" ON studios;
DROP POLICY IF EXISTS "Only studio owner can delete studio" ON studios;

-- 1. Bất kỳ ai đăng nhập cũng có thể đọc (để tìm kiếm studio)
CREATE POLICY "Allow authenticated users to view studios"
    ON studios FOR SELECT
    TO authenticated
    USING (true);

-- 2. Cho phép người dùng tạo Studio và gán chính mình làm owner_id
CREATE POLICY "Allow users to create their own studio"
    ON studios FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

-- 3. Chỉ owner_id hoặc member có role 'admin' (đã approved) mới được sửa thông tin studio
CREATE POLICY "Studio owners and admins can update studio"
    ON studios FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid() OR is_studio_admin_or_owner(id, auth.uid()))
    WITH CHECK (owner_id = auth.uid() OR is_studio_admin_or_owner(id, auth.uid()));

-- 4. Chỉ chủ sở hữu (owner_id) mới có quyền xóa Studio
CREATE POLICY "Only studio owner can delete studio"
    ON studios FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- --------------------------------------------------------------------
-- B. RLS CHO BẢNG STUDIO_MEMBERS
-- --------------------------------------------------------------------
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp policies cũ nếu có
DROP POLICY IF EXISTS "Users can view members of their studios or own requests" ON studio_members;
DROP POLICY IF EXISTS "Users can request to join studio as pending" ON studio_members;
DROP POLICY IF EXISTS "Only studio admins or owners can update member status" ON studio_members;
DROP POLICY IF EXISTS "Users can cancel pending requests or admins remove members" ON studio_members;

-- 1. Xem danh sách thành viên:
--    - Xem chính các yêu cầu/thành viên của mình (user_id = auth.uid())
--    - Chủ studio hoặc Admin xem toàn bộ danh sách thành viên của studio đó
--    - Thành viên đã được duyệt (approved) xem được đồng nghiệp cùng studio
CREATE POLICY "Users can view members of their studios or own requests"
    ON studio_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR is_studio_admin_or_owner(studio_id, auth.uid())
        OR EXISTS (
            SELECT 1 FROM studio_members sm
            WHERE sm.studio_id = studio_members.studio_id
              AND sm.user_id = auth.uid()
              AND sm.status = 'approved'
        )
    );

-- 2. Thêm thành viên (Gửi yêu cầu hoặc Admin mời):
--    - Người dùng có thể tự tạo request (insert với status = 'pending')
--    - Hoặc Admin / Owner của studio mời trực tiếp
CREATE POLICY "Users can request to join studio as pending"
    ON studio_members FOR INSERT
    TO authenticated
    WITH CHECK (
        (user_id = auth.uid() AND status = 'pending')
        OR is_studio_admin_or_owner(studio_id, auth.uid())
    );

-- 3. Cập nhật thông tin thành viên (Đặc biệt là cột status):
--    - CHỈ Admin hoặc Owner của Studio đó mới có quyền update cột status (hoặc phân quyền role)
CREATE POLICY "Only studio admins or owners can update member status"
    ON studio_members FOR UPDATE
    TO authenticated
    USING (is_studio_admin_or_owner(studio_id, auth.uid()))
    WITH CHECK (is_studio_admin_or_owner(studio_id, auth.uid()));

-- 4. Xóa yêu cầu hoặc xóa thành viên:
--    - Người dùng có thể tự hủy đơn xin gia nhập đang chờ duyệt (pending)
--    - Hoặc Admin / Owner của Studio có quyền xóa thành viên / từ chối
CREATE POLICY "Users can cancel pending requests or admins remove members"
    ON studio_members FOR DELETE
    TO authenticated
    USING (
        (user_id = auth.uid() AND status = 'pending')
        OR is_studio_admin_or_owner(studio_id, auth.uid())
    );

-- ====================================================================
-- 7. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA TEST MULTI-TENANTS)
-- ====================================================================
DO $$
DECLARE
    sample_owner_id UUID;
    sample_studio_id UUID;
    sample_photographer_id UUID;
BEGIN
    -- Lấy hoặc tìm user đầu tiên làm owner
    SELECT id INTO sample_owner_id FROM users LIMIT 1;
    
    IF sample_owner_id IS NOT NULL THEN
        -- 1. Tạo Studio mẫu
        INSERT INTO studios (id, name, logo_url, verified_status, owner_id)
        VALUES (
            'a0000000-0000-0000-0000-000000000001'::uuid,
            'MIRMIA STUDIO & ACADEMY WORKSPACE',
            '/mirmia-logo.png',
            true,
            sample_owner_id
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            verified_status = EXCLUDED.verified_status;
            
        -- Cập nhật tài khoản owner thành studio_member
        UPDATE users 
        SET account_type = 'studio_member' 
        WHERE id = sample_owner_id;

        -- 2. Tạo hoặc kiểm tra thợ ảnh thứ 2 (nếu có) để tạo request 'pending'
        SELECT id INTO sample_photographer_id 
        FROM users 
        WHERE id != sample_owner_id 
        LIMIT 1;

        IF sample_photographer_id IS NOT NULL THEN
            INSERT INTO studio_members (studio_id, user_id, role, status)
            VALUES (
                'a0000000-0000-0000-0000-000000000001'::uuid,
                sample_photographer_id,
                'photographer',
                'pending'
            )
            ON CONFLICT (studio_id, user_id) DO NOTHING;
        END IF;
    END IF;
END $$;
