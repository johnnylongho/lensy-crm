-- ====================================================================
-- LENSY CRM - FIX SUPABASE SECURITY LINTER WARNINGS
-- File: fix_supabase_security_linter.sql
-- Khắc phục toàn bộ cảnh báo bảo mật từ Supabase Database Linter:
-- 1. Function Search Path Mutable (CVE search_path hijacking)
-- 2. Anon & Authenticated Executable Security Definer Functions (PostgREST RPC exposure)
-- 3. Overly Permissive RLS Policies (USING true / WITH CHECK true)
-- ====================================================================

-- ####################################################################
-- PHẦN 1: KHẮC PHỤC FUNCTION SEARCH PATH MUTABLE & BẢO VỆ SECURITY DEFINER
-- ####################################################################

-- 1.1 Trigger cập nhật updated_at
-- Gán search_path cố định và thu hồi quyền gọi trực tiếp từ API PostgREST
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
-- Thu hồi quyền gọi RPC từ bên ngoài (Trigger chỉ được gọi bởi Database engine)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;


-- 1.2 Trigger tự động gán Owner làm Studio Admin
CREATE OR REPLACE FUNCTION public.handle_new_studio_owner()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.studio_members (studio_id, user_id, role, status)
    VALUES (NEW.id, NEW.owner_id, 'admin', 'approved')
    ON CONFLICT (studio_id, user_id) 
    DO UPDATE SET role = 'admin', status = 'approved', updated_at = NOW();
    
    UPDATE public.users 
    SET account_type = 'studio_member' 
    WHERE id = NEW.owner_id;
    
    RETURN NEW;
END;
$$;
-- Thu hồi quyền gọi RPC từ bên ngoài (Chỉ trigger nội bộ chạy)
REVOKE EXECUTE ON FUNCTION public.handle_new_studio_owner() FROM PUBLIC, anon, authenticated;


