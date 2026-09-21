-- ==========================================================
-- LensFlow CRM - Supabase Database Schema (PoC)
-- Optimized for Freelance Photographers & Boutique Studios
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. GEARS / EQUIPMENT INVENTORY
CREATE TABLE IF NOT EXISTS gears (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('body', 'lens', 'lighting', 'audio', 'accessory', 'crew')),
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    estimated_rental_cost NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BOOKINGS / JOBS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_email VARCHAR(255),
    session_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    package_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(12, 2) GENERATED ALWAYS AS (package_price - paid_amount) STORED,
    workflow_stage VARCHAR(50) NOT NULL DEFAULT 'lead',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    quote_token VARCHAR(100) UNIQUE NOT NULL,
    drive_delivery_link TEXT,
    delivery_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BOOKING GEAR ALLOCATIONS (Many-to-Many)
CREATE TABLE IF NOT EXISTS booking_gears (
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    gear_id UUID REFERENCES gears(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, gear_id)
);

-- 4. WORKFLOW AUDIT LOGS
CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    previous_stage VARCHAR(50),
    new_stage VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- SEED DATA: 10 THIẾT BỊ NHIẾP ẢNH PHỔ BIẾN
-- ==========================================================
INSERT INTO gears (id, name, category, model, serial_number, estimated_rental_cost, status)
VALUES
    ('c1111111-1111-1111-1111-111111111101', 'Body Sony A7 IV #1', 'body', 'Sony Alpha 7 IV', 'SN-SNY-0982', 450000, 'available'),
    ('c1111111-1111-1111-1111-111111111102', 'Body Sony A7 IV #2 (Backup)', 'body', 'Sony Alpha 7 IV', 'SN-SNY-0983', 450000, 'available'),
    ('c1111111-1111-1111-1111-111111111103', 'Body Canon EOS R6 Mark II', 'body', 'Canon EOS R6 II', 'SN-CAN-5541', 500000, 'available'),
    ('c1111111-1111-1111-1111-111111111104', 'Lens Sony FE 24-70mm F2.8 GM II', 'lens', 'SEL2470GM2', 'SN-LNS-2470', 350000, 'available'),
    ('c1111111-1111-1111-1111-111111111105', 'Lens Sony FE 70-200mm F2.8 GM OSS II', 'lens', 'SEL70200GM2', 'SN-LNS-70200', 450000, 'available'),
    ('c1111111-1111-1111-1111-111111111106', 'Lens Sony FE 50mm F1.2 GM', 'lens', 'SEL50F12GM', 'SN-LNS-5012', 300000, 'available'),
    ('c1111111-1111-1111-1111-111111111107', 'Lens Canon RF 28-70mm F2L USM', 'lens', 'RF 28-70 F2', 'SN-LNS-RF2870', 600000, 'available'),
    ('c1111111-1111-1111-1111-111111111108', 'Đèn Flash Godox V1 (Sony mount)', 'lighting', 'Godox V1-S', 'SN-FL-GDXV1', 150000, 'available'),
    ('c1111111-1111-1111-1111-111111111109', 'Đèn Flash Godox AD200 Pro + Trigger', 'lighting', 'Godox AD200Pro', 'SN-FL-AD200', 250000, 'available'),
    ('c1111111-1111-1111-1111-111111111110', 'Thợ phụ / Trợ lý chụp (Second Shooter)', 'crew', 'Assistant / Lighting Guy', 'CREW-01', 500000, 'available')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- SEED DATA: CÁC BOOKING MẪU ĐỂ TEST CONFLICT & DEBT COLLECTOR
-- ==========================================================
INSERT INTO bookings (
    id, client_name, client_phone, client_email, session_type, 
    event_date, start_time, end_time, location, 
    package_price, deposit_amount, paid_amount, 
    workflow_stage, payment_status, quote_token, drive_delivery_link, delivery_date, notes
)
VALUES
    -- Booking 1: Test Đụng lịch ngày 2026-09-25 (Đã giữ Sony A7 IV #1 và 24-70 GM II)
    (
        'b2222222-2222-2222-2222-222222222201', 'Anh Tuấn & Chị Mai', '0901234567', 'tuanmai@gmail.com', 'wedding',
        '2026-09-25', '07:30', '13:30', 'Trung tâm tiệc cưới White Palace, Q. Phú Nhuận',
        12000000, 3000000, 3000000,
        'booked', 'deposit_paid', 'quote-tuanmai-wedding', NULL, NULL, 'Gói phóng sự cưới 1 máy chính + 1 trợ lý'
    ),
    -- Booking 2: Test Nhắc nợ (Delivered 4 ngày trước, chưa thu nốt 5.000.000đ)
    (
        'b2222222-2222-2222-2222-222222222202', 'Nguyễn Hoàng Oanh', '0918765432', 'hoangoanh.lookbook@gmail.com', 'lookbook',
        '2026-09-17', '14:00', '18:00', 'Studio Lam Vũ, Q. 3',
        8000000, 3000000, 3000000,
        'delivered', 'deposit_paid', 'quote-hoangoanh-lookbook', 'https://drive.google.com/drive/folders/sample-lookbook-link', '2026-09-18 10:00:00+07', 'Chụp BST Thu Đông 15 set đồ'
    ),
    -- Booking 3: Test Nhắc nợ gắt (Delivered 9 ngày trước, nợ 10.000.000đ)
    (
        'b2222222-2222-2222-2222-222222222203', 'Công ty Truyền thông BrandX', '0989112233', 'marketing@brandx.vn', 'commercial',
        '2026-09-10', '09:00', '17:00', 'Showroom VinFast Landmark 81',
        20000000, 10000000, 10000000,
        'delivered', 'deposit_paid', 'quote-brandx-event', 'https://pixieset.com/sample/brandx-event', '2026-09-12 16:30:00+07', 'Quay chụp event khai trương'
    )
ON CONFLICT (id) DO NOTHING;

-- Gán thiết bị cho Booking 1 để sẵn sàng test quét đụng thiết bị
INSERT INTO booking_gears (booking_id, gear_id)
VALUES
    ('b2222222-2222-2222-2222-222222222201', 'c1111111-1111-1111-1111-111111111101'), -- Sony A7 IV #1
    ('b2222222-2222-2222-2222-222222222201', 'c1111111-1111-1111-1111-111111111104')  -- 24-70 GM II
ON CONFLICT DO NOTHING;
