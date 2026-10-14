import { CalendarEvent } from '../types';

/**
 * Sinh đường link Google Calendar để thêm nhanh lịch chụp vào Google Calendar của Thợ ảnh
 */
export const generateGoogleCalendarUrl = (event: Partial<CalendarEvent>): string => {
  const title = encodeURIComponent(`[Lensy] Chụp ${event.clientName || 'Khách hàng'} - ${event.sessionTitle || 'Lịch chụp'}`);
  
  // Format ngày và giờ: YYYYMMDDTHHmmSS
  const eventDate = event.eventDate || new Date().toISOString().split('T')[0];
  const dateFormatted = eventDate.replace(/-/g, '');
  
  const startTime = (event.startTime || '08:00').replace(':', '') + '00';
  const endTime = (event.endTime || '12:00').replace(':', '') + '00';
  
  const dates = `${dateFormatted}T${startTime}/${dateFormatted}T${endTime}`;
  
  const details = encodeURIComponent(
    `📸 LỊCH CHỤP LENSY CRM\n` +
    `👤 Khách hàng: ${event.clientName || 'N/A'}\n` +
    `📞 Số điện thoại: ${event.clientPhone || 'N/A'}\n` +
    `📍 Địa điểm: ${event.location || 'Tại Studio'}\n` +
    `💰 Giá trị: ${(Number(event.packagePrice) || 0).toLocaleString('vi-VN')} đ\n` +
    `📝 Ghi chú: ${event.notes || 'Không có'}\n\n` +
    `Hệ thống Lensy CRM - Studio & Freelancer Management`
  );

  const location = encodeURIComponent(event.location || 'Tại Studio');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};

/**
 * Tạo và tải xuống file iCalendar (.ics) tương thích Apple Calendar, Google Calendar, Outlook
 */
export const downloadIcsFile = (event: Partial<CalendarEvent>): void => {
  const eventDate = (event.eventDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const startTime = (event.startTime || '08:00').replace(':', '') + '00';
  const endTime = (event.endTime || '12:00').replace(':', '') + '00';

  const uid = `lensy-${event.id || Date.now()}@lensy.vn`;
  const summary = `[Lensy] Chụp ${event.clientName || 'Khách hàng'} - ${event.sessionTitle || 'Lịch chụp'}`;
  const description = `Khách hàng: ${event.clientName || 'N/A'}\\nSĐT: ${event.clientPhone || 'N/A'}\\nĐịa điểm: ${event.location || 'N/A'}\\nGhi chú: ${event.notes || ''}`;
  const location = event.location || 'Tại Studio';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lensy CRM//Lịch Chụp Studio//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${eventDate}T${startTime}`,
    `DTEND:${eventDate}T${endTime}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `lich-chup-${event.clientName ? event.clientName.replace(/\s+/g, '-') : 'lensy'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
