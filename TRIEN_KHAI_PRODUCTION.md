# 🚀 HƯỚNG DẪN TRIỂN KHAI PRODUCTION & CẤU HÌNH WEBHOOK SEPAY (LENSY CRM)

> **Dự án:** Lensy CRM - Trợ lý số cho Freelance Photographers & Boutique Studios  
> **Phiên bản:** Production 1.0 (Multi-Tenant + Code-Splitting + SePAY Automation)  
> **Cập nhật:** 30/09/2026

---

## 📋 MỤC LỤC
1. [Tổng Quan Kiến Trúc Production](#1-tổng-quan-kiến-trúc-production)
2. [Triển Khai Lên Vercel (Khuyến nghị)](#2-triển-khai-lên-vercel-khuyến-nghị)
3. [Triển Khai Lên Cloudflare Pages (Miễn phí 100% băng thông)](#3-triển-khai-lên-cloudflare-pages)
4. [Cấu Hình Webhook Tự Động Hóa Dòng Tiền (SePAY / Casso)](#4-cấu-hình-webhook-tự-động-hóa-dòng-tiền-sepay--casso)
5. [Cấu Hình Tên Miền Riêng (Custom Domain DNS)](#5-cấu-hình-tên-miền-riêng-custom-domain-dns)
6. [Quy Trình Kiểm Tra Sau Khi Triển Khai (Go-Live Checklist)](#6-quy-trình-kiểm-tra-sau-khi-triển-khai-go-live-checklist)

---

## 1. TỔNG QUAN KIẾN TRÚC PRODUCTION

```
   [ Khách hàng / Thợ ảnh ]
              │
              ▼ HTTPS
 ┌─────────────────────────────┐
 │   Vercel / Cloudflare CDN   │  <-- SPA Bundle (~48 kB index.js, ~74 kB quote)
 │  (lensy.vn / crm.mirmia.vn) │
 └──────────────┬──────────────┘
                │
         ┌──────┴──────┐
         ▼             ▼
┌────────────────┐ ┌───────────────────────────┐
│ Client-side    │ │ Webhook Endpoint          │ <── [ Ngân hàng / SePAY ]
│ Supabase SDK   │ │ POST /api/sepay-webhook   │     (Khách quét VietQR)
└────────┬───────┘ └─────────────┬─────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
       ┌───────────────────────────┐
       │     Supabase Cloud        │
       │  • PostgreSQL DB (RLS)    │
       │  • Auth & Multi-Tenants   │
       │  • Storage (Image Buckets)│
       │  • Realtime Subscriptions │
       └───────────────────────────┘
```

---

## 2. TRIỂN KHAI LÊN VERCEL (KHUYẾN NGHỊ)

Vercel là lựa chọn tối ưu vì hỗ trợ trực tiếp cả **Frontend React SPA** và **Serverless Function Webhook** (`api/sepay-webhook.js`) trên cùng 1 domain.

### Bước 2.1: Kết nối kho mã nguồn (GitHub)
1. Đẩy mã nguồn dự án lên GitHub Repository (Private hoặc Public).
2. Truy cập [vercel.com](https://vercel.com) $\rightarrow$ Đăng nhập $\rightarrow$ Bấm **"Add New..."** $\rightarrow$ Chọn **"Project"**.
3. Chọn Repository `lensy-crm` của bạn $\rightarrow$ Bấm **Import**.

### Bước 2.2: Cấu hình Build & Output
Hệ thống đã chuẩn bị sẵn file `vercel.json`. Trên giao diện Vercel, kiểm tra:
* **Framework Preset:** `Vite`
* **Root Directory:** `./` (để nguyên thư mục gốc, file `vercel.json` sẽ tự điều hướng build `frontend`)
* **Build Command:** `cd frontend && npm run build`
* **Output Directory:** `frontend/dist`

### Bước 2.3: Thêm Biến Môi Trường (Environment Variables)
Tại mục **Environment Variables**, thêm các biến sau:

| Tên biến | Giá trị | Ghi chú |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://zdmwjcadambtnbqwrele.supabase.co` | URL kết nối Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Public Anon Key cho frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Service Role Key (Chỉ serverless dùng để cập nhật booking khi có webhook) |
| `SEPAY_API_KEY` | `Mã_API_Key_SePAY_Của_Bạn` | (Tùy chọn) Khóa xác thực an toàn từ SePAY |

4. Bấm nút **Deploy** $\rightarrow$ Quá trình hoàn tất trong ~60 giây!

---

## 3. TRIỂN KHAI LÊN CLOUDFLARE PAGES

Cloudflare Pages cung cấp băng thông không giới hạn và tốc độ CDN toàn cầu siêu nhanh tại Việt Nam.

1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) $\rightarrow$ Vào **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
2. Chọn repository $\rightarrow$ Cấu hình:
   * **Framework preset:** `Vite`
   * **Root directory:** `frontend`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
3. Thêm Environment Variables: `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
4. File `frontend/public/_redirects` đã có sẵn, tự động điều hướng tất cả các đường dẫn (`/* -> /index.html 200`) không lo lỗi 404 khi F5.

---

## 4. CẤU HÌNH WEBHOOK TỰ ĐỘNG HÓA DÒNG TIỀN (SEPAY / CASSO)

Khi khách hàng quét mã VietQR trên trang Báo giá `/quote/:token`, ngân hàng sẽ tự động bắn webhook về hệ thống để chuyển trạng thái lịch chụp sang **Đã chốt (da_chot)** và ghi nhận dòng tiền 24/7.

### Bước 4.1: Đăng ký SePAY
1. Truy cập [my.sepay.vn](https://my.sepay.vn) $\rightarrow$ Đăng ký tài khoản $\rightarrow$ Kết nối tài khoản ngân hàng của Studio (MB Bank, Vietcombank, Techcombank, ACB...).
2. Vào mục **Cấu hình Webhook (Webhooks)** $\rightarrow$ Bấm **Tạo Webhook mới**.

### Bước 4.2: Thiết lập thông số Webhook trên SePAY
* **URL Webhook:**
  * Nếu dùng Vercel: `https://ten-mien-cua-ban.vercel.app/api/sepay-webhook` (hoặc `https://crm.mirmia.vn/api/sepay-webhook`)
  * Nếu dùng Supabase Edge Function: `https://zdmwjcadambtnbqwrele.supabase.co/functions/v1/sepay-webhook`
* **Phương thức:** `POST`
* **Kiểu dữ liệu:** `JSON`
* **Xác thực (Authentication):** Chọn `API Key` $\rightarrow$ Nhập khóa bí mật bạn đã đặt tại `SEPAY_API_KEY`.
* **Sự kiện kích hoạt:** Tích chọn `Nhận tiền vào (Tài khoản tăng số dư)`.

### Bước 4.3: Kiểm thử Webhook
1. Trên giao diện SePAY, bấm nút **"Gửi test thử nghiệm"**.
2. Kiểm tra log trên Vercel Functions hoặc Supabase $\rightarrow$ Nhận phản hồi `{ success: true, message: "..." }`.
3. Khi khách quét mã VietQR có nội dung `LENSY [MÃ_BÁO_GIÁ]`, hệ thống tự động:
   * Cập nhật `bookings.status = 'da_chot'`.
   * Ghi nhận giao dịch vào bảng `transactions`.
   * Thẻ Kanban trên màn hình Admin tự động nhảy sang cột **Đã Cọc** kèm pháo hoa chúc mừng mà không cần tải lại trang.

---

## 5. CẤU HÌNH TÊN MIỀN RIÊNG (CUSTOM DOMAIN DNS)

Để thương hiệu chuyên nghiệp hơn (ví dụ: `crm.mirmia.vn` hoặc `lensy.vn`), hãy trỏ bản ghi DNS tại nhà cung cấp tên miền (Cloudflare, iNET, PA Vietnam, MatBao):

### Trường hợp 1: Tên miền phụ (Subdomain, ví dụ: `crm.mirmia.vn`)
| Loại (Type) | Tên (Host/Name) | Giá trị (Value/Target) | Proxy / TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `crm` | `cname.vercel-dns.com` | DNS Only (hoặc Auto) |

### Trường hợp 2: Tên miền gốc (Apex Domain, ví dụ: `lensy.vn`)
| Loại (Type) | Tên (Host/Name) | Giá trị (Value/Target) | Proxy / TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Auto |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto |

Sau khi trỏ xong, Vercel/Cloudflare sẽ tự động cấp phát chứng chỉ **SSL HTTPS miễn phí** trong vòng 5 - 15 phút.

---

## 6. QUY TRÌNH KIỂM TRA SAU KHI TRIỂN KHAI (GO-LIVE CHECKLIST)

- [ ] **1. Kiểm tra Routing Client-side:**
  - Truy cập trực tiếp đường dẫn `/dashboard` $\rightarrow$ Tự động chuyển hướng về `/login` nếu chưa đăng nhập.
  - F5 tải lại trang `/dashboard/gears`, `/dashboard/packages`, `/dashboard/clients` $\rightarrow$ Không bị lỗi 404.
- [ ] **2. Kiểm tra Link Báo Giá Công Khai:**
  - Mở `/quote` hoặc `/quote/[token]` trên điện thoại di động (chế độ Ẩn danh / 4G).
  - Tốc độ hiển thị dưới 1 giây, mã VietQR hiển thị rõ ràng đúng số tài khoản và số tiền cọc 30%.
- [ ] **3. Kiểm tra PWA (Cài đặt làm App):**
  - Mở website trên Chrome/Safari điện thoại $\rightarrow$ Chọn *"Thêm vào Màn hình chính (Install App)"*.
  - Biểu tượng Lensy xuất hiện trên màn hình điện thoại và mở chạy độc lập như app native.
- [ ] **4. Kiểm tra Cọc Tự Động:**
  - Thử chuyển khoản 10.000đ với nội dung đúng cú pháp hoặc dùng nút `⚡ Test Cọc (SePAY)` trên Dashboard để kiểm tra phản hồi real-time.
