-- ====================================================================
-- LENSY CRM (MIRMIA STUDIO) - QUẢN LÝ HỒ SƠ KHÁCH HÀNG (CLIENT CRM)
-- File: create_clients.sql
-- ====================================================================

-- 1. TẠO BẢNG CLIENTS
-- Lưu trữ hồ sơ định danh của khách hàng theo từng thợ ảnh (Multi-tenancy)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo Index tối ưu hóa truy vấn tìm kiếm
CREATE INDEX IF NOT EXISTS idx_clients_photographer_id ON clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_photographer_phone ON clients(photographer_id, phone);

-- Đảm bảo không trùng lặp số điện thoại của cùng một khách đối với cùng một thợ ảnh
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_clients_photographer_phone'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT uq_clients_photographer_phone UNIQUE (photographer_id, phone);
    END IF;
END $$;

-- Trigger tự động cập nhật cột updated_at
DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 2. CẬP NHẬT BẢNG BOOKINGS (BỔ SUNG CỘT client_id THAM CHIẾU TỚI clients)
-- ====================================================================
ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);

-- ====================================================================
-- 3. THIẾT LẬP ROW LEVEL SECURITY (RLS) CHO BẢNG CLIENTS
-- ====================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp policies cũ nếu có
DROP POLICY IF EXISTS "Photographers can manage own clients" ON clients;
DROP POLICY IF EXISTS "Photographers can view own clients" ON clients;
DROP POLICY IF EXISTS "Photographers can update own clients" ON clients;
DROP POLICY IF EXISTS "Public can insert client with valid photographer" ON clients;
DROP POLICY IF EXISTS "Public can view client by phone" ON clients;

-- Policy 1: Thợ ảnh (auth.uid() = photographer_id) có toàn quyền thao tác dữ liệu của mình (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Photographers can manage own clients"
    ON clients FOR ALL
    TO authenticated
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Policy 2: Khách vãng lai gửi form đặt lịch công khai (/book/:username) được quyền thêm client mới
CREATE POLICY "Public can insert client with valid photographer"
    ON clients FOR INSERT
    TO anon, authenticated
    WITH CHECK (photographer_id IS NOT NULL);

-- Policy 3: Khách vãng lai được quyền tra cứu kiểm tra số điện thoại của mình trong danh sách của thợ ảnh
CREATE POLICY "Public can view client by phone"
    ON clients FOR SELECT
    TO anon, authenticated
    USING (photographer_id IS NOT NULL);

-- ====================================================================
-- 4. HÀM RPC UPSERT CLIENT CHO PUBLIC BOOKING FORM (ATOMIC & SECURITY DEFINER)
-- ====================================================================
CREATE OR REPLACE FUNCTION upsert_client_for_booking(
    p_photographer_id UUID,
    p_name VARCHAR(255),
    p_phone VARCHAR(50),
    p_email VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- 1. Kiểm tra khách hàng đã từng đặt lịch với thợ ảnh này qua số điện thoại chưa
    SELECT id INTO v_client_id
    FROM clients
    WHERE photographer_id = p_photographer_id AND phone = p_phone
    LIMIT 1;

    -- 2. Nếu đã tồn tại -> Cập nhật tên/email mới nhất và trả về client_id cũ
    IF v_client_id IS NOT NULL THEN
        UPDATE clients
        SET 
            name = COALESCE(NULLIF(p_name, ''), name),
            email = COALESCE(NULLIF(p_email, ''), email),
            updated_at = NOW()
        WHERE id = v_client_id;

        RETURN v_client_id;
    END IF;

    -- 3. Nếu chưa tồn tại -> Tạo mới Client
    INSERT INTO clients (photographer_id, name, phone, email)
    VALUES (p_photographer_id, p_name, p_phone, p_email)
    RETURNING id INTO v_client_id;

    RETURN v_client_id;
EXCEPTION
    WHEN unique_violation THEN
        -- Xử lý an toàn nếu có 2 request gửi đồng thời
        SELECT id INTO v_client_id
        FROM clients
        WHERE photographer_id = p_photographer_id AND phone = p_phone
        LIMIT 1;
        RETURN v_client_id;
END;
$$;

-- Cấp quyền thực thi hàm cho cả anon và authenticated
GRANT EXECUTE ON FUNCTION upsert_client_for_booking(UUID, VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated;
