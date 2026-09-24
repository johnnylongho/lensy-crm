-- ====================================================================
-- LENSY CRM - MIGRATION: CHUẨN HÓA TRẠNG THÁI BOOKING CHO BẢNG KANBAN
-- Quy trình chuẩn nhiếp ảnh: 'lead' -> 'deposited' -> 'shot' -> 'editing' -> 'done'
-- ====================================================================

-- 1. Tìm và xóa CHECK constraint cũ trên cột status (nếu có)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'bookings'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. Đổi giá trị mặc định của cột status thành 'lead' (Mới hỏi)
ALTER TABLE bookings 
    ALTER COLUMN status SET DEFAULT 'lead';

-- 3. Đồng bộ / Chuyển đổi dữ liệu cũ sang chuẩn Kanban mới (nếu có)
UPDATE bookings SET status = 'lead' WHERE status = 'cho_coc';
UPDATE bookings SET status = 'deposited' WHERE status = 'da_chot';
UPDATE bookings SET status = 'editing' WHERE status = 'da_tra_file';
UPDATE bookings SET status = 'done' WHERE status = 'hoan_thanh';

-- 4. Thêm CHECK constraint mới với 5 trạng thái quy trình nhiếp ảnh chuẩn
ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
        'lead',         -- 1. Mới hỏi (Lead) - Khách vừa gửi form từ link /book/:username
        'deposited',    -- 2. Đã cọc (Deposited) - Đã nhận tiền cọc & khóa lịch
        'shot',         -- 3. Đã chụp (Shot) - Đã bấm máy xong show, sẵn sàng hậu kỳ
        'editing',      -- 4. Đang hậu kỳ (Editing) - Đang blend màu / retouch / dựng ảnh
        'done',         -- 5. Hoàn tất (Done) - Đã giao ảnh hoàn tất & quyết toán 100%
        'cancelled',    -- Đã hủy lịch
        -- Tương thích ngược với dữ liệu cũ (Backward compatibility):
        'cho_coc',
        'cho_xac_nhan_coc',
        'da_chot',
        'da_tra_file',
        'hoan_thanh',
        'da_huy'
    ));

-- 5. Đảm bảo Index tăng tốc truy vấn theo status cho Bảng Kanban
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Thông báo hoàn thành
DO $$
BEGIN
    RAISE NOTICE '✅ Đã chuẩn hóa cột status bảng bookings với giá trị mặc định "lead" và hỗ trợ đầy đủ 5 trạng thái Kanban!';
END $$;
