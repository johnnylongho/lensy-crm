-- ====================================================================
-- MIGRATION: TẠO STORAGE BUCKET & RLS POLICIES CHO ẢNH GÓI CHỤP (package-images)
-- Lensy CRM - Supabase Storage
-- ====================================================================

-- 1. Tạo Bucket 'package-images' trong Supabase Storage nếu chưa tồn tại
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'package-images', 
    'package-images', 
    true,
    10485760, -- Giới hạn 10MB (10 * 1024 * 1024 bytes)
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 2. Cấu hình RLS Policies cho Bucket 'package-images' trên bảng storage.objects

-- A. Cho phép mọi người (Public & Anonymous & Authenticated) đọc/tải ảnh mẫu gói dịch vụ
DROP POLICY IF EXISTS "Public Read Package Images" ON storage.objects;
CREATE POLICY "Public Read Package Images" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'package-images');

-- B. Cho phép người dùng (Authenticated và Anonymous) tải ảnh lên gói dịch vụ
DROP POLICY IF EXISTS "Allow Upload Package Images" ON storage.objects;
CREATE POLICY "Allow Upload Package Images" ON storage.objects
    FOR INSERT 
    TO public, authenticated, anon
    WITH CHECK (bucket_id = 'package-images');

-- C. Cho phép cập nhật ảnh trong bucket package-images
DROP POLICY IF EXISTS "Allow Update Package Images" ON storage.objects;
CREATE POLICY "Allow Update Package Images" ON storage.objects
    FOR UPDATE 
    TO authenticated, anon
    USING (bucket_id = 'package-images');

-- D. Cho phép xóa ảnh khỏi bucket package-images
DROP POLICY IF EXISTS "Allow Delete Package Images" ON storage.objects;
CREATE POLICY "Allow Delete Package Images" ON storage.objects
    FOR DELETE 
    TO authenticated, anon
    USING (bucket_id = 'package-images');

