import { supabase, isSupabaseConfigured } from './supabase';

export type ShiftType = 'morning' | 'afternoon' | 'full_day';

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  isFullDayBlocked: boolean;
  morningAvailable: boolean;
  afternoonAvailable: boolean;
  bookedShifts: ('morning' | 'afternoon' | 'all_day')[];
}

/**
 * Trạng thái booking được coi là đã khóa lịch (đã cọc hoặc đã chốt).
 * Các booking trạng thái 'lead' (mới hỏi) hoặc 'cancelled'/'da_huy' không khóa lịch.
 */
export const CONFIRMED_BOOKING_STATUSES = [
  'deposited',
  'shot',
  'editing',
  'done',
  'da_chot',
  'da_tra_file',
  'hoan_thanh',
];

/**
 * Tạo dữ liệu lịch bận mẫu thực tế cho chế độ Offline/Demo.
 */
function getDemoUnavailableDates(): Map<string, DayAvailability> {
  const map = new Map<string, DayAvailability>();
  const today = new Date();

  // Helper định dạng YYYY-MM-DD
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Demo: Hôm nay + 3 ngày kín sáng
  const d1 = new Date(today);
  d1.setDate(today.getDate() + 3);
  const dateStr1 = formatDate(d1);
  map.set(dateStr1, {
    date: dateStr1,
    isFullDayBlocked: false,
    morningAvailable: false,
    afternoonAvailable: true,
    bookedShifts: ['morning'],
  });

  // Demo: Hôm nay + 6 ngày kín cả ngày (Full-day Wedding)
  const d2 = new Date(today);
  d2.setDate(today.getDate() + 6);
  const dateStr2 = formatDate(d2);
  map.set(dateStr2, {
    date: dateStr2,
    isFullDayBlocked: true,
    morningAvailable: false,
    afternoonAvailable: false,
    bookedShifts: ['all_day'],
  });

  // Demo: Hôm nay + 10 ngày kín chiều
  const d3 = new Date(today);
  d3.setDate(today.getDate() + 10);
  const dateStr3 = formatDate(d3);
  map.set(dateStr3, {
    date: dateStr3,
    isFullDayBlocked: false,
    morningAvailable: true,
    afternoonAvailable: false,
    bookedShifts: ['afternoon'],
  });

  // Demo: Hôm nay + 14 ngày kín cả ngày
  const d4 = new Date(today);
  d4.setDate(today.getDate() + 14);
  const dateStr4 = formatDate(d4);
  map.set(dateStr4, {
    date: dateStr4,
    isFullDayBlocked: true,
    morningAvailable: false,
    afternoonAvailable: false,
    bookedShifts: ['all_day'],
  });

  return map;
}

/**
 * Fetch danh sách ngày/ca đã được đặt cọc hoặc xác nhận từ Supabase.
 * BẢO MẬT TUYỆT ĐỐI (Privacy By Design):
 * - CHỈ truy vấn đúng 4 trường kỹ thuật: event_date, start_time, end_time, status.
 * - TUYỆT ĐỐI KHÔNG select client_name, client_phone, package_price, notes,...
 *
 * @param studioId ID của Studio (tùy chọn)
 * @param photographerId ID của Thợ ảnh (tùy chọn)
 * @returns Map ánh xạ từ ngày YYYY-MM-DD sang thông tin DayAvailability
 */
export async function getUnavailableDates(
  studioId?: string | null,
  photographerId?: string | null
): Promise<Map<string, DayAvailability>> {
  const availabilityMap = new Map<string, DayAvailability>();

  if (!isSupabaseConfigured) {
    return getDemoUnavailableDates();
  }

  try {
    let rawBookings: Array<{
      event_date: string;
      start_time?: string | null;
      end_time?: string | null;
      status: string;
    }> = [];

    // Cách 1: Thử gọi hàm RPC bảo mật get_public_unavailable_dates
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_public_unavailable_dates',
        {
          p_studio_id: studioId || null,
          p_photographer_id: photographerId || null,
        }
      );

      if (!rpcError && Array.isArray(rpcData)) {
        rawBookings = rpcData;
      }
    } catch {
      // Bỏ qua lỗi RPC và dùng truy vấn bảng trực tiếp bên dưới
    }

    // Cách 2: Fallback truy vấn trực tiếp bảng bookings (CHỈ SELECT 4 trường an toàn)
    if (rawBookings.length === 0) {
      let query = supabase
        .from('bookings')
        .select('event_date, start_time, end_time, status')
        .in('status', CONFIRMED_BOOKING_STATUSES);

      if (studioId) {
        query = query.eq('studio_id', studioId);
      } else if (photographerId) {
        query = query.eq('photographer_id', photographerId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        rawBookings = data;
      }
    }

    // Nếu không có dữ liệu thật từ DB, bổ sung demo để khách xem thử nghiệm
    if (rawBookings.length === 0) {
      return getDemoUnavailableDates();
    }

    // Phân tích và nhóm theo ngày
    for (const b of rawBookings) {
      if (!b.event_date) continue;
      const dateStr = b.event_date.split('T')[0];

      let entry = availabilityMap.get(dateStr);
      if (!entry) {
        entry = {
          date: dateStr,
          isFullDayBlocked: false,
          morningAvailable: true,
          afternoonAvailable: true,
          bookedShifts: [],
        };
        availabilityMap.set(dateStr, entry);
      }

      const start = b.start_time || '08:00';
      const end = b.end_time || '17:00';

      const startHour = parseInt(start.split(':')[0], 10) || 8;
      const endHour = parseInt(end.split(':')[0], 10) || 17;

      // Nếu lịch kéo dài trên 5 tiếng hoặc bắt đầu sáng và kết thúc chiều muộn -> khóa cả ngày
      if ((startHour < 12 && endHour >= 14) || endHour - startHour >= 6) {
        entry.isFullDayBlocked = true;
        entry.morningAvailable = false;
        entry.afternoonAvailable = false;
        if (!entry.bookedShifts.includes('all_day')) {
          entry.bookedShifts.push('all_day');
        }
      } else if (startHour < 12) {
        // Khóa ca sáng
        entry.morningAvailable = false;
        if (!entry.bookedShifts.includes('morning')) {
          entry.bookedShifts.push('morning');
        }
      } else {
        // Khóa ca chiều
        entry.afternoonAvailable = false;
        if (!entry.bookedShifts.includes('afternoon')) {
          entry.bookedShifts.push('afternoon');
        }
      }

      // Nếu cả ca sáng và ca chiều đều đã kín -> coi như kín cả ngày
      if (!entry.morningAvailable && !entry.afternoonAvailable) {
        entry.isFullDayBlocked = true;
      }
    }

    return availabilityMap;
  } catch (err) {
    console.warn('Lỗi khi fetch unavailable dates:', err);
    return getDemoUnavailableDates();
  }
}

