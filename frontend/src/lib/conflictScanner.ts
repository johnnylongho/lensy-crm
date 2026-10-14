// ====================================================================
// LENSY CRM - GEAR & RESOURCE CONFLICT SCANNER (USP 1)
// BỘ QUÉT XUNG ĐỘT THIẾT BỊ & NHÂN SỰ CHUYÊN DỤNG CHO STUDIO & THỢ ẢNH
// ====================================================================

export interface GearItem {
  id: string;
  name: string;
  category: 'body' | 'lens' | 'lighting' | 'crew' | 'accessory' | 'audio';
  rentalCost: number; // Chi phí thuê ngoài ước tính (VNĐ) khi bị đụng thiết bị
}

// Danh mục thiết bị & nhân sự tiêu chuẩn của Mirmia Studio & Freelancers
export const STUDIO_GEARS: GearItem[] = [
  {
    id: 'body-canon-r',
    name: 'Body Canon EOS R (Chính)',
    category: 'body',
    rentalCost: 500000,
  },
  {
    id: 'body-canon-r6',
    name: 'Body Canon EOS R6 Mark II',
    category: 'body',
    rentalCost: 750000,
  },
  {
    id: 'lens-rf85',
    name: 'Lens Canon RF 85mm f/2 Macro IS STM',
    category: 'lens',
    rentalCost: 300000,
  },
  {
    id: 'lens-2470',
    name: 'Lens Canon RF 24-70mm f/2.8L IS USM',
    category: 'lens',
    rentalCost: 500000,
  },
  {
    id: 'flash-godox',
    name: 'Đèn Flash Godox V860iii + Trigger X2T',
    category: 'lighting',
    rentalCost: 250000,
  },
  {
    id: 'mic-gochek',
    name: 'Micro Gochek Ultra s24',
    category: 'accessory',
    rentalCost: 150000,
  },
  {
    id: 'filter-blackmist',
    name: 'Filter Black Mist 1/4',
    category: 'accessory',
    rentalCost: 100000,
  },
  {
    id: 'crew-second-shooter',
    name: 'Thợ Chụp Phụ (Second Shooter)',
    category: 'crew',
    rentalCost: 1500000,
  },
  {
    id: 'crew-makeup',
    name: 'Chuyên viên Trang Điểm & Làm Tóc',
    category: 'crew',
    rentalCost: 1200000,
  },
];

