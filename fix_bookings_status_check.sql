-- ====================================================================
-- LENSY CRM - FIX BOOKINGS STATUS CHECK CONSTRAINT & PACKAGE ID
-- Đảm bảo constraint bookings_status_check chấp nhận mọi giá trị chuẩn
-- ====================================================================

-- 1. Xóa CHECK constraint cũ trên cột status
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

-- 2. Thêm lại CHECK constraint mới bao quát toàn bộ trạng thái (chuẩn Kanban + tương thích ngược)
ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
        'lead',
        'deposited',
        'shot',
        'editing',
        'done',
        'cancelled',
        'cho_coc',
        'cho_xac_nhan_coc',
        'da_chot',
        'da_tra_file',
        'hoan_thanh',
        'da_huy'
    ));

-- 3. Đảm bảo có cột package_type trong bookings (nếu chưa có)
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS package_type VARCHAR(255);

-- 4. Đảm bảo cột status có default 'lead'
ALTER TABLE bookings
    ALTER COLUMN status SET DEFAULT 'lead';
