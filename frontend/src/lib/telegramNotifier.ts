/**
 * TELEGRAM BOT NOTIFIER SERVICE
 * Dịch vụ gửi thông báo tức thì qua Telegram Bot tới Chat cá nhân hoặc Group nội bộ Studio
 * Hoàn toàn miễn phí, không phụ thuộc vào hạ tầng bên thứ ba phức tạp.
 */

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  notifyOnNewBooking: boolean;
  notifyOnDeposit: boolean;
  notifyOnProofingLocked: boolean;
  notifyOnConflict: boolean;
}

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: '',
  chatId: '',
  isEnabled: false,
  notifyOnNewBooking: true,
  notifyOnDeposit: true,
  notifyOnProofingLocked: true,
  notifyOnConflict: true,
};

const STORAGE_KEY_PREFIX = 'lensy_telegram_config_';

/**
 * Lấy cấu hình Telegram của Studio hoặc Freelancer từ localStorage / database
 */
export const getTelegramConfig = (studioId?: string | null): TelegramConfig => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${studioId || 'default'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      return { ...DEFAULT_TELEGRAM_CONFIG, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Lỗi khi đọc telegram config:', err);
  }
  return DEFAULT_TELEGRAM_CONFIG;
};

/**
 * Lưu cấu hình Telegram
 */
export const saveTelegramConfig = (
  config: TelegramConfig,
  studioId?: string | null
): boolean => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${studioId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu telegram config:', err);
    return false;
  }
};

/**
 * Kiểm tra kết nối Telegram Bot và gửi tin nhắn thử nghiệm
 */
