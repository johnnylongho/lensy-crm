-- ====================================================================
-- MIGRATION: BỔ SUNG AVATAR STORAGE & XÁC THỰC THỢ ẢNH (VERIFICATION)
-- Lensy CRM - Supabase Backend
-- ====================================================================

-- 1. Bổ sung cột facebook_url và is_verified vào bảng users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Tạo index tìm kiếm nhanh thợ ảnh đã xác thực
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);

-- 2. Bổ sung cột facebook_url và is_verified vào bảng studio_members
ALTER TABLE studio_members 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_studio_members_is_verified ON studio_members(is_verified);

-- 3. Tạo Bucket 'avatars' trong Supabase Storage nếu chưa tồn tại
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true,
    2097152, -- Giới hạn 2MB (2 * 1024 * 1024 bytes)
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 4. Cấu hình RLS Policies cho Bucket 'avatars' trên bảng storage.objects
-- A. Cho phép mọi người (Public) được quyền đọc/tải ảnh avatar
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'avatars');

-- B. Cho phép người dùng đã đăng nhập (authenticated) được quyền tải ảnh lên (Upload)
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects
    FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'avatars');

-- C. Cho phép người dùng cập nhật ảnh đại diện của chính mình (Update)
DROP POLICY IF EXISTS "Authenticated Update Avatars" ON storage.objects;
CREATE POLICY "Authenticated Update Avatars" ON storage.objects
    FOR UPDATE 
    TO authenticated 
    USING (bucket_id = 'avatars');

-- D. Cho phép người dùng xóa ảnh đại diện nếu cần
DROP POLICY IF EXISTS "Authenticated Delete Avatars" ON storage.objects;
CREATE POLICY "Authenticated Delete Avatars" ON storage.objects
    FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'avatars');
