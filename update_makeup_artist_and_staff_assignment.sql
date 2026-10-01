-- ====================================================================
-- LENSY CRM - MIGRATION DDL: QUẢN LÝ THỢ MAKEUP (MUA) & PHÂN CÔNG NHÂN SỰ CHÉO
-- File: update_makeup_artist_and_staff_assignment.sql
-- ====================================================================

-- 1. NÂNG CẤP BẢNG PHÂN QUYỀN (studio_members):
-- Hỗ trợ các vai trò: 'admin' (Quản lý), 'photographer' (Thợ chụp), 'makeup_artist' (Thợ Makeup)
-- ====================================================================

-- 1.1 Cập nhật Enum studio_role_enum nếu đang sử dụng ENUM Type
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'studio_role_enum') THEN
        BEGIN
            ALTER TYPE studio_role_enum ADD VALUE IF NOT EXISTS 'makeup_artist';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
            WHEN others THEN NULL;
        END;
    END IF;
END $$;

-- 1.2 Đảm bảo ràng buộc CHECK cho cột role trong studio_members (nếu là VARCHAR hoặc TEXT)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'studio_members' AND column_name = 'role'
    ) THEN
        ALTER TABLE studio_members DROP CONSTRAINT IF EXISTS studio_members_role_check;
        ALTER TABLE studio_members 
            ADD CONSTRAINT studio_members_role_check 
            CHECK (role::text IN ('admin', 'photographer', 'makeup_artist'));
    END IF;
END $$;

-- 1.3 Cập nhật ràng buộc CHECK trên bảng users nếu có phân vai trò
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role::text IN ('admin', 'photographer', 'makeup_artist', 'assistant', 'retoucher'));
    END IF;
END $$;

COMMENT ON COLUMN studio_members.role IS 'Vai trò thành viên trong Studio: admin (Quản lý), photographer (Thợ chụp), makeup_artist (Thợ Makeup)';


-- ====================================================================
-- 2. CẬP NHẬT BẢNG LỊCH CHỤP (bookings):
-- - makeup_artist_id (UUID, references users(id), nullable)
-- - photographer_id (UUID, references users(id), nullable)
-- ====================================================================

