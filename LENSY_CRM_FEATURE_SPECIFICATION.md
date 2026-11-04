# 📸 LENSY CRM - TÀI LIỆU ĐẶC TẢ TÍNH NĂNG & THIẾT KẾ HỆ THỐNG
> **Dành cho:** UI/UX Designer & Product Design Agent  
> **Phiên bản:** 2.0 (High-End Studio Management & CRM)  
> **Ngôn ngữ thiết kế:** Warm Light Studio, Hiện đại, Trực quan, Tối ưu dòng tiền & thao tác nhanh.

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

### 1.1. Lensy CRM là gì?
**Lensy CRM** là nền tảng quản trị vận hành toàn diện (*All-in-one Studio Management & CRM Platform*) được may đo riêng cho:
- **Nhiếp ảnh gia tự do (Freelance Photographers)**.
- **Boutique Photo Studios** (Studio cưới, phóng sự, chân dung nghệ thuật, lookbook, sự kiện thương mại).
- **Production House & Ekip Hậu Kỳ**.

### 1.2. Vấn đề cốt lõi Lensy giải quyết
1. **Thất thoát dòng tiền & nợ đọng:** Tự động hóa tính toán cọc (30%), theo dõi công nợ sau khi giao file và doanh thu thực nhận.
2. **Trùng lịch chụp & trùng thiết bị (Clash Detection):** Cảnh báo tự động khi 1 máy ảnh, ống kính hoặc thành viên ekip bị gán vào 2 ca chụp trùng khung giờ.
3. **Báo giá thủ công, thiếu chuyên nghiệp:** Cung cấp link Báo giá điện tử tương tác (*Interactive Proposal/Quote*) tích hợp mã VietQR động 1-chạm giúp khách hàng chốt cọc chỉ trong 60 giây.
4. **Phân bổ nhân sự & tính thù lao ekip (Payroll):** Tự động tính hoa hồng/lương cho thợ phụ, trợ lý, makeup, retoucher theo từng show diễn ra.

---

## 2. NGÔN NGỮ THIẾT KẾ & HỆ THỐNG GIAO DIỆN (UI/UX DESIGN SYSTEM)

### 2.1. Triết lý thẩm mỹ (Aesthetic Philosophy)
- **Phong cách chủ đạo:** *Warm Studio Clean* – Giao diện lấy cảm hứng từ không gian ánh sáng studio chụp ảnh chuyên nghiệp: sáng sủa, tinh khiết, tương phản cao, tối ưu cho việc nhìn liên tục nhiều giờ làm việc.
- **Tone màu chủ đạo (Brand Accent):**
  - **Lensy Amber/Orange:** `#F97316` (Orange-500), `#EA580C` (Orange-600), `#F59E0B` (Amber-500) biểu trưng cho sáng tạo, ống kính và năng lượng tích cực.
  - **Background tổng thể:** `#F8FAFC` (Slate-50) kết hợp mảng thẻ trắng tinh khiết `#FFFFFF` và hiệu ứng kính mờ (`backdrop-blur-md`).
  - **Khối Hero Điểm Nhấn (Hero Metrics Block):** Nền dải chuyển sắc ấm áp `bg-gradient-to-br from-[#FF9A44] via-[#FC6076] to-[#A044FF]` hoặc `from-orange-500 via-[#df8653] to-amber-500`, tạo điểm tựa thị giác rực rỡ nhưng chứa 4 thẻ con nền trắng kính mờ tương phản cao.
- **Kiểu chữ (Typography):**
  - **Tiêu đề & Chữ thông thường:** `Plus Jakarta Sans` hoặc `Inter` với độ đậm vừa phải (`font-semibold` / `font-medium`), dễ đọc, thanh thoát.
  - **Số liệu tài chính (Numbers & Currencies):** **BẮT BUỘC dùng `font-sans font-bold tracking-tight`**. Tuyệt đối không dùng `font-mono` để tránh lỗi số 0 có gạch chéo (`Ø`) gây cảm giác kỹ thuật khô cứng.

