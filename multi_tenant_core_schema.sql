-- ====================================================================
-- LENSY CRM - MULTI-TENANT WORKSPACES: CORE TABLES & RLS MIGRATION
-- BỔ SUNG CỘT studio_id CHO CÁC BẢNG NGHIỆP VỤ & PHÂN QUYỀN RLS
-- File: multi_tenant_core_schema.sql
-- ====================================================================

-- 1. BỔ SUNG CỘT studio_id CHO BẢNG BOOKINGS
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON bookings(studio_id);

-- 2. BỔ SUNG CỘT studio_id CHO BẢNG GEARS
ALTER TABLE gears 
ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gears_studio_id ON gears(studio_id);

-- 3. TẠO HOẶC CẬP NHẬT BẢNG PACKAGES VỚI studio_id
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

-- Nếu bảng packages đã tồn tại, đảm bảo có cột studio_id
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_packages_studio_id ON packages(studio_id);
CREATE INDEX IF NOT EXISTS idx_packages_photographer_id ON packages(photographer_id);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);

-- 4. BỔ SUNG CỘT studio_id CHO BẢNG CLIENTS
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_studio_id ON clients(studio_id);

-- 5. BỔ SUNG CỘT studio_id CHO BẢNG TRANSACTIONS
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES studios(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_studio_id ON transactions(studio_id);

-- ====================================================================
-- 6. HÀM KIỂM TRA QUYỀN THÀNH VIÊN STUDIO (SECURITY DEFINER)
-- ====================================================================
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

-- ====================================================================
-- 7. THIẾT LẬP ROW LEVEL SECURITY (RLS) MULTI-TENANT CHUẨN XÁC
-- ====================================================================

-- --------------------------------------------------------------------
-- A. RLS BẢNG GEARS (THIẾT BỊ)
-- --------------------------------------------------------------------
ALTER TABLE gears ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view gears in studio or own gears" ON gears;
CREATE POLICY "Users can view gears in studio or own gears"
    ON gears FOR SELECT
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

DROP POLICY IF EXISTS "Users can insert own or studio gears" ON gears;
CREATE POLICY "Users can insert own or studio gears"
    ON gears FOR INSERT
    TO authenticated
    WITH CHECK (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update own or studio gears" ON gears;
CREATE POLICY "Users can update own or studio gears"
    ON gears FOR UPDATE
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_admin_or_owner(studio_id, auth.uid()))
    );

DROP POLICY IF EXISTS "Users can delete own or studio gears" ON gears;
CREATE POLICY "Users can delete own or studio gears"
    ON gears FOR DELETE
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_admin_or_owner(studio_id, auth.uid()))
    );

-- --------------------------------------------------------------------
-- B. RLS BẢNG PACKAGES (GÓI DỊCH VỤ)
-- --------------------------------------------------------------------
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active packages" ON packages;
CREATE POLICY "Public can view active packages"
    ON packages FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Studio members or photographers can manage packages" ON packages;
CREATE POLICY "Studio members or photographers can manage packages"
    ON packages FOR ALL
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_admin_or_owner(studio_id, auth.uid()))
    )
    WITH CHECK (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_admin_or_owner(studio_id, auth.uid()))
    );

-- --------------------------------------------------------------------
-- C. RLS BẢNG CLIENTS (KHÁCH HÀNG CRM)
-- --------------------------------------------------------------------
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view clients of studio or own" ON clients;
CREATE POLICY "Users can view clients of studio or own"
    ON clients FOR SELECT
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

DROP POLICY IF EXISTS "Users can manage clients of studio or own" ON clients;
CREATE POLICY "Users can manage clients of studio or own"
    ON clients FOR ALL
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    )
    WITH CHECK (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

-- --------------------------------------------------------------------
-- D. RLS BẢNG BOOKINGS (LỊCH CHỤP & BÁO GIÁ)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Photographers and studio members manage bookings" ON bookings;
CREATE POLICY "Photographers and studio members manage bookings"
    ON bookings FOR ALL
    TO authenticated
    USING (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    )
    WITH CHECK (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );

-- ====================================================================
-- 8. TỰ ĐỘNG GẮN studio_id MẪU CHO DỮ LIỆU HIỆN CÓ CỦA OWNER
-- ====================================================================
DO $$
DECLARE
    default_studio_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
    sample_owner_id UUID;
BEGIN
    SELECT owner_id INTO sample_owner_id FROM studios WHERE id = default_studio_id;
    
    IF sample_owner_id IS NOT NULL THEN
        -- Gán studio_id cho bookings hiện tại của owner nếu chưa có studio
        UPDATE bookings 
        SET studio_id = default_studio_id 
        WHERE (photographer_id = sample_owner_id OR photographer_id IS NULL) 
          AND studio_id IS NULL;

        -- Gán studio_id cho gears hiện tại của owner
        UPDATE gears 
        SET studio_id = default_studio_id 
        WHERE photographer_id = sample_owner_id 
          AND studio_id IS NULL;

        -- Gán studio_id cho clients hiện tại của owner
        UPDATE clients 
        SET studio_id = default_studio_id 
        WHERE photographer_id = sample_owner_id 
          AND studio_id IS NULL;
    END IF;
END $$;
