-- ============================================================
-- Migration: Add delivery_notes column to bookings table
-- Author: Lensy CRM Auto-Migration
-- Date: 2026-11-04
-- Description: Thêm cột delivery_notes vào bảng bookings nếu chưa có.
--              Cột này lưu ghi chú giao file cho khách hàng.
-- ============================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Đảm bảo các cột liên quan đến delivery đều tồn tại
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS drive_delivery_link TEXT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;

-- Comment mô tả cột
COMMENT ON COLUMN public.bookings.delivery_notes IS 'Ghi chú giao file/ảnh cho khách hàng (delivery notes)';
COMMENT ON COLUMN public.bookings.drive_delivery_link IS 'Link Google Drive giao file ảnh cho khách';
COMMENT ON COLUMN public.bookings.delivery_date IS 'Ngày giờ dự kiến/thực tế giao file cho khách';