### 2.2. Bảng mã màu trạng thái (Status Badges System)
Hệ thống sử dụng các pill bo tròn mềm mại (`rounded-full px-2.5 py-0.5 text-xs font-semibold`) với màu nền pastel dịu nhẹ:
- 🟡 **Lead (Chờ chốt):** `bg-amber-500/10 text-amber-700 border-amber-500/20`
- 🟢 **Deposited (Đã cọc):** `bg-emerald-500/10 text-emerald-700 border-emerald-500/20`
- 🔵 **Shot (Đã chụp):** `bg-blue-500/10 text-blue-700 border-blue-500/20`
- 🟣 **Editing (Đang hậu kỳ):** `bg-purple-500/10 text-purple-700 border-purple-500/20`
- ⚪ **Completed (Hoàn tất):** `bg-slate-500/10 text-slate-700 border-slate-500/20`
- 🔴 **Cancelled (Hủy show):** `bg-rose-500/10 text-rose-700 border-rose-500/20`

---

## 3. PHÂN QUYỀN NGƯỜI DÙNG & KIẾN TRÚC WORKSPACE (RBAC)

Hệ thống hỗ trợ cơ chế đa người dùng (Multi-tenant) với 4 cấp độ phân quyền chặt chẽ:

1. **Super Admin (Quản trị tối cao):**
   - Giám sát toàn bộ các Studio trong hệ thống, thông số kỹ thuật, cấu hình webhook toàn cầu và sao lưu dữ liệu.
2. **Studio Owner / Admin (Chủ Studio):**
   - Toàn quyền truy cập mọi tính năng: Báo cáo dòng tiền, Quản lý kho thiết bị, Cấu hình gói dịch vụ, Tính lương ekip, Quản lý khách hàng, Cài đặt Studio & Tài khoản ngân hàng nhận tiền.
3. **Studio Member (Thành viên Ekip - Thợ chụp, Retoucher, Trợ lý):**
   - Chỉ xem các ca chụp được phân công, lịch trình tác chiến, thiết bị được gán sử dụng.
   - **Bị khóa cứng (Strict RBAC):** Ẩn hoàn toàn doanh thu tổng, lợi nhuận ròng, bảng lương studio và cấu hình ngân hàng của chủ studio.
4. **Khách hàng (Client / End-User):**
   - Không cần tài khoản; tương tác qua Link đặt lịch cá nhân hóa (`/book/:username`) và Link Báo giá điện tử độc quyền (`/quote/:token`).

---

## 4. CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG (MODULE SPECIFICATIONS)

