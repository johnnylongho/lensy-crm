/**
 * LENSY CRM - PHÂN HỆ TÍCH HỢP LỊCH TRÌNH (GOOGLE CALENDAR & ICALENDAR)
 * Đồng bộ lịch chụp 1-chạm cho Thợ ảnh và Khách hàng
 */

export interface CalendarEventData {
  title: string;
  clientName: string;
  sessionType: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  notes?: string;
  quoteUrl?: string;
  quoteToken?: string;
  photographerName?: string;
  photographerPhone?: string;
}

/**
 * Định dạng ngày giờ thành chuỗi định dạng ISO cho Google Calendar (UTC hoặc Local GMT+7)
 * Ví dụ: 2026-09-25 và 08:00 -> 20260925T010000Z (nếu GMT+7 chuyển sang UTC)
 */
function formatToUtcIsoString(dateStr: string, timeStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Múi giờ Việt Nam GMT+7 -> Giảm 7 tiếng để ra UTC
    const date = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0));
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch (e) {
    // Dự phòng chuỗi compact nếu có lỗi parse
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  }
}

/**
 * Tạo link 1-chạm mở trực tiếp Google Calendar với đầy đủ thông tin sự kiện
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const startIso = formatToUtcIsoString(event.eventDate, event.startTime || '08:00');
  const endIso = formatToUtcIsoString(event.eventDate, event.endTime || '12:00');

  const sessionTypeDisplay =
    event.sessionType === 'wedding'
      ? 'Chụp Phóng Sự Cưới'
      : event.sessionType === 'lookbook'
      ? 'Chụp Lookbook Thời Trang'
      : event.sessionType === 'commercial'
      ? 'Chụp Thương Mại / Quảng Cáo'
      : 'Show Chụp Ảnh';

  const title = `[MIRMIA STUDIO] ${sessionTypeDisplay} - ${event.clientName}`;

  const detailsLines = [
    `📸 LỊCH CHỤP ẢNH TẠI MIRMIA STUDIO & ACADEMY`,
    `----------------------------------------`,
    `• Khách hàng: ${event.clientName}`,
    `• Gói chụp: ${sessionTypeDisplay}`,
    `• Thời gian: ${event.startTime || '08:00'} - ${event.endTime || '12:00'} ngày ${event.eventDate}`,
    `• Địa điểm: ${event.location || 'Tại Studio Mirmia'}`,
    event.photographerName ? `• Nhiếp ảnh gia phụ trách: ${event.photographerName}` : '',
    event.photographerPhone ? `• Hotline liên hệ: ${event.photographerPhone}` : '',
    event.notes ? `• Ghi chú & Thiết bị: ${event.notes}` : '',
    event.quoteUrl ? `• Link thư báo giá & Hợp đồng: ${event.quoteUrl}` : '',
    `----------------------------------------`,
    `Hệ thống trợ lý số Lensy CRM - Mirmia Studio`,
  ].filter(Boolean);

  const details = detailsLines.join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startIso}/${endIso}`,
    details: details,
    location: event.location || 'Mirmia Studio & Academy',
    add: 'contact@mirmia.vn',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Tạo nội dung file tiêu chuẩn iCalendar (RFC 5545) cho Apple Calendar / Outlook
 */
export function generateIcsContent(event: CalendarEventData): string {
  const startIso = formatToUtcIsoString(event.eventDate, event.startTime || '08:00');
  const endIso = formatToUtcIsoString(event.eventDate, event.endTime || '12:00');
  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `lensy-${event.quoteToken || Date.now()}@mirmia.vn`;

  const sessionTypeDisplay =
    event.sessionType === 'wedding'
      ? 'Chụp Phóng Sự Cưới'
      : event.sessionType === 'lookbook'
      ? 'Chụp Lookbook Thời Trang'
      : 'Show Chụp Ảnh';

  const summary = `[MIRMIA] ${sessionTypeDisplay} - ${event.clientName}`;
  const description = `Lịch chụp ảnh Lensy CRM: ${sessionTypeDisplay} cho khách hàng ${event.clientName}. Địa điểm: ${event.location}. Hotline Mirmia: 0901234567.`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lensy CRM//Mirmia Studio & Academy//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.location || 'Mirmia Studio'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Nhắc nhở: Ngày mai có lịch chụp ảnh tại Mirmia Studio!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Kích hoạt tải về file .ics ngay trên trình duyệt (cho iPhone/Mac/Outlook)
 */
export function downloadIcsFile(event: CalendarEventData): void {
  const icsContent = generateIcsContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Lich-Chup-Mirmia-${event.clientName.replace(/\s+/g, '_')}-${event.eventDate}.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
