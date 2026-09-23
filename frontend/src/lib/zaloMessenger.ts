/**
 * LENSY CRM - PHÂN HỆ THÔNG BÁO XÁC NHẬN CHỐT LỊCH QUA ZALO
 * Chuẩn hóa mẫu thông báo nhận cọc và bàn giao hợp đồng Mirmia Studio
 */

export interface ReceiptData {
  clientName: string;
  clientPhone?: string;
  sessionType: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  packagePrice: number;
  depositAmount: number;
  remainingAmount: number;
  quoteToken?: string;
  quoteUrl?: string;
}

/**
 * Tạo mẫu tin nhắn xác nhận nhận cọc chuyên nghiệp chuẩn Mirmia Studio
 */
export function generateDepositReceiptMessage(data: ReceiptData): string {
  const sessionTypeDisplay =
    data.sessionType === 'wedding'
      ? 'Phóng Sự Cưới Fine-Art'
      : data.sessionType === 'lookbook'
      ? 'Lookbook Thời Trang Studio'
      : data.sessionType === 'commercial'
      ? 'Thương Mại / Quảng Cáo'
      : 'Chụp Ảnh Nghệ Thuật';

  const timeDisplay =
    data.startTime && data.endTime
      ? `${data.startTime} - ${data.endTime}`
      : '08:00 - 12:00';

  return `🎉 [MIRMIA STUDIO & ACADEMY] - XÁC NHẬN CHỐT LỊCH THÀNH CÔNG

Kính gửi: Anh/Chị ${data.clientName},

Mirmia Studio xin trân trọng thông báo: Chúng tôi đã nhận được khoản đặt cọc khóa lịch chụp của Anh/Chị!

📋 THÔNG TIN SHOW CHỤP:
• Gói dịch vụ: ${sessionTypeDisplay}
• Ngày chụp: ${data.eventDate} (Khung giờ: ${timeDisplay})
• Địa điểm: ${data.location || 'Tại Studio Mirmia'}
• Tổng giá trị hợp đồng: ${data.packagePrice.toLocaleString('vi-VN')} đ
• Tiền cọc đã nhận (30%): ${data.depositAmount.toLocaleString('vi-VN')} đ (ĐÃ KHÓA LỊCH)
• Số tiền còn lại: ${data.remainingAmount.toLocaleString('vi-VN')} đ (Thanh toán sau khi bàn giao ảnh)

✨ ĐỘI NGŨ THỰC HIỆN ĐÃ ĐƯỢC PHÂN CÔNG:
Toàn bộ thiết bị chính (Body Full-frame Sony & Ống kính G-Master) cùng ekip đã được khóa lịch riêng cho Anh/Chị vào ngày ${data.eventDate}.

🔗 Xem lại chi tiết quyền lợi gói chụp & hướng dẫn chuẩn bị:
${data.quoteUrl || `https://lensy.mirmia.vn/quote/${data.quoteToken || ''}`}

Mirmia rất hân hạnh được đồng hành và ghi lại những khoảnh khắc đẹp nhất của Anh/Chị!
Hotline hỗ trợ: 0901 234 567 (Mirmia Lead Team)`;
}

/**
 * Mở Zalo chat trực tiếp với số điện thoại của khách hàng
 */
export function openZaloChat(phone?: string, messageText?: string): void {
  if (!phone) {
    alert('Không tìm thấy số điện thoại của khách hàng để mở Zalo.');
    return;
  }

  // Chuẩn hóa số điện thoại Việt Nam (VD: 0901234567 -> 84901234567 hoặc 0901234567)
  const cleanPhone = phone.replace(/\D/g, '');
  const zaloUrl = `https://zalo.me/${cleanPhone}`;

  if (messageText && navigator.clipboard) {
    navigator.clipboard.writeText(messageText).then(() => {
      // Đã copy tin nhắn vào clipboard để người dùng paste vào Zalo
      window.open(zaloUrl, '_blank');
    }).catch(() => {
      window.open(zaloUrl, '_blank');
    });
  } else {
    window.open(zaloUrl, '_blank');
  }
}
