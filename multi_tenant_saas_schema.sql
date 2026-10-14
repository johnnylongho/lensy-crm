-- ====================================================================
-- LENSY CRM - MULTI-TENANT SAAS ARCHITECTURE MIGRATION (PHẦN 2)
-- CƠ CHẾ CÁCH LY DỮ LIỆU ĐA KHÁCH HÀNG (MULTI-TENANT ISOLATION)
-- HỖ TRỢ HÀNG NGHÌN BOUTIQUE STUDIOS & FREELANCE PHOTOGRAPHERS TRÊN 1 NỀN TẢNG
-- File: multi_tenant_saas_schema.sql
-- ====================================================================

-- 1. TẠO / NÂNG CẤP BẢNG STUDIOS (TENANTS)
CREATE TABLE IF NOT EXISTS studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    logo_url TEXT,
    tier TEXT DEFAULT 'standard',
    verified_status BOOLEAN NOT NULL DEFAULT false,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bổ sung các cột nếu bảng studios đã tồn tại từ trước
ALTER TABLE studios ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard';
ALTER TABLE studios ADD COLUMN IF NOT EXISTS verified_status BOOLEAN DEFAULT false;

-- Cập nhật dữ liệu mặc định cho studio đầu tiên
UPDATE studios 
SET slug = 'mirmia-studio', tier = 'vip', logo = '/mirmia-logo.png' 
WHERE slug IS NULL;

-- 2. ĐẢM BẢO CỘT studio_id TRÊN TẤT CẢ CÁC BẢNG CỐT LÕI
-- A. Bảng bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON bookings(studio_id);

-- B. Bảng gears (Kho thiết bị)
ALTER TABLE gears ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_gears_studio_id ON gears(studio_id);

-- C. Bảng packages (Bảng giá & Gói dịch vụ)
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    image_urls TEXT[] DEFAULT '{}'::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_packages_studio_id ON packages(studio_id);

-- D. Bảng clients / customers (Hồ sơ khách hàng)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_studio_id ON clients(studio_id);

-- E. Bảng studio_members (Thành viên & Ekip)
CREATE TABLE IF NOT EXISTS studio_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'photographer',
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_studio_member UNIQUE (studio_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_studio_members_studio_id ON studio_members(studio_id);
CREATE INDEX IF NOT EXISTS idx_studio_members_user_id ON studio_members(user_id);

-- 3. HÀM KIỂM TRA QUYỀN THÀNH VIÊN STUDIO (SECURITY DEFINER - TRÁNH ĐỆ QUY RLS)
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

-- 4. THIẾT LẬP ROW LEVEL SECURITY (RLS) NGHIÊM NGẶT
-- BẢO VỆ DỮ LIỆU ĐA KHÁCH HÀNG: CHỈ THÀNH VIÊN THUỘC STUDIO ĐƯỢC XEM/SỬA

-- A. RLS BẢNG BOOKINGS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Select" ON bookings;
CREATE POLICY "Strict Multi-tenant Bookings Select"
    ON bookings FOR SELECT
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Insert" ON bookings;
CREATE POLICY "Strict Multi-tenant Bookings Insert"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Update" ON bookings;
CREATE POLICY "Strict Multi-tenant Bookings Update"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

DROP POLICY IF EXISTS "Strict Multi-tenant Bookings Delete" ON bookings;
CREATE POLICY "Strict Multi-tenant Bookings Delete"
    ON bookings FOR DELETE
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

-- B. RLS BẢNG GEARS (THIẾT BỊ)
ALTER TABLE gears ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict Multi-tenant Gears Select" ON gears;
CREATE POLICY "Strict Multi-tenant Gears Select"
    ON gears FOR SELECT
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

DROP POLICY IF EXISTS "Strict Multi-tenant Gears All" ON gears;
CREATE POLICY "Strict Multi-tenant Gears All"
    ON gears FOR ALL
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

-- C. RLS BẢNG PACKAGES (GÓI DỊCH VỤ)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict Multi-tenant Packages Select" ON packages;
CREATE POLICY "Strict Multi-tenant Packages Select"
    ON packages FOR SELECT
    USING (
        is_active = true 
        OR (auth.role() = 'authenticated' AND (
            (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
            OR (studio_id IS NULL AND photographer_id = auth.uid())
        ))
    );

DROP POLICY IF EXISTS "Strict Multi-tenant Packages All" ON packages;
CREATE POLICY "Strict Multi-tenant Packages All"
    ON packages FOR ALL
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

-- D. RLS BẢNG CLIENTS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Strict Multi-tenant Clients Select" ON clients;
CREATE POLICY "Strict Multi-tenant Clients Select"
    ON clients FOR SELECT
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

DROP POLICY IF EXISTS "Strict Multi-tenant Clients All" ON clients;
CREATE POLICY "Strict Multi-tenant Clients All"
    ON clients FOR ALL
    TO authenticated
    USING (
        (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
        OR (studio_id IS NULL AND photographer_id = auth.uid())
    );

-- E. RLS BẢNG STUDIOS & STUDIO_MEMBERS
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view studio basic info" ON studios;
CREATE POLICY "Public can view studio basic info"
    ON studios FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Owners can update own studio" ON studios;
CREATE POLICY "Owners can update own studio"
    ON studios FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Members can view studio_members" ON studio_members;
CREATE POLICY "Members can view studio_members"
    ON studio_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR is_studio_member(studio_id, auth.uid())
    );