-- 2.1 Bổ sung cột makeup_artist_id
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS makeup_artist_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2.2 Đảm bảo cột photographer_id đã tồn tại và liên kết users(id)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS photographer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2.3 Thêm Index tối ưu hiệu năng lọc lịch theo nhân sự (Thợ chụp & Thợ Makeup)
CREATE INDEX IF NOT EXISTS idx_bookings_makeup_artist_id ON bookings(makeup_artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_id ON bookings(photographer_id);

COMMENT ON COLUMN bookings.makeup_artist_id IS 'UUID của Thợ Makeup (MUA) phụ trách buổi chụp, liên kết users(id)';
COMMENT ON COLUMN bookings.photographer_id IS 'UUID của Nhiếp ảnh gia (Photographer) phụ trách buổi chụp, liên kết users(id)';


-- ====================================================================
-- 3. CẬP NHẬT RLS (ROW LEVEL SECURITY):
-- Đảm bảo cả Thợ chụp và Thợ Makeup đều có thể xem và cập nhật lịch chụp được phân công
-- ====================================================================

-- Cho phép nhân sự phụ trách (photographer_id hoặc makeup_artist_id) hoặc thành viên studio xem lịch chụp
DROP POLICY IF EXISTS "Staff can view assigned bookings" ON bookings;
CREATE POLICY "Staff can view assigned bookings"
    ON bookings FOR SELECT
    USING (
        auth.uid() = photographer_id
        OR auth.uid() = makeup_artist_id
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

-- Cho phép nhân sự phụ trách cập nhật tiến độ lịch chụp (ví dụ: đánh dấu đã chụp, đã makeup xong, hủy/xóa lịch)
DROP POLICY IF EXISTS "Staff can update assigned bookings" ON bookings;
CREATE POLICY "Staff can update assigned bookings"
    ON bookings FOR UPDATE
    USING (
        auth.uid() = photographer_id
        OR auth.uid() = makeup_artist_id
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );


-- ====================================================================
-- 4. VIEW & HÀM TRUY VẤN (JOIN VỚI BẢNG USERS LẤY TÊN VÀ AVATAR):
-- ====================================================================

-- 4.1 VIEW: bookings_with_staff_view
-- Tự động JOIN với bảng users để lấy đầy đủ tên và avatar của cả photographer và makeup_artist
CREATE OR REPLACE VIEW bookings_with_staff_view AS
SELECT 
    b.*,
    
    -- Chi tiết Thợ chụp (Photographer)
    u_photo.full_name AS photographer_name,
    u_photo.avatar_url AS photographer_avatar,
    u_photo.phone AS photographer_phone,
    u_photo.email AS photographer_email,
    
    -- Chi tiết Thợ Makeup (Makeup Artist / MUA)
    u_mua.full_name AS makeup_artist_name,
    u_mua.avatar_url AS makeup_artist_avatar,
    u_mua.phone AS makeup_artist_phone,
    u_mua.email AS makeup_artist_email,
    
    -- Đối tượng JSON lồng nhau chuẩn hóa cho Frontend
    CASE 
        WHEN u_photo.id IS NOT NULL THEN
            jsonb_build_object(
                'id', u_photo.id,
                'full_name', u_photo.full_name,
                'avatar_url', u_photo.avatar_url,
                'phone', u_photo.phone,
                'email', u_photo.email
            )
        ELSE NULL
    END AS photographer,
    
    CASE 
        WHEN u_mua.id IS NOT NULL THEN
            jsonb_build_object(
                'id', u_mua.id,
                'full_name', u_mua.full_name,
                'avatar_url', u_mua.avatar_url,
                'phone', u_mua.phone,
                'email', u_mua.email
            )
        ELSE NULL
    END AS makeup_artist

FROM bookings b
LEFT JOIN users u_photo ON b.photographer_id = u_photo.id
LEFT JOIN users u_mua ON b.makeup_artist_id = u_mua.id;

COMMENT ON VIEW bookings_with_staff_view IS 'View danh sách lịch chụp đã tự động JOIN với users lấy tên và avatar của thợ chụp và thợ makeup';


-- 4.2 FUNCTION: get_bookings_with_staff
-- Stored Procedure trả về danh sách lịch chụp kèm nhân sự theo Studio hoặc Photographer
CREATE OR REPLACE FUNCTION get_bookings_with_staff(
    p_studio_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    client_name VARCHAR,
    client_phone VARCHAR,
    session_type VARCHAR,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR,
    package_price NUMERIC,
    deposit_amount NUMERIC,
    paid_amount NUMERIC,
    remaining_amount NUMERIC,
    status VARCHAR,
    notes TEXT,
    studio_id UUID,
    photographer_id UUID,
    photographer_name VARCHAR,
    photographer_avatar TEXT,
    makeup_artist_id UUID,
    makeup_artist_name VARCHAR,
    makeup_artist_avatar TEXT,
    photographer JSONB,
    makeup_artist JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.client_name,
        v.client_phone,
        v.session_type,
        v.event_date,
        v.start_time,
        v.end_time,
        v.location,
        v.package_price,
        v.deposit_amount,
        v.paid_amount,
        v.remaining_amount,
        v.status,
        v.notes,
        v.studio_id,
        v.photographer_id,
        v.photographer_name,
        v.photographer_avatar,
        v.makeup_artist_id,
        v.makeup_artist_name,
        v.makeup_artist_avatar,
        v.photographer,
        v.makeup_artist
    FROM bookings_with_staff_view v
    WHERE 
        (p_studio_id IS NULL OR v.studio_id = p_studio_id)
        AND (
            p_user_id IS NULL 
            OR v.photographer_id = p_user_id 
            OR v.makeup_artist_id = p_user_id
        )
        AND (v.is_deleted IS NOT TRUE)
    ORDER BY v.event_date ASC, v.start_time ASC;
END;
$$;

COMMENT ON FUNCTION get_bookings_with_staff IS 'Hàm RPC truy vấn lịch chụp kèm nhân sự đã Join sẵn tên và avatar';

-- ====================================================================
-- HƯỚNG DẪN TRUY VẤN TỪ SUPABASE CLIENT (JAVASCRIPT / TYPESCRIPT):
-- ====================================================================
-- Cách 1: Sử dụng PostgREST JOIN chuẩn:
-- const { data, error } = await supabase
--   .from('bookings')
--   .select(`
--     *,
--     photographer:users!photographer_id (
--       id,
--       full_name,
--       avatar_url,
--       phone
--     ),
--     makeup_artist:users!makeup_artist_id (
--       id,
--       full_name,
--       avatar_url,
--       phone
--     )
--   `)
--   .order('event_date', { ascending: true });
--
-- Cách 2: Truy vấn qua View bookings_with_staff_view:
-- const { data, error } = await supabase
--   .from('bookings_with_staff_view')
--   .select('*')
--   .eq('studio_id', currentStudio.id);
--
-- Cách 3: Gọi hàm RPC:
-- const { data, error } = await supabase
--   .rpc('get_bookings_with_staff', { p_studio_id: currentStudio.id });
-- ====================================================================
