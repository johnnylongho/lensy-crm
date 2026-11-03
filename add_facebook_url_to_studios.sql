-- Migration: Bổ sung cột facebook_url và address cho bảng studios
-- Chạy đoạn script này trong Supabase Dashboard > SQL Editor

ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.studios ADD COLUMN IF NOT EXISTS address TEXT;

-- Thông báo hoàn thành
COMMENT ON COLUMN public.studios.facebook_url IS 'Đường dẫn Facebook Fanpage chính thức của Studio';
COMMENT ON COLUMN public.studios.address IS 'Địa chỉ trụ sở / văn phòng chính của Studio';