```
┌────────────────────────────────────────────────────────────────────────┐
│                              LENSY CRM                                 │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ VẬN HÀNH & LỊCH   │ QUẢN TRỊ NỘI BỘ   │ CỔNG KHÁCH HÀNG (PUBLIC)       │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Dashboard KPI   │ • Kho Thiết Bị    │ • Trang Báo Giá (/quote/:token)│
│ • Kanban Quy Trình│ • Gói Dịch Vụ     │ • Trang Đặt Lịch (/book/:user) │
│ • Lịch Theo Tuần  │ • Bảng Lương Ekip │ • Thanh Toán VietQR 1-Chạm     │
│ • Hồ Sơ Khách CRM │ • Cài Đặt Studio  │ • Kho Bàn Giao & Proofing Ảnh  │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

### MODULE 1: DASHBOARD & QUẢN TRÝ LỊCH CHỤP (COMMAND CENTER)
*Đường dẫn: `/dashboard`*

Đây là "Trái tim" vận hành hàng ngày của Studio:
1. **Khối Hero Metrics (4 KPI Cards tương phản cao):**
   - **Thẻ 1 (Trung Tâm Dòng Tiền & Lợi Nhuận):** Hiển thị Doanh thu thực thu, thanh tiến độ thu cọc (`% contract collection ratio`) và lợi nhuận ròng sau chi phí.
   - **Thẻ 2 (Ca Chụp Hôm Nay):** Đếm số show cần thực hiện trong ngày, hiển thị trạng thái giờ bấm máy gần nhất.
   - **Thẻ 3 (Cọc & Công Nợ):** Thống kê số tiền cọc đang chờ xác nhận và tổng công nợ còn lại của các show đã hoàn thành nhưng chưa thanh toán hết.
   - **Thẻ 4 (Hiệu Suất Tháng):** Tỷ lệ hoàn thành đúng hẹn, số show đã giao file/trả ảnh đúng cam kết.
2. **Bộ chuyển đổi 4 góc nhìn (View Switcher - Dạng Pills):**
   - **View 1: Danh Sách (Table View):** Bảng dữ liệu phân dòng chuẩn, tìm kiếm đa năng (Tên khách, SĐT, Mã show), lọc trạng thái, hiển thị giá tiền canh phải (`text-right font-sans font-bold`).
   - **View 2: Quy Trình Kanban (5 bước):** Kéo thả (`Drag & Drop`) thẻ show từ *Chờ cọc* ➔ *Đã cọc* ➔ *Đã chụp* ➔ *Đang hậu kỳ* ➔ *Đã giao file*.
   - **View 3: Thời Khóa Biểu Tuần (Calendar View):** Hiển thị khối thời gian trực quan theo ngày/giờ, phát hiện tức thì ca trùng lịch bằng viền đỏ cảnh báo.
   - **View 4: Biểu Đồ Tài Chính & ROI Thiết Bị:** Biểu đồ xu hướng doanh thu hàng tháng và tỷ suất hoàn vốn của từng thiết bị trong kho.
3. **Thao tác nhanh (Action Bar):**
   - Nút `+ Tạo Lịch Mới`: Mở modal nhập show chụp đầy đủ.
   - Nút `⚡ Pass Show`: Tạo lịch chụp nhanh khi nhận chuyển show gấp từ thợ khác hoặc đối tác mà chưa kịp soạn hợp đồng chi tiết.
   - Nút Nhắc Nợ: Mở danh sách khách còn nợ kèm mẫu tin nhắn nhắc thanh toán chuẩn hóa.

---

### MODULE 2: HỒ SƠ KHÁCH HÀNG (CLIENT CRM & LTV)
*Đường dẫn: `/dashboard/clients`*

1. **Chỉ số Vòng đời khách hàng (LTV Metrics):**
   - Tổng số khách hàng trong danh bạ.
   - Số lượng khách VIP (VIP Gold / VIP Diamond).
   - Tổng doanh thu tích lũy đã thu từ khách cũ.
   - Giá trị trung bình trên mỗi khách hàng (AOV - Average Order Value).
2. **Danh sách khách hàng thông minh:**
   - Phân loại thẻ thành viên: *Khách Mới*, *Thân Thiết*, *VIP Gold*, *VIP Diamond*.
   - Theo dõi số lần chụp (`Total Sessions`) và tổng tiền đã chi trả.
   - Xem nhanh ngày chụp gần nhất và trạng thái công nợ hiện tại.
3. **Modal Chi Tiết Hồ Sơ Khách (Client Profile Modal):**
   - Lịch sử tất cả các show đã thực hiện với Studio.
   - Ghi chú phong cách chụp ưa thích, yêu cầu trang điểm/ánh sáng riêng biệt của khách.
   - Nút gọi nhanh, gửi tin nhắn Zalo, xem lại các bộ ảnh đã bàn giao.

---

### MODULE 3: KHO THIẾT BỊ & CHỐNG TRÙNG LỊCH (GEARS MANAGEMENT)
*Đường dẫn: `/dashboard/gears`*

1. **Quản lý danh mục tài sản:**
   - Phân loại: Thân máy (Body), Ống kính (Lens), Đèn Studio (Flash/Strobe), Bộ kích sóng (Trigger), Phụ kiện (Gimbal, Tản sáng, Mic).
   - Quản lý mã thiết bị, số serial, giá mua và ngày bắt đầu khấu hao.
2. **Smart Conflict Scanner (Thuật toán quét trùng thiết bị):**
   - Khi xếp thiết bị cho 1 ca chụp mới, hệ thống tự động kiểm tra thời gian thực. Nếu máy ảnh/ống kính đó đã được chỉ định cho 1 ca chụp khác có giờ chụp chồng lấn, hệ thống sẽ cảnh báo đỏ và ngăn chặn lưu trùng.
3. **Báo cáo khấu hao & Tần suất sử dụng:**
   - Theo dõi thiết bị nào chụp nhiều nhất, thiết bị nào "nằm kho" lâu ngày để Studio có chiến lược thanh lý hoặc đầu tư thiết bị mới.

---

### MODULE 4: GÓI DỊCH VỤ & BẢNG GIÁ (PACKAGES & PRICING)
*Đường dẫn: `/dashboard/packages`*

1. **Quản lý gói chụp đa dạng:**
   - Tạo và chỉnh sửa các gói: Cưới Studio, Cưới Ngoại cảnh, Phóng sự cưới, Chân dung Profile, Lookbook Thời trang, Sự kiện doanh nghiệp, Sinh nhật / Family.
2. **Cấu hình chi tiết gói:**
   - Mức giá trọn gói niêm yết (VNĐ).
   - Thời lượng buổi chụp (giờ).
   - Danh sách quyền lợi bao gồm: Số file RAW bàn giao, số ảnh Photoshop kỹ lưỡng, in photobook/khung ảnh cổng, váy cưới/vest đi kèm.
   - Danh sách thiết bị cam kết mang theo cho gói này.
3. **Tùy chọn bật/tắt (Public Visibility):**
   - Bật hoặc tắt để gói có xuất hiện trên trang đặt lịch online của khách hàng hay không.

---

### MODULE 5: BẢNG LƯƠNG & THÙ LAO Ê-KÍP (EKIP PAYROLL)
*Đường dẫn: `/dashboard/payroll`*

1. **Quản lý nhân sự Studio:**
   - Danh sách: Thợ chính (Main Shooter), Thợ phụ (2nd Shooter), Trợ lý ánh sáng (Assistant), Retoucher, Chuyên viên trang điểm (MUA).
2. **Tính toán thù lao tự động:**
   - Hỗ trợ 2 phương thức: Mức lương cứng theo ca (Flat fee) hoặc % hoa hồng theo giá trị gói chụp.
3. **Theo dõi trạng thái thanh toán lương:**
   - *Chưa thanh toán* ➔ *Đã tạm ứng* ➔ *Đã tất toán*.
   - Xuất phiếu lương cá nhân cho từng thợ vào cuối tháng.

---

### MODULE 6: TRANG BÁO GIÁ ĐIỆN TỬ (SMART PROPOSAL & QUOTE)
*Đường dẫn: `/quote/:token` (Dành cho Khách Hàng)*

Được thiết kế theo tiêu chuẩn một bản Proposal / Hợp đồng điện tử sang trọng chuẩn Studio:
1. **Header Thương Hiệu:**
   - Logo Studio, Tên Studio, Thông tin khách hàng, Mã báo giá độc quyền, Ngày hiệu lực.
2. **Thông tin ca chụp & Gói lựa chọn:**
   - Tên gói dịch vụ, Địa điểm chụp, Khung giờ dự kiến, Thời lượng.
3. **Quyền lợi chi tiết (Scope of Work):**
   - Liệt kê trực quan các quyền lợi: File ảnh, album, makeup, thợ chụp.
4. **Cam kết thiết bị chuyên nghiệp (Equipment Commitment):**
   - **Tự động map dữ liệu:** Truy vấn tên thiết bị từ kho (VD: *Body Canon EOS R*, *Lens Canon RF 85mm f/2 Macro*, *Đèn Godox V860iii*). **Tuyệt đối không hiển thị mã UUID thô**.
5. **Bảng quyết toán tài chính 2 cột (Financial Settlement Grid):**
   - Cột trái: Tên khoản chi phí.
   - Cột phải (`text-right font-sans font-bold`): Số tiền cụ thể.
   - Làm nổi bật ô **"Tổng Chi Phí Trọn Gói"** và ô **"Tiền Đặt Cọc Giữ Lịch (30%)"** màu cam rực rỡ, không bị rớt dòng.
   - Hiển thị rõ: *Khoản còn lại (70%) sẽ thanh toán sau khi bàn giao sản phẩm hoàn chỉnh*.
6. **Thanh toán VietQR 1-Chạm:**
   - Nút lớn: `[Xác Nhận & Cọc Tiền (Mã QR)]`.
   - Bấm vào sẽ mở popup hiển thị mã QR thanh toán chuẩn Napas VietQR có sẵn số tiền cọc và cú pháp chuyển khoản chính xác `[Mã Show - SĐT]`.
7. **Hỗ trợ in ấn / Xuất PDF (Print CSS):**
   - Tích hợp stylesheet riêng (`@media print`): Khi bấm Ctrl+P hoặc nút In, hệ thống tự động căn chỉnh khổ giấy A4, ẩn các nút bấm thừa, cho ra bản in PDF sắc nét, thanh lịch.

---

### MODULE 7: TRANG ĐẶT LỊCH CÔNG KHAI (PUBLIC BOOKING PORTAL)
*Đường dẫn: `/book/:username` hoặc `/book/studio/:slug`*

1. **Lịch trống thời gian thực (Interactive Availability Calendar):**
   - Khách hàng tự chọn ngày mong muốn; hệ thống tự động khóa những ngày/khung giờ studio đã kín lịch chụp.
2. **Chọn gói dịch vụ tương tác:**
   - Khách xem hình ảnh minh họa, quyền lợi và chọn gói trực tiếp.
3. **Form điền thông tin khách hàng:**
   - Họ tên, Số điện thoại (Zalo), Email, Ghi chú đặc biệt.
4. **Tự động hóa đổ dữ liệu:**
   - Ngay khi khách hoàn tất gửi form, dữ liệu tự động tạo một Booking mới ở trạng thái *Lead* trong Dashboard của Studio và gửi thông báo tức thì đến điện thoại chủ Studio.

---

### MODULE 8: CÀI ĐẶT STUDIO & TÍCH HỢP (SETTINGS & INTEGRATIONS)
*Đường dẫn: `/dashboard/studio-settings` và `/dashboard/settings`*

1. **Hồ sơ Studio:**
   - Tên thương hiệu, Logo, Slogan, Địa chỉ, Số điện thoại hỗ trợ, Hotline.
   - Tỷ lệ cọc mặc định (Mặc định 30%, có thể chỉnh 20% - 50%).
2. **Cấu hình Ngân hàng nhận tiền (VietQR Config):**
   - Chọn ngân hàng (Vietcombank, MB, Techcombank, ACB, v.v.).
   - Số tài khoản & Tên chủ tài khoản (In hoa không dấu).
   - Cú pháp nội dung chuyển khoản tự động.
3. **Tích hợp tự động hóa:**
   - **Google Calendar Sync:** Đồng bộ lịch chụp trực tiếp vào Google Calendar của thợ để nhận thông báo trên điện thoại.
   - **Telegram Notifier:** Bắn tin nhắn vào nhóm chat ekip mỗi khi có khách đặt lịch mới hoặc chốt cọc thành công.
   - **Payment Webhook:** Tích hợp SePay / Cass để tự động chuyển trạng thái lịch chụp sang *Đã cọc* khi tiền về tài khoản ngân hàng.
4. **Hỗ trợ PWA (Progressive Web App):**
   - Cài đặt như app native trên màn hình chính của iPhone, iPad, Android và Laptop.
   - Có banner cảnh báo mất kết nối mạng (`Offline Banner`) đảm bảo không bị mất dữ liệu khi chụp ở ngoại cảnh sóng yếu.

---

## 5. BẢNG TỔNG KẾT ROUTING & THÀNH PHẦN (SYSTEM COMPONENT MAP)

| URL Path | Thành Phần Giao Diện | Phân Quyền | Chức Năng Chính |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage.tsx` | Công khai | Đăng nhập Email/Password, Magic Link |
| `/onboarding` | `OnboardingPage.tsx` | Đã đăng nhập | Khởi tạo Studio, phân vai trò Freelancer/Studio |
| `/dashboard` | `PhotographerDashboard.tsx` & `ClayStudioDashboard.tsx` | Studio Owner & Ekip | Trung tâm điều khiển, 4 KPI, Lịch Kanban/Bảng |
| `/dashboard/clients` | `ClientsManagementPage.tsx` | Studio Owner | Danh bạ khách hàng, LTV, phân hạng VIP |
| `/dashboard/gears` | `GearsManagementPage.tsx` | Studio Owner | Kho thiết bị, kiểm tra trùng lịch |
| `/dashboard/packages`| `PackagesManagementPage.tsx`| Studio Owner | Bảng giá và quyền lợi các gói dịch vụ |
| `/dashboard/payroll` | `PayrollManagementPage.tsx` | Studio Owner | Bảng lương, đối soát hoa hồng ekip |
| `/dashboard/studio-settings` | `StudioSettingsPage.tsx` | Studio Owner | Cấu hình Studio, tỷ lệ cọc, ngân hàng VietQR |
| `/dashboard/settings`| `SettingsPage.tsx` | Toàn bộ thành viên | Thông tin cá nhân, mật khẩu |
| `/dashboard/super-admin` | `SuperAdminConsolePage.tsx`| Super Admin | Giám sát toàn hệ thống, log kỹ thuật |
| `/book/:username` | `PublicBookingPage.tsx` | Khách hàng | Cổng đặt lịch trực tuyến cá nhân thợ |
| `/book/studio/:slug` | `PublicBookingPage.tsx` | Khách hàng | Cổng đặt lịch trực tuyến của Studio |
| `/quote/:token` | `QuoteTemplate.tsx` & `QuoteView.tsx` | Khách hàng | Báo giá điện tử cao cấp, quét cọc VietQR |

