import { CalendarEvent } from '../types';

export type BookingSortOption = 'smart' | 'furthest' | 'newest' | 'price_desc';

/**
 * Lấy chuỗi ngày YYYY-MM-DD hôm nay theo giờ địa phương
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 1. Smart Date Sorting:
 * - Ưu tiên các lịch có ngày chụp từ hôm nay trở về tương lai lên đầu, sắp xếp tăng dần (gần hôm nay nhất xếp trước).
 * - Các lịch trong quá khứ được đẩy về sau, sắp xếp giảm dần (vừa diễn ra gần đây nhất xếp trước các lịch quá khứ lâu năm).
 */
export function smartSortBookings(events: CalendarEvent[]): CalendarEvent[] {
  const todayStr = getTodayDateString();

  const upcoming: CalendarEvent[] = [];
  const past: CalendarEvent[] = [];

  for (const ev of events) {
    const evDate = ev.eventDate || '1970-01-01';
    if (evDate >= todayStr) {
      upcoming.push(ev);
    } else {
      past.push(ev);
    }
  }

  // Tương lai: Tăng dần (ngày gần hôm nay nhất lên đầu)
  upcoming.sort((a, b) => {
    const diff = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    if (diff !== 0) return diff;
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  });

  // Quá khứ: Giảm dần (ngày gần hôm nay nhất xếp trước, lịch lâu năm xếp cuối cùng)
  past.sort((a, b) => {
    const diff = new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    if (diff !== 0) return diff;
    return (b.startTime || '00:00').localeCompare(a.startTime || '00:00');
  });

  return [...upcoming, ...past];
}

/**
 * Sắp xếp danh sách lịch chụp theo tùy chọn người dùng
 */
export function sortBookings(events: CalendarEvent[], sortOption: BookingSortOption): CalendarEvent[] {
  const cloned = [...events];

  switch (sortOption) {
    case 'smart':
      return smartSortBookings(cloned);

    case 'furthest':
      // Ngày xa nhất: Sắp xếp theo ngày giảm dần (tương lai xa nhất hoặc ngày mới nhất lên đầu)
      return cloned.sort((a, b) => {
        const diff = new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        if (diff !== 0) return diff;
        return (b.startTime || '00:00').localeCompare(a.startTime || '00:00');
      });

    case 'newest':
      // Mới được tạo: Sắp xếp theo created_at giảm dần (bản ghi mới thêm lên đầu)
      return cloned.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      });

    case 'price_desc':
      return cloned.sort((a, b) => (b.packagePrice || 0) - (a.packagePrice || 0));

    default:
      return smartSortBookings(cloned);
  }
}