export const testTelegramConnection = async (
  botToken: string,
  chatId: string,
  studioName = 'Lensy Studio'
): Promise<{ success: boolean; message: string }> => {
  if (!botToken.trim() || !chatId.trim()) {
    return { success: false, message: 'Vui lòng điền đầy đủ Bot Token và Chat ID.' };
  }

  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();

  const testMessage = `🤖 <b>[LENSY CRM] - KẾT NỐI THÀNH CÔNG!</b>\n\n` +
    `🏢 <b>Studio:</b> ${studioName}\n` +
    `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}\n` +
    `✅ Kênh thông báo Telegram đã sẵn sàng nhận thông báo về đặt lịch mới, cọc tiền và chọn ảnh!`;

  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Gửi tin nhắn thử nghiệm thành công! Vui lòng kiểm tra Telegram.' };
    } else {
      return {
        success: false,
        message: `Lỗi từ Telegram: ${data.description || 'Không xác định'} (Mã lỗi: ${data.error_code})`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Không thể kết nối đến máy chủ Telegram: ${error.message || 'Lỗi mạng'}`,
    };
  }
};

/**
 * Gửi tin nhắn Telegram thông báo
 */
export const sendTelegramNotification = async (
  text: string,
  studioId?: string | null
): Promise<{ success: boolean; message?: string }> => {
  const config = getTelegramConfig(studioId);
  if (!config.isEnabled || !config.botToken.trim() || !config.chatId.trim()) {
    return { success: false, message: 'Telegram Bot chưa được kích hoạt hoặc chưa cấu hình.' };
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId.trim(),
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    return { success: data.ok, message: data.description };
  } catch (error: any) {
    console.warn('Lỗi khi gửi telegram notification:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Mẫu thông báo: Có khách đặt lịch mới
 */
export const notifyNewBooking = async (
  booking: {
    clientName: string;
    clientPhone?: string;
    eventDate: string;
    sessionType?: string;
    packagePrice?: number;
    quoteToken?: string;
  },
  studioId?: string | null,
  studioName = 'Lensy Studio'
) => {
  const config = getTelegramConfig(studioId);
  if (!config.isEnabled || !config.notifyOnNewBooking) return;

  const priceStr = booking.packagePrice
    ? `${booking.packagePrice.toLocaleString('vi-VN')} đ`
    : 'Chưa chốt giá';

  const text = `🎉 <b>CÓ LỊCH CHỤP MỚI VỪA ĐẶT!</b>\n\n` +
    `👤 <b>Khách hàng:</b> ${booking.clientName}\n` +
    `📞 <b>Điện thoại:</b> ${booking.clientPhone || 'Chưa cung cấp'}\n` +
    `📅 <b>Ngày chụp:</b> ${booking.eventDate}\n` +
    `📷 <b>Gói/Dịch vụ:</b> ${booking.sessionType || 'Gói tiêu chuẩn'}\n` +
    `💵 <b>Giá trị gói:</b> ${priceStr}\n` +
    (booking.quoteToken ? `🔗 <b>Mã báo giá:</b> <code>${booking.quoteToken}</code>\n` : '') +
    `🏢 <i>${studioName}</i>`;

  return sendTelegramNotification(text, studioId);
};

/**
 * Mẫu thông báo: Khách đã cọc tiền thành công
 */
export const notifyDepositReceived = async (
  booking: {
    clientName: string;
    depositAmount: number;
    eventDate: string;
    quoteToken?: string;
    paymentMethod?: string;
  },
  studioId?: string | null,
  studioName = 'Lensy Studio'
) => {
  const config = getTelegramConfig(studioId);
  if (!config.isEnabled || !config.notifyOnDeposit) return;

  const depositStr = `${booking.depositAmount.toLocaleString('vi-VN')} đ`;

  const text = `⚡ <b>ĐÃ NHẬN TIỀN CỌC - KHÓA LỊCH CHỤP!</b>\n\n` +
    `👤 <b>Khách hàng:</b> ${booking.clientName}\n` +
    `💰 <b>Số tiền cọc:</b> <b>${depositStr}</b>\n` +
    `📅 <b>Ngày sự kiện:</b> ${booking.eventDate}\n` +
    `💳 <b>Hình thức:</b> ${booking.paymentMethod || 'Chuyển khoản VietQR'}\n` +
    (booking.quoteToken ? `🔖 <b>Token:</b> <code>${booking.quoteToken}</code>\n` : '') +
    `✅ <i>Trạng thái lịch chụp đã tự động chuyển sang [ĐÃ CHỐT]</i>\n` +
    `🏢 <i>${studioName}</i>`;

  return sendTelegramNotification(text, studioId);
};

/**
 * Mẫu thông báo: Khách khóa phiên chọn ảnh (Proofing Locked)
 */
export const notifyProofingLocked = async (
  data: {
    clientName: string;
    selectedCount: number;
    maxSelections?: number;
    clientNotes?: string;
    quoteToken?: string;
  },
  studioId?: string | null,
  studioName = 'Lensy Studio'
) => {
  const config = getTelegramConfig(studioId);
  if (!config.isEnabled || !config.notifyOnProofingLocked) return;

  const text = `🎨 <b>KHÁCH ĐÃ KHÓA PHIÊN CHỌN ẢNH (PROOFING)!</b>\n\n` +
    `👤 <b>Khách hàng:</b> ${data.clientName}\n` +
    `🖼️ <b>Số lượng ảnh đã chọn:</b> <b>${data.selectedCount}${data.maxSelections ? ` / ${data.maxSelections}` : ''} ảnh</b>\n` +
    (data.clientNotes ? `📝 <b>Ghi chú của khách:</b> <i>"${data.clientNotes}"</i>\n` : '') +
    (data.quoteToken ? `🔗 <b>Mã báo giá:</b> <code>${data.quoteToken}</code>\n` : '') +
    `🚀 <i>Ê-kíp Retoucher có thể bắt đầu xuất file chỉnh màu ngay!</i>\n` +
    `🏢 <i>${studioName}</i>`;

  return sendTelegramNotification(text, studioId);
};

/**
 * Mẫu thông báo: Cảnh báo xung đột thiết bị hoặc nhân sự
 */
export const notifyResourceConflict = async (
  conflict: {
    resourceName: string;
    resourceType: 'gear' | 'staff';
    eventDate: string;
    conflictShoots: string[];
  },
  studioId?: string | null,
  studioName = 'Lensy Studio'
) => {
  const config = getTelegramConfig(studioId);
  if (!config.isEnabled || !config.notifyOnConflict) return;

  const typeName = conflict.resourceType === 'gear' ? 'Thiết bị máy ảnh' : 'Nhân sự Studio';

  const text = `⚠️ <b>CẢNH BÁO ĐỤNG ĐỘ TÀI NGUYÊN!</b>\n\n` +
    `🔍 <b>Loại:</b> ${typeName}\n` +
    `🛑 <b>Tài nguyên:</b> <b>${conflict.resourceName}</b>\n` +
    `📅 <b>Ngày bị trùng:</b> ${conflict.eventDate}\n` +
    `📋 <b>Các show bị đụng:</b>\n` +
    conflict.conflictShoots.map(s => `  • ${s}`).join('\n') +
    `\n\n<i>Vui lòng vào Lensy CRM kiểm tra và phân bổ lại!</i>\n` +
    `🏢 <i>${studioName}</i>`;

  return sendTelegramNotification(text, studioId);
};