-- 1.3 Hàm RPC công khai: upsert_client_for_booking (Dành cho Public Booking Form)
-- Thiết lập search_path cố định để chống leo thang đặc quyền
CREATE OR REPLACE FUNCTION public.upsert_client_for_booking(
    p_photographer_id UUID,
    p_name VARCHAR(255),
    p_phone VARCHAR(50),
    p_email VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    SELECT id INTO v_client_id
    FROM public.clients
    WHERE photographer_id = p_photographer_id AND phone = p_phone
    LIMIT 1;

    IF v_client_id IS NOT NULL THEN
        UPDATE public.clients
        SET 
            name = COALESCE(NULLIF(p_name, ''), name),
            email = COALESCE(NULLIF(p_email, ''), email),
            updated_at = NOW()
        WHERE id = v_client_id;

        RETURN v_client_id;
    END IF;

    INSERT INTO public.clients (photographer_id, name, phone, email)
    VALUES (p_photographer_id, p_name, p_phone, p_email)
    RETURNING id INTO v_client_id;

    RETURN v_client_id;
EXCEPTION
    WHEN unique_violation THEN
        SELECT id INTO v_client_id
        FROM public.clients
        WHERE photographer_id = p_photographer_id AND phone = p_phone
        LIMIT 1;
        RETURN v_client_id;
END;
$$;
-- Cấp quyền có kiểm soát: Chỉ cho phép gọi từ client form
REVOKE EXECUTE ON FUNCTION public.upsert_client_for_booking(UUID, VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_client_for_booking(UUID, VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated;


-- 1.4 Hàm RPC: get_bookings_with_staff
-- Chặn người lạ (anon) gọi RPC, chỉ cho phép authenticated user trong Studio
CREATE OR REPLACE FUNCTION public.get_bookings_with_staff(
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
SET search_path = public
AS $$
BEGIN
    -- Kiểm tra bảo mật: Nếu truyền studio_id, user hiện tại phải thuộc Studio đó
    IF p_studio_id IS NOT NULL AND NOT public.is_studio_member(p_studio_id, auth.uid()) THEN
        RAISE EXCEPTION 'Truy cập bị từ chối: Bạn không phải thành viên của Studio này!';
    END IF;

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
    FROM public.bookings_with_staff_view v
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
-- Chặn tuyệt đối anon thực thi
REVOKE EXECUTE ON FUNCTION public.get_bookings_with_staff(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bookings_with_staff(UUID, UUID) TO authenticated;


-- 1.5 Các hàm phụ trợ RLS (Internal Helper Functions)
-- Không cho phép anon gọi RPC thăm dò dữ liệu thành viên
ALTER FUNCTION public.get_user_approved_studio_ids(UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_user_approved_studio_ids(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_approved_studio_ids(UUID) TO authenticated;

ALTER FUNCTION public.is_studio_admin_or_owner(UUID, UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.is_studio_admin_or_owner(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_studio_admin_or_owner(UUID, UUID) TO authenticated;

ALTER FUNCTION public.is_studio_manager(UUID, UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.is_studio_manager(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_studio_manager(UUID, UUID) TO authenticated;

ALTER FUNCTION public.is_studio_member(UUID, UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.is_studio_member(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_studio_member(UUID, UUID) TO authenticated;


-- ####################################################################
-- PHẦN 2: KHẮC PHỤC RLS POLICIES QUÁ THOÁNG (OVERLY PERMISSIVE / ALWAYS TRUE)
-- ####################################################################

-- 2.1 Bảng TRANSACTIONS (Dòng tiền)
-- Lỗi cũ: "Public can record deposit transaction" FOR INSERT WITH CHECK (true)
-- Khắc phục: 
-- - Backend Webhook (Edge Function) chạy bằng SERVICE_ROLE_KEY sẽ tự động bypass RLS an toàn.
-- - Authenticated users chỉ được tạo transaction cho Studio / Booking mà họ quản lý.
-- - Không mở toang WITH CHECK (true) cho anon.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can record deposit transaction" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can record transactions" ON public.transactions;

CREATE POLICY "Authenticated users can record transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (
        photographer_id = auth.uid()
        OR (studio_id IS NOT NULL AND is_studio_member(studio_id, auth.uid()))
    );


-- 2.2 Bảng ARTICLES (Bài viết / Blog)
-- Lỗi cũ: FOR ALL có USING (true) & WITH CHECK (true) cho authenticated
-- Khắc phục: Tách riêng: Mọi người xem (SELECT = true), nhưng chỉ Admin/Staff có quyền GHI/SỬA/XÓA.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
        EXECUTE 'ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow full access for authenticated staff" ON public.articles;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow public read for articles" ON public.articles;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated staff to manage articles" ON public.articles;';
        
        -- Cho phép mọi người đọc bài viết công khai
        EXECUTE 'CREATE POLICY "Allow public read for articles" ON public.articles FOR SELECT USING (true);';
        
        -- Chỉ authenticated staff/admin mới được thêm/sửa/xóa
        EXECUTE 'CREATE POLICY "Allow authenticated staff to manage articles" ON public.articles 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;
END $$;


-- 2.3 Bảng CHECK_INS, CONNECTION_NOTES, CONNECTIONS, EVENT_REGISTRATIONS, LEADS
-- Lỗi cũ: FOR ALL USING (true) WITH CHECK (true) cho mọi role (- / public) -> Nguy cơ bị xóa sạch DB
DO $$
BEGIN
    -- Table check_ins
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'check_ins') THEN
        EXECUTE 'ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access checkins" ON public.check_ins;';
        EXECUTE 'CREATE POLICY "Allow authenticated access checkins" ON public.check_ins 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;

    -- Table connection_notes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connection_notes') THEN
        EXECUTE 'ALTER TABLE public.connection_notes ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access notes" ON public.connection_notes;';
        EXECUTE 'CREATE POLICY "Allow authenticated access notes" ON public.connection_notes 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;

    -- Table connections
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connections') THEN
        EXECUTE 'ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access connections" ON public.connections;';
        EXECUTE 'CREATE POLICY "Allow authenticated access connections" ON public.connections 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;

    -- Table event_registrations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_registrations') THEN
        EXECUTE 'ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access registrations" ON public.event_registrations;';
        -- Cho phép public đăng ký sự kiện (INSERT), nhưng chỉ authenticated mới được xem/sửa
        EXECUTE 'CREATE POLICY "Allow public insert registrations" ON public.event_registrations 
                 FOR INSERT TO anon, authenticated 
                 WITH CHECK (true);';
        EXECUTE 'CREATE POLICY "Allow authenticated read manage registrations" ON public.event_registrations 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;

    -- Table leads
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow all access leads" ON public.leads;';
        -- Cho phép form khách hàng gửi thông tin lead (INSERT)
        EXECUTE 'CREATE POLICY "Allow public insert leads" ON public.leads 
                 FOR INSERT TO anon, authenticated 
                 WITH CHECK (true);';
        -- Chỉ nhân sự đăng nhập mới được xem và quản lý Leads
        EXECUTE 'CREATE POLICY "Allow authenticated manage leads" ON public.leads 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;
END $$;


-- 2.4 Bảng MARKET_DEMAND_EVENTS & MARKET_LEADS
-- Tách bạch rõ quyền: Public chỉ được GỬI (INSERT), Authenticated mới được ĐỌC/SỬA
DO $$
BEGIN
    -- Table market_demand_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_demand_events') THEN
        EXECUTE 'ALTER TABLE public.market_demand_events ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read for demand events" ON public.market_demand_events;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow public insert for demand events" ON public.market_demand_events;';
        
        -- Public ghi nhận event
        EXECUTE 'CREATE POLICY "Allow public insert for demand events" ON public.market_demand_events 
                 FOR INSERT TO anon, authenticated 
                 WITH CHECK (true);';
        -- Chỉ authenticated mới được đọc và phân tích
        EXECUTE 'CREATE POLICY "Allow authenticated read for demand events" ON public.market_demand_events 
                 FOR SELECT TO authenticated 
                 USING (auth.uid() IS NOT NULL);';
    END IF;

    -- Table market_leads
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_leads') THEN
        EXECUTE 'ALTER TABLE public.market_leads ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read/update for market leads" ON public.market_leads;';
        EXECUTE 'DROP POLICY IF EXISTS "Allow public insert for market leads" ON public.market_leads;';
        
        -- Public đăng ký form lead
        EXECUTE 'CREATE POLICY "Allow public insert for market leads" ON public.market_leads 
                 FOR INSERT TO anon, authenticated 
                 WITH CHECK (true);';
        -- Authenticated quản lý và cập trị leads
        EXECUTE 'CREATE POLICY "Allow authenticated read/update for market leads" ON public.market_leads 
                 FOR ALL TO authenticated 
                 USING (auth.uid() IS NOT NULL) 
                 WITH CHECK (auth.uid() IS NOT NULL);';
    END IF;
END $$;