---

## 6. HƯỚNG DẪN DÀNH CHO AGENT THIẾT KẾ GIAO DIỆN (UI/UX DESIGN AGENT BRIEF)

Khi tiếp quản thiết kế hoặc tinh chỉnh giao diện cho Lensy CRM, **Design Agent cần tuân thủ nghiêm ngặt 5 nguyên tắc sau:**

1. **Giữ vững phong cách Warm Studio Light:**
   - Nền sáng sang trọng (`#F8FAFC` hoặc `#FBFBFC`), tuyệt đối không tự ý chuyển toàn bộ hệ thống sang đen kịt (Pitch Black Obsidian).
   - Tôn vinh các thẻ trắng bóng bẩy với đường viền mỏng nhẹ (`border border-slate-200/80`) và đổ bóng nhẹ nhàng (`shadow-sm`, `shadow-md`).
2. **Chuẩn hóa Typo số liệu tài chính:**
   - Toàn bộ số tiền VNĐ (VD: `12.060.000 đ`) phải dùng font sans-serif tròn trịa (`font-sans font-bold`), không dùng `font-mono` gây số 0 bị chém ngang.
3. **Trang Báo Giá là Checkout, không phải Form đăng ký:**
   - Trang Báo Giá (`/quote/:token`) là nơi khách hàng chốt hợp đồng và trả tiền. Phải ẩn toàn bộ form đặt lịch điền lại tên/sđt, dồn sự chú ý vào **Quyền lợi ➔ Thiết bị cam kết ➔ Bảng tài chính 2 cột ➔ Nút cọc VietQR**.
4. **Không bao giờ hiển thị mã kỹ thuật (UUID) ra UI:**
   - Mọi thực thể (Thiết bị, Nhân sự, Gói) phải được hiển thị bằng **TÊN THÂN THIỆN**, có icon minh họa phù hợp (Camera, Lens, Flash).
5. **Thiết kế Mobile-First & Touch-Friendly:**
   - 70% chủ Studio thao tác trên điện thoại hoặc iPad tại phim trường. Các nút bấm hành động phải đạt chuẩn chiều cao tối thiểu `min-h-[44px]`, các tab chuyển đổi trên mobile dùng Dropdown/Pills cuộn ngang mượt mà.
