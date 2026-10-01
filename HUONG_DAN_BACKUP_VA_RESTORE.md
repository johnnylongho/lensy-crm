# Hướng Dẫn Sao Lưu & Khôi Phục Giao Diện Lensy Studio CRM

Tài liệu này ghi lại thông tin sao lưu phiên bản giao diện và hướng dẫn chuyển đổi hoặc khôi phục (restore) toàn diện trong trường hợp bạn muốn quay lại phiên bản giao diện ban đầu.

---

## 1. Các Bản Sao Lưu Đã Được Tạo Tự Động

Chúng tôi đã bảo vệ an toàn 100% mã nguồn ban đầu của bạn qua **3 lớp dự phòng độc lập**:

### Lớp 1: Thư mục vật lý dự phòng trực tiếp
- **Đường dẫn**: `d:\Lensy - CRM\frontend\src_backup_classic`
- Chứa toàn bộ mã nguồn của giao diện ban đầu (`src/`) trước khi nâng cấp.

### Lớp 2: Nhánh Git dự phòng (Git Branch)
- **Tên nhánh**: `backup-classic-theme`
- **Git Tag**: `backup-classic-v1`
- Bạn có thể checkout nhánh này bất cứ khi nào để chạy lại chính xác phiên bản cũ.

### Lớp 3: Nút chuyển giao diện 1-Click ngay trên ứng dụng
- Không cần gõ lệnh! Ngay trên thanh Sidebar bên trái và menu Avatar hồ sơ, có sẵn nút **"Giao diện Cũ (Classic)"** / **"Theme Clay (Mới)"**.
- Bạn có thể bấm để chuyển đổi tức thì giữa 2 giao diện bất cứ lúc nào để trải nghiệm và so sánh.

---

## 2. Cách Khôi Phục (Restore) Nhanh Chóng

Nếu bạn muốn quay về hoàn toàn giao diện cũ:

### Cách A: Khôi phục bằng 1 cú click chuột (Khuyến nghị)
1. Mở ứng dụng trong trình duyệt.
2. Tại thanh Menu bên trái (hoặc bấm vào Avatar góc trên bên phải), nhấn vào **"Giao diện Cũ (Classic)"**.
3. Hệ thống sẽ ngay lập tức chuyển về toàn bộ bố cục ban đầu và ghi nhớ lựa chọn của bạn.

### Cách B: Khôi phục trực tiếp từ thư mục backup
Mở PowerShell tại thư mục `d:\Lensy - CRM\frontend` và chạy:
```powershell
Remove-Item -Recurse -Force "src"
Copy-Item -Recurse "src_backup_classic" "src"
```

### Cách C: Khôi phục bằng Git
Mở terminal tại thư mục `d:\Lensy - CRM` và chạy:
```bash
git checkout backup-classic-theme
```

---

## 3. Tổng Quan Các Tính Năng Đã Kết Nối Trong Theme Mới

Phiên bản giao diện mới từ `theme dashboard/lensy---photography-studio-crm` đã được kết nối đầy đủ các tính năng thực tế với cơ sở dữ liệu Supabase:

1. **Bố cục Frosted Glass & Luxury Clay Studio**:
   - Nền màu đất nung ấm cúng (`bg-gradient-to-br from-[#eed7c7] via-[#f7e8dc] to-[#e4cbbe]`) cùng hiệu ứng ánh sáng ambient orbs và đường sóng dải lụa mờ ảo.
   - Thùng chứa kính mờ bo tròn lớn (`clay-glass-container`) chuẩn thiết kế Studio chuyên nghiệp.
   - Hỗ trợ cả **Chế độ sáng (Light Mode)** và **Chế độ tối sâu thẳm (Dark Mode)**.

2. **Thanh Menu Sidebar Studio**:
   - Logo Lensy Studio CRM với camera badge ánh đồng.
   - Menu điều hướng: Tổng Quan, Gói Dịch Vụ, Khách Hàng, Thiết Bị, Cài Đặt.
   - Menu quản lý vận hành: Hiệu suất ekip, hồ sơ khách hàng, kho thiết bị ROI, bảng giá.
   - Widget hiển thị trạng thái phòng chụp Studio Bays trực tiếp (Bay 1 Cyclorama, Bay 2 Daylight Loft, Bay 3 Sanctuary).

3. **3 Thẻ Thống Kê KPI Thời Gian Thực**:
   - **Tổng Doanh Thu**: Tự động tính tổng tiền cọc + thanh toán từ các show thực tế.
   - **Lịch Đang Chạy**: Đếm số show đang chuẩn bị, đang chụp hoặc đang hậu kỳ.
   - **Hồ Sơ Khách Hàng**: Thống kê số lượng khách hàng duy nhất.

4. **Biểu Đồ Doanh Thu & Xếp Hạng Ekip**:
   - Biểu đồ cột tương tác Recharts với nút lọc: 3 Tháng / 6 Tháng / Năm Nay.
   - Thẻ vinh danh Top Nhiếp Ảnh Gia & Ekip MUA theo số show hoàn thành thực tế.

5. **Thẻ Đen Huyền Bí "Lịch Chụp Sắp Tới" (Upcoming Shoots)**:
   - Điểm nhấn ánh kim ấm áp (copper flare) góc trên bên phải.
   - Hiển thị các show chụp gần nhất kèm giờ, địa điểm phòng chụp và avatar xếp chồng của Nhiếp ảnh gia + MUA được phân công.
   - Thống kê tỷ trọng cơ cấu gói dịch vụ (Tại Studio, Ngoại cảnh, Tiệc cưới).

6. **Bảng Lịch Chụp & 4 Chế Độ Xem Linh Hoạt**:
   - Chế độ **Danh Sách (Recent Bookings)**: Tìm kiếm theo tên khách, SĐT, mã show; Lọc theo trạng thái; Bấm vào hàng để mở modal xem nhanh.
   - Chế độ **Lịch Tháng (Calendar Grid)**: Xem chi tiết show theo từng ngày.
   - Chế độ **Quy Trình (Kanban Pipeline)**: Kéo thả các giai đoạn xử lý show.
   - Chế độ **Tài Chính & ROI**: Theo dõi biểu đồ lợi nhuận ròng và thanh tăng trưởng doanh thu.

7. **Modal Chi Tiết Show & Nút Tạo Lịch Mới**:
   - Bấm vào show bất kỳ sẽ mở Modal thanh lịch hiển thị đầy đủ thông tin show, người chụp, tiến độ thanh toán, nút gọi điện thoại nhanh, xem link báo giá khách hàng, đổi trạng thái hoặc chuyển sang chỉnh sửa chuyên sâu.
   - Nút **"+ Tạo Lịch Mới"** trên Header tự động mở Modal tạo báo giá & quét xung đột thiết bị chuẩn xác.
