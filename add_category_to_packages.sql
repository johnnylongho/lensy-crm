-- ====================================================================
-- LENSY CRM - MIGRATION BỔ SUNG CỘT CATEGORY VÀO BẢNG PACKAGES
-- Cho phép phân loại dịch vụ: Studio, Outdoor, Event, Wedding, Makeup, Rental
-- Phục vụ bộ lọc trên trang Booking, Quản lý Gói và Báo giá
-- ====================================================================

-- 1. Thêm cột category vào bảng packages (mặc định là 'studio')
ALTER TABLE packages ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'studio';

-- 2. Cập nhật dữ liệu hiện có dựa trên tên gói hoặc set mặc định
UPDATE packages
SET category = 'wedding'
WHERE (category IS NULL OR category = '') AND (
    LOWER(name) LIKE '%cưới%' OR
    LOWER(name) LIKE '%hôn lễ%' OR
    LOWER(name) LIKE '%wedding%'
);

UPDATE packages
SET category = 'event'
WHERE (category IS NULL OR category = '') AND (
    LOWER(name) LIKE '%phóng sự%' OR
    LOWER(name) LIKE '%tiệc%' OR
    LOWER(name) LIKE '%sự kiện%' OR
    LOWER(name) LIKE '%event%' OR
    LOWER(name) LIKE '%thôi nôi%' OR
    LOWER(name) LIKE '%sinh nhật%'
);

UPDATE packages
SET category = 'outdoor'
WHERE (category IS NULL OR category = '') AND (
    LOWER(name) LIKE '%ngoại cảnh%' OR
    LOWER(name) LIKE '%outdoor%' OR
    LOWER(name) LIKE '%pre-wedding%' OR
    LOWER(name) LIKE '%dã ngoại%'
);

UPDATE packages
SET category = 'makeup'
WHERE (category IS NULL OR category = '') AND (
    LOWER(name) LIKE '%makeup%' OR
    LOWER(name) LIKE '%trang điểm%' OR
    LOWER(name) LIKE '%styling%' OR
    LOWER(name) LIKE '%làm tóc%'
);

UPDATE packages
SET category = 'rental'
WHERE (category IS NULL OR category = '') AND (
    LOWER(name) LIKE '%thuê%' OR
    LOWER(name) LIKE '%rental%' OR
    LOWER(name) LIKE '%thiết bị%' OR
    LOWER(name) LIKE '%trang phục%'
);

-- Các gói còn lại nếu vẫn NULL hoặc rỗng thì gán mặc định 'studio'
UPDATE packages
SET category = 'studio'
WHERE category IS NULL OR category = '';

-- 3. Đảm bảo ràng buộc không null và giá trị mặc định 'studio'
ALTER TABLE packages ALTER COLUMN category SET NOT NULL;
ALTER TABLE packages ALTER COLUMN category SET DEFAULT 'studio';

-- 4. Tạo Index tối ưu hóa tìm kiếm & lọc gói theo category
CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category);

-- 5. Ràng buộc check giá trị hợp lệ cho các nhóm dịch vụ chuẩn Lensy
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'packages_category_check' 
          AND table_name = 'packages'
    ) THEN
        ALTER TABLE packages DROP CONSTRAINT packages_category_check;
    END IF;

    ALTER TABLE packages ADD CONSTRAINT packages_category_check 
    CHECK (category IN ('studio', 'outdoor', 'event', 'wedding', 'makeup', 'rental'));
END $$;
