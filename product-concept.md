## 1. Ý TƯỞNG SẢN PHẨM (PRODUCT CONCEPT)
**Tên dự kiến:** LensFlow / ShutterBiz
**Định vị:** Nền tảng "Trợ lý số" All-in-one chuyên biệt cho Freelance Photographer và Boutique Studio.
**Mục tiêu cốt lõi:** Số hóa toàn bộ luồng công việc từ khâu chốt lịch (Booking) đến khâu thu hồi công nợ (Final Payment), giúp nhiếp ảnh gia tối ưu hóa dòng tiền, chấm dứt tình trạng đụng lịch và nâng cao hình ảnh chuyên nghiệp trong mắt khách hàng.

## 2. CẤU TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
Hệ thống được thiết kế theo kiến trúc Micro-services cơ bản, chia thành 4 phân hệ (Modules) chính bám sát luồng công việc (Workflow):

| Phân hệ (Module) | Chức năng cốt lõi (Core Functions) | Đối tượng tương tác |
| :--- | :--- | :--- |
| **1. Booking & Workflow** | Tạo Link Báo Giá (Quote Link), Lịch trình (Calendar View), Bảng Kanban theo dõi tiến độ Job (Retouch, Delivery). | Khách hàng, Thợ ảnh chính, Thợ phụ, Retoucher. |
| **2. Finance (Dòng tiền)** | Quản lý Tiền cọc (Deposit), Nhắc nợ (Final Payment), Quản lý Chi phí sự kiện (Cost Allocation), Trích lập quỹ Khấu hao Thiết bị (Gear Depreciation). | Admin Studio, Thợ ảnh (Freelancer). |
| **3. Phân quyền (RBAC)** | Role-based Access Control: Phân chia quyền hạn xem dữ liệu. (VD: Retoucher chỉ xem file, Makeup chỉ xem giờ giấc, Admin xem doanh thu). | Quản lý Studio. |
| **4. Integration (Tích hợp)** | Đồng bộ Google Calendar/Apple Calendar, API gửi tin nhắn Zalo/SMS, Tích hợp link trả ảnh (Google Drive, Pixieset). | Hệ thống tự động. |

## 3. TÍNH NĂNG ĐỘT PHÁ (UNIQUE SELLING PROPOSITIONS - USP)
Đây là các tính năng tạo ra rào cản cạnh tranh, khiến nền tảng này khác biệt hoàn toàn với các ứng dụng ghi chú hoặc kế toán thông thường.

*   **AI Auto-Debt Collector (Trợ lý Thu hồi Công nợ Tinh tế):** Hệ thống tự động theo dõi trạng thái "Đã trả file ảnh" và đối chiếu với khoản tiền chưa thanh toán. Trợ lý AI sẽ tự động sinh ra các mẫu tin nhắn nhắc nợ với giọng văn chuyển đổi linh hoạt (từ nhắc nhở nhẹ nhàng ngày thứ 1, đến gửi kèm hóa đơn chuyên nghiệp ngày thứ 7), cho phép thợ ảnh gửi qua Zalo/SMS chỉ với 1 chạm.
*   **Gear & Resource Conflict Scanner (Cảnh báo Đụng tài nguyên):** Ngay khi thợ ảnh đang lập báo giá cho khách, hệ thống sẽ quét chéo lịch trình. Nếu phát hiện Body/Lens chuyên dụng hoặc nhân sự ruột (Makeup/Thợ phụ) đã bị gắn cho một Job khác cùng ngày, hệ thống sẽ cảnh báo đỏ (Red Flag) và đề xuất tự động cộng thêm "Chi phí thuê thiết bị ngoài" vào báo giá hiện tại.

## 4. HẠNG MỤC CẦN THIẾT ĐỂ BẮT ĐẦU TẠO PoC (PROOF OF CONCEPT)
Giai đoạn PoC (Chứng minh tính khả thi) cần tập trung nguồn lực vào việc giải quyết luồng công việc cơ bản nhất (Happy Path) và kiểm chứng 2 USP trên với một nhóm nhỏ người dùng đầu tiên.

**Hạng mục 1: Xác định phạm vi tính năng PoC (Scope of Work)**
*   Chỉ tập trung vào đối tượng **Freelance Photographer** (bỏ qua tính năng phân quyền Studio phức tạp).
*   Tính năng bắt buộc phải code: Tạo Link báo giá có tích hợp trạng thái "Đã cọc" -> Hiển thị lịch trên Calendar -> Tính năng nhắc nợ tự động (Rule-based cơ bản, chưa cần AI quá phức tạp).
*   Tính năng loại bỏ khỏi PoC: Quản lý khấu hao dài hạn, Ứng dụng di động Native (Tập trung làm Web-app Responsive trước).

**Hạng mục 2: Thiết kế Giao diện (UI/UX Wireframing)**
*   Cần thiết kế bản Mockup trên Figma tập trung mạnh vào **Trải nghiệm Mobile** (ưu tiên Mobile-first) vì thợ ảnh thường thao tác trên điện thoại khi đang ở phim trường.
*   Thiết kế giao diện "Quote Link" phía khách hàng (Client-facing) sao cho trực quan, sang trọng, có nút "Xác nhận chốt lịch" rõ ràng.

**Hạng mục 3: Lựa chọn Tech Stack (Công nghệ) & Tích hợp**
*   **Front-end:** React.js hoặc Next.js (Responsive tốt trên cả Web và Mobile browser).
*   **Back-end & Database:** Node.js và Firebase / Supabase (Phù hợp để phát triển PoC tốc độ cao, hỗ trợ Real-time Database cho bảng Kanban).
*   **Tích hợp (Core API):** Bắt buộc tích hợp Zalo ZNS API (để gửi tin nhắn nhắc nợ/nhắc lịch) và Google Calendar API (để đồng bộ lịch cá nhân của thợ ảnh).

**Hạng mục 4: Chuẩn bị Dữ liệu giả lập (Mock Data) & Kế hoạch Beta Test**
*   Xây dựng bộ dữ liệu giả lập cho 10 loại thiết bị nhiếp ảnh phổ biến (Body Sony/Canon, Lens 70-200, 24-70, Flash) để test tính năng cảnh báo trùng lặp (Conflict Scanner).
*   Chọn lọc và mời 5-10 thợ ảnh Freelance quen biết tham gia test PoC kín (Closed Beta) trong vòng 2 tuần để thu thập phản hồi về mức độ tiện dụng (Usability).