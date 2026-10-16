-- ====================================================================
-- MIGRATION: BỔ SUNG CỘT facebook_url CHO BẢNG public.users
-- Khắc phục triệt để lỗi Schema Cache trong Supabase
-- File: add_facebook_url_to_users.sql
-- ====================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Bổ sung index để tối ưu truy vấn nếu cần tìm kiếm
CREATE INDEX IF NOT EXISTS idx_users_facebook_url ON public.users(facebook_url);
