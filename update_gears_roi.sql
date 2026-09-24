-- ==========================================================
-- Lensy CRM - Migration: Add purchase_price for ROI Analysis
-- Mục tiêu: Thêm cột `purchase_price` vào bảng `gears` để lưu
-- giá mua của từng thiết bị phục vụ tính toán hoàn vốn (ROI).
-- ==========================================================

-- 1. Thêm cột purchase_price (Kiểu NUMERIC(15, 2) hoặc BIGINT, mặc định 0) an toàn với IF NOT EXISTS
ALTER TABLE gears 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(15, 2) DEFAULT 0;

-- 2. Gắn chú thích cho cột (Metadata mô tả trường)
COMMENT ON COLUMN gears.purchase_price IS 'Giá mua thiết bị (VNĐ) phục vụ tính toán hoàn vốn đầu tư ROI';

-- 3. (Tùy chọn) Gán giá mua mẫu cho các thiết bị hiện có (dựa theo cột `name`)
UPDATE gears 
SET purchase_price = CASE 
    WHEN name ILIKE '%A7 IV%' OR name ILIKE '%A7 4%' THEN 48000000
    WHEN name ILIKE '%A7R%' THEN 75000000
    WHEN name ILIKE '%R6%' THEN 52000000
    WHEN name ILIKE '%24-70%' THEN 49000000
    WHEN name ILIKE '%70-200%' THEN 62000000
    WHEN name ILIKE '%50mm%' OR name ILIKE '%50 f%' THEN 42000000
    WHEN name ILIKE '%28-70%' THEN 65000000
    WHEN name ILIKE '%V1%' THEN 6500000
    WHEN name ILIKE '%AD200%' THEN 8500000
    WHEN name ILIKE '%AD600%' THEN 16500000
    ELSE purchase_price
END
WHERE purchase_price IS NULL OR purchase_price = 0;