export interface ConflictDetail {
  gear: GearItem;
  conflictingBooking: {
    id: string;
    clientName: string;
    sessionTitle?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}

export interface ConflictScanResult {
  hasConflict: boolean;
  totalAdditionalRentalCost: number;
  conflicts: ConflictDetail[];
}

/**
 * Trích xuất danh sách ID thiết bị gắn với một booking
 * (Kiểm tra qua ghi chú 'notes' hoặc danh sách thiết bị mặc định theo loại gói)
 */
export function extractGearsFromBooking(booking: any): string[] {
  const gears: string[] = [];
  const notes = (booking.notes || '').toLowerCase();
  const sessionType = (booking.session_type || booking.sessionType || '').toLowerCase();

  // 1. Phân tích qua từ khóa trong ghi chú
  if (notes.includes('canon-r') || notes.includes('eos r') || notes.includes('canon r')) {
    gears.push('body-canon-r');
  }
  if (notes.includes('canon-r6') || notes.includes('r6')) {
    gears.push('body-canon-r6');
  }
  if (notes.includes('85mm') || notes.includes('rf 85') || notes.includes('rf85')) {
    gears.push('lens-rf85');
  }
  if (notes.includes('24-70') || notes.includes('2470')) {
    gears.push('lens-2470');
  }
  if (notes.includes('flash') || notes.includes('godox') || notes.includes('v860')) {
    gears.push('flash-godox');
  }
  if (notes.includes('gochek') || notes.includes('micro') || notes.includes('mic')) {
    gears.push('mic-gochek');
  }
  if (notes.includes('black mist') || notes.includes('filter')) {
    gears.push('filter-blackmist');
  }
  if (notes.includes('thợ phụ') || notes.includes('second shooter')) {
    gears.push('crew-second-shooter');
  }
  if (notes.includes('makeup') || notes.includes('trang điểm')) {
    gears.push('crew-makeup');
  }

  // 2. Mặc định phân bổ thiết bị cốt lõi theo loại buổi chụp nếu chưa ghi rõ
  if (gears.length === 0) {
    if (sessionType === 'wedding' || sessionType === 'prewedding') {
      gears.push('body-canon-r', 'lens-2470', 'flash-godox');
    } else if (sessionType === 'portrait' || sessionType === 'grad') {
      gears.push('body-canon-r', 'lens-rf85', 'filter-blackmist');
    } else {
      gears.push('body-canon-r', 'lens-rf85', 'flash-godox');
    }
  }

  return Array.from(new Set(gears));
}

/**
 * Quét xung đột thiết bị & nhân sự giữa lịch mới và các booking đã có
 */
export function scanGearConflicts(
  targetDate: string,
  selectedGearIds: string[],
  existingBookings: any[],
  currentBookingId?: string,
  customGearsList?: GearItem[]
): ConflictScanResult {
  if (!targetDate || selectedGearIds.length === 0 || !existingBookings) {
    return { hasConflict: false, totalAdditionalRentalCost: 0, conflicts: [] };
  }

  const conflicts: ConflictDetail[] = [];
  let totalCost = 0;

  // Lọc các booking diễn ra cùng ngày và không ở trạng thái hủy
  const sameDayBookings = existingBookings.filter(b => {
    const bDate = b.event_date || b.eventDate;
    const bId = b.id;
    const bStatus = b.status;
    return bDate === targetDate && bId !== currentBookingId && bStatus !== 'da_huy';
  });

  const availableGears = (customGearsList && customGearsList.length > 0) ? customGearsList : STUDIO_GEARS;

  for (const gearId of selectedGearIds) {
    const gearDef = availableGears.find(g => g.id === gearId) || STUDIO_GEARS.find(g => g.id === gearId);
    if (!gearDef) continue;

    for (const booking of sameDayBookings) {
      const assignedGears = (booking.assignedGears || booking.assigned_gears || []).length > 0
        ? (booking.assignedGears || booking.assigned_gears)
        : extractGearsFromBooking(booking);
      if (assignedGears.includes(gearId)) {
        conflicts.push({
          gear: gearDef,
          conflictingBooking: {
            id: booking.id,
            clientName: booking.client_name || booking.clientName || 'Khách hàng',
            sessionTitle: booking.session_title || booking.sessionTitle,
            eventDate: targetDate,
            startTime: (booking.start_time || booking.startTime || '08:00').substring(0, 5),
            endTime: (booking.end_time || booking.endTime || '12:00').substring(0, 5),
            status: booking.status,
          },
        });
        totalCost += gearDef.rentalCost;
        break; // Mỗi thiết bị chỉ cộng phí 1 lần cho cùng ngày
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    totalAdditionalRentalCost: totalCost,
    conflicts,
  };
}

export interface DynamicGearConflict {
  gearId: string;
  gearName: string;
  conflictingBookingId: string;
  conflictingClientName: string;
  conflictingSessionType: string;
  eventDate: string;
  timeRange: string;
}

/**
 * Thuật toán Cảnh báo trùng lặp thiết bị (USP 2):
 * Khi thợ ảnh đang chọn thiết bị cho Booking A (vào ngày X),
 * kiểm tra toàn bộ các Booking khác cũng diễn ra trong ngày X.
 * Nếu thiết bị vừa chọn đã được gán cho một Booking khác trong cùng ngày,
 * lập tức trả về danh sách chi tiết các cảnh báo xung đột (báo đỏ và chặn lưu/yêu cầu xác nhận ghi đè).
 */
export function checkAssignedGearConflicts(
  targetDate: string,
  currentBookingId: string | undefined,
  selectedGearIds: string[],
  allBookings: Array<{
    id: string;
    eventDate?: string;
    event_date?: string;
    clientName?: string;
    client_name?: string;
    sessionType?: string;
    session_type?: string;
    startTime?: string;
    start_time?: string;
    endTime?: string;
    end_time?: string;
    status?: string;
    assignedGears?: string[];
    assigned_gears?: string[];
  }>,
  allGears: Array<{
    id: string;
    name: string;
  }>
): DynamicGearConflict[] {
  if (!targetDate || !selectedGearIds || selectedGearIds.length === 0 || !allBookings) {
    return [];
  }

  // Lọc các booking khác diễn ra CÙNG NGÀY targetDate và không ở trạng thái hủy ('da_huy')
  const sameDayBookings = allBookings.filter(b => {
    const bDate = b.eventDate || b.event_date;
    const bId = b.id;
    const bStatus = b.status;
    return bDate === targetDate && bId !== currentBookingId && bStatus !== 'da_huy';
  });

  const conflicts: DynamicGearConflict[] = [];

  for (const gearId of selectedGearIds) {
    const gearObj = allGears.find(g => g.id === gearId);
    const gearName = gearObj ? gearObj.name : 'Thiết bị';

    for (const b of sameDayBookings) {
      const assigned = b.assignedGears || b.assigned_gears || [];
      if (assigned.includes(gearId)) {
        conflicts.push({
          gearId,
          gearName,
          conflictingBookingId: b.id,
          conflictingClientName: b.clientName || b.client_name || 'Khách hàng khác',
          conflictingSessionType: (b.sessionType || b.session_type || 'Chụp ảnh').toUpperCase(),
          eventDate: targetDate,
          timeRange: `${(b.startTime || b.start_time || '08:00').substring(0, 5)} - ${(b.endTime || b.end_time || '12:00').substring(0, 5)}`,
        });
      }
    }
  }

  return conflicts;
}

