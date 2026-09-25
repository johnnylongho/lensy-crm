-- ====================================================================
-- LENSY CRM (MIRMIA STUDIO & ACADEMY) - QUẢN LÝ GÓI DỊCH VỤ (PACKAGES)
-- File: create_packages.sql
-- ====================================================================

-- 1. TẠO BẢNG PACKAGES
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    image_urls TEXT[] DEFAULT '{}'::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo Index tăng tốc truy vấn theo thợ ảnh và trạng thái hoạt động
CREATE INDEX IF NOT EXISTS idx_packages_photographer_id ON packages(photographer_id);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC);

-- Trigger tự động cập nhật updated_at
DROP TRIGGER IF EXISTS trg_packages_updated_at ON packages;
CREATE TRIGGER trg_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 2. THIẾT LẬP ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp policies cũ nếu có
DROP POLICY IF EXISTS "Photographers can manage own packages" ON packages;
DROP POLICY IF EXISTS "Public can view active packages" ON packages;

-- Policy 1: Thợ ảnh có toàn quyền quản lý gói dịch vụ của mình (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Photographers can manage own packages"
    ON packages FOR ALL
    TO authenticated
    USING (photographer_id = auth.uid())
    WITH CHECK (photographer_id = auth.uid());

-- Policy 2: Cho phép người dùng công khai (khách xem /book/:username) đọc các gói đang kích hoạt (is_active = true)
CREATE POLICY "Public can view active packages"
    ON packages FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- ====================================================================
-- 3. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHO MIRMIA STUDIO)
-- ====================================================================
INSERT INTO packages (
    id, photographer_id, name, price, description, features, image_urls, is_active
)
VALUES
    (
        'c1111111-1111-1111-1111-111111111101',
        'a1111111-1111-1111-1111-111111111111',
        'Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)',
        18000000,
        'Trọn gói chụp ngày cưới với 2 thợ chính, bắt trọn từng khoảnh khắc cảm xúc thăng hoa và đẳng cấp nghệ thuật.',
        '[
            "2 Thợ chụp chính máy Sony A7 IV + Lens GM cao cấp",
            "Chụp không giới hạn số lượng file trong buổi lễ & tiệc",
            "Chỉnh sửa màu toàn bộ ảnh gốc (blend màu chuẩn Studio)",
            "Retouch chi tiết 80 ảnh chân dung cô dâu chú rể & gia đình",
            "Tặng 01 photobook mở phẳng 30x30cm (40 trang) bìa da cao cấp",
            "Tặng 02 ảnh cổng ép gỗ pha lê 60x90cm",
            "Bàn giao toàn bộ file gốc & hoàn thiện qua Google Drive dung lượng vĩnh viễn"
        ]'::jsonb,
        ARRAY[
            'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80'
        ],
        true
    ),
    (
        'c1111111-1111-1111-1111-111111111102',
        'a1111111-1111-1111-1111-111111111111',
        'Chụp Pre-Wedding Ngoại Cảnh & Phim Trường',
        14500000,
        'Buổi chụp lãng mạn ngoại cảnh hoặc phim trường chuyên nghiệp, hỗ trợ stylist và hướng dẫn tạo dáng tự nhiên.',
        '[
            "01 Thợ chụp chính + 01 Thợ phụ đánh sáng chuyên nghiệp",
            "Miễn phí 02 trang phục cưới cao cấp & 01 vest chú rể",
            "Trang điểm & làm tóc thay đổi 03 layout theo concept",
            "Retouch chuyên sâu 50 ảnh đẹp nhất",
            "Tặng 01 album phóng sự mở phẳng 25x35cm",
            "Tặng 01 ảnh cổng pha lê cao cấp 60x90cm",
            "Xe di chuyển trong nội thành và vé vào phim trường"
        ]'::jsonb,
        ARRAY[
            'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80'
        ],
        true
    ),
    (
        'c1111111-1111-1111-1111-111111111103',
        'a1111111-1111-1111-1111-111111111111',
        'Lookbook Thời Trang & Portrait Doanh Nhân',
        8500000,
        'Chuyên nghiệp cho các thương hiệu thời trang, lookbook bộ sưu tập hoặc bộ ảnh xây dựng thương hiệu cá nhân doanh nhân.',
        '[
            "Chụp tại studio với hệ thống đèn Profoto / Godox chuyên dụng",
            "Chụp tối đa 4 concept hoặc 15 bộ trang phục",
            "Retouch chi tiết chuẩn tạp chí cho 25 ảnh xuất sắc nhất",
            "Bàn giao file nén tối ưu hiển thị web & social media",
            "Hỗ trợ chỉnh sửa nhanh lấy gấp trong 48h"
        ]'::jsonb,
        ARRAY[
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'
        ],
        true
    )
ON CONFLICT (id) DO NOTHING;
