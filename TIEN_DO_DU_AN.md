# 📌 NHẬT KÝ TIẾN ĐỘ DỰ ÁN LENSY CRM (MIRMIA STUDIO)

> **Cập nhật lần cuối:** 23/09/2026  
> **Trạng thái tổng thể:** Đã hoàn thành 100% Giai Đoạn 1 (Core MVP). Sẵn sàng bắt đầu Giai Đoạn 2.

---

## 🏆 CÁC GIAI ĐOẠN TRIỂN KHAI

### ✅ Giai Đoạn 1: Hoàn Thiện Tính Năng Core MVP (ĐÃ XONG 100%)
*   **1. Quét Xung Đột Thiết Bị & Nhân Sự (Gear Conflict Scanner - USP 1):**
    *   File: `frontend/src/lib/conflictScanner.ts`
    *   Quét chéo lịch cùng ngày, cảnh báo đụng máy Sony A7 IV / Lens 70-200 / thợ phụ.
    *   Nút bấm 1 chạm tự động cộng thêm phí thuê ngoài (+800.000đ/máy).
*   **2. Trình Tạo Báo Giá Mới (Quote Generator UI):**
    *   File: `frontend/src/components/dashboard/CreateQuoteModal.tsx`
    *   Nút `+ Tạo Báo Giá Mới` trên DashboardHeader.
    *   Tự động sinh `quote_token`, lưu Supabase `bookings`, xuất link và nút gửi Zalo.
*   **3. Dynamic Quote Route (`/quote/:token`):**
    *   File: `frontend/src/components/quote/QuoteView.tsx` & `App.tsx`
    *   Khách truy cập link cá nhân hóa xem dữ liệu động từ Supabase.
    *   Hiển thị VietQR cọc 30%, Skeleton Loading và trang 404 thân thiện.
*   **4. Kết quả kiểm thử:**
    *   `node test_system.cjs`: 24/24 tiêu chí ĐẠT (100% PASS).
    *   `npm run build`: 0 lỗi TypeScript, Production bundle sạch.

---

### ⏳ Giai Đoạn 2: Tự Động Hóa Dòng Tiền & Tích Hợp Lịch (KẾ HOẠCH TIẾP THEO)
1.  **Tự động nhận diện biến động số dư VietQR / SePAY / Casso:**
    *   Tích hợp webhook để khi khách chuyển khoản cọc 30%, hệ thống tự động đổi trạng thái từ `cho_coc` sang `da_chot` trong 3 giây.
2.  **Đồng bộ Google Calendar:**
    *   Tự động thêm sự kiện vào Google Calendar của thợ ảnh kèm thông tin khách và địa điểm chụp.
3.  **Tích hợp thông báo Zalo ZNS / SMS:**
    *   Tự động gửi tin nhắn xác nhận chốt lịch kèm hợp đồng qua Zalo cho khách hàng.

---

### ⏳ Giai Đoạn 3: Tối Ưu Hiệu Năng & Triển Khai Production
1.  **Code-splitting & Tối ưu tốc độ tải:**
    *   Áp dụng `React.lazy()` chia tách Dashboard và Quote View giúp trang báo giá tải dưới 100ms trên điện thoại 4G.
2.  **Triển khai Vercel / Cloudflare Pages & Gắn Tên Miền:**
    *   Triển khai web chính thức lên cloud (`crm.mirmia.vn` hoặc `lensy.vn`).
