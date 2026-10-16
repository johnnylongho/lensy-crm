// ====================================================================
// LENSY CRM - GEAR & RESOURCE CONFLICT SCANNER 2.0 (USP 1 & USP 2)
// BỘ QUÉT XUNG ĐỘT THIẾT BỊ & NHÂN SỰ THEO NGÀY + KHUNG GIỜ (CÓ BUFFER)
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

// Chuyển đổi chuỗi giờ "HH:mm" sang tổng số phút trong ngày (0 -> 1440)
export function parseTimeToMinutes(timeStr?: string | null, fallbackMinutes: number = 480): number {
  if (!timeStr || typeof timeStr !== 'string') return fallbackMinutes;
  const clean = timeStr.trim().substring(0, 5);
  const parts = clean.split(':');
  if (parts.length < 2) return fallbackMinutes;
  const hours = parseInt(parts[0], 10);
  const mins = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(mins)) return fallbackMinutes;
  return hours * 60 + mins;
}

/**
 * Kiểm tra giao thoa giữa 2 khung giờ trong cùng 1 ngày (có tính thời gian đệm di chuyển/sạc pin)
 * - Trả về 'hard' nếu trùng giờ trực tiếp hoặc khoảng nghỉ giữa 2 show < bufferMinutes (mặc định 60p)
 * - Trả về 'soft' nếu cùng ngày nhưng cách nhau >= bufferMinutes
 */
export function evaluateTimeOverlapSeverity(
  startA?: string | null,
  endA?: string | null,
  startB?: string | null,
  endB?: string | null,
  bufferMinutes: number = 60
): { isOverlapping: boolean; severity: 'hard' | 'soft'; gapMinutes: number } {
  // Nếu không truyền giờ của show đang kiểm tra -> mặc định coi là 'hard' để bảo toàn tính tương thích
  if (!startA || !endA) {
    return { isOverlapping: true, severity: 'hard', gapMinutes: 0 };
  }

  const sA = parseTimeToMinutes(startA, 8 * 60);
  const eA = Math.max(sA + 30, parseTimeToMinutes(endA, 12 * 60));
  const sB = parseTimeToMinutes(startB, 8 * 60);
  const eB = Math.max(sB + 30, parseTimeToMinutes(endB, 12 * 60));

  // Trùng khung giờ trực tiếp
  if (sA < eB && sB < eA) {
    return { isOverlapping: true, severity: 'hard', gapMinutes: 0 };
  }

  // Khoảng cách giữa 2 ca chụp trong cùng ngày
  const gap = sA >= eB ? sA - eB : sB - eA;
  if (gap < bufferMinutes) {
    return { isOverlapping: true, severity: 'hard', gapMinutes: gap };
  }

  return { isOverlapping: false, severity: 'soft', gapMinutes: gap };
}

function isCancelledStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  return s === 'da_huy' || s === 'cancelled';
}

/**
 * Trích xuất danh sách ID thiết bị gắn với một booking
 */
export function extractGearsFromBooking(booking: any): string[] {
  const gears: string[] = [];
  const notes = (booking.notes || '').toLowerCase();
  const sessionType = (booking.session_type || booking.sessionType || '').toLowerCase();

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
 * Quét xung đột thiết bị & nhân sự khi lập Báo giá mới (Quote Generator)
 */
export function scanGearConflicts(
  targetDate: string,
  selectedGearIds: string[],
  existingBookings: any[],
  currentBookingId?: string,
  customGearsList?: GearItem[],
  targetStartTime?: string,
  targetEndTime?: string
): ConflictScanResult {
  if (!targetDate || selectedGearIds.length === 0 || !existingBookings) {
    return { hasConflict: false, totalAdditionalRentalCost: 0, conflicts: [] };
  }

  const conflicts: ConflictDetail[] = [];
  let totalCost = 0;

  const sameDayBookings = existingBookings.filter(b => {
    const bDate = b.event_date || b.eventDate;
    const bId = b.id;
    const bStatus = b.status;
    return bDate === targetDate && bId !== currentBookingId && !isCancelledStatus(bStatus);
  });

  const availableGears =
    customGearsList && customGearsList.length > 0 ? customGearsList : STUDIO_GEARS;

  for (const gearId of selectedGearIds) {
    const gearDef =
      availableGears.find(g => g.id === gearId) || STUDIO_GEARS.find(g => g.id === gearId);
    if (!gearDef) continue;

    for (const booking of sameDayBookings) {
      const bStart = (booking.start_time || booking.startTime || '08:00').substring(0, 5);
      const bEnd = (booking.end_time || booking.endTime || '12:00').substring(0, 5);

      // Nếu có truyền khung giờ cụ thể khi tạo báo giá, chỉ tính phí thuê ngoài khi thực sự giao thoa giờ (< 60p buffer)
      if (targetStartTime && targetEndTime) {
        const overlap = evaluateTimeOverlapSeverity(targetStartTime, targetEndTime, bStart, bEnd, 60);
        if (overlap.severity === 'soft') continue;
      }

      const assignedGears =
        (booking.assignedGears || booking.assigned_gears || []).length > 0
          ? booking.assignedGears || booking.assigned_gears
          : extractGearsFromBooking(booking);

      if (assignedGears.includes(gearId)) {
        conflicts.push({
          gear: gearDef,
          conflictingBooking: {
            id: booking.id,
            clientName: booking.client_name || booking.clientName || 'Khách hàng',
            sessionTitle: booking.session_title || booking.sessionTitle,
            eventDate: targetDate,
            startTime: bStart,
            endTime: bEnd,
            status: booking.status,
          },
        });
        totalCost += gearDef.rentalCost;
        break;
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
  severity?: 'hard' | 'soft';
  gapMinutes?: number;
}

/**
 * Thuật toán Cảnh báo trùng lặp thiết bị (USP 2):
 * Hỗ trợ phân tích độ nghiêm trọng ('hard' khi trùng khung giờ / cách nhau < 60 phút,
 * 'soft' khi khác ca chụp trong cùng ngày nhưng vẫn cảnh báo rõ ràng cho thợ ảnh).
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
  }>,
  targetStartTime?: string,
  targetEndTime?: string
): DynamicGearConflict[] {
  if (!targetDate || !selectedGearIds || selectedGearIds.length === 0 || !allBookings) {
    return [];
  }

  // Lọc các booking khác diễn ra CÙNG NGÀY targetDate và không ở trạng thái hủy ('da_huy' / 'cancelled')
  const sameDayBookings = allBookings.filter(b => {
    const bDate = b.eventDate || b.event_date;
    const bId = b.id;
    const bStatus = b.status;
    return bDate === targetDate && bId !== currentBookingId && !isCancelledStatus(bStatus);
  });

  const conflicts: DynamicGearConflict[] = [];

  for (const gearId of selectedGearIds) {
    const gearObj = allGears.find(g => g.id === gearId);
    const gearName = gearObj ? gearObj.name : 'Thiết bị';

    for (const b of sameDayBookings) {
      const assigned = b.assignedGears || b.assigned_gears || [];
      if (assigned.includes(gearId)) {
        const bStart = (b.startTime || b.start_time || '08:00').substring(0, 5);
        const bEnd = (b.endTime || b.end_time || '12:00').substring(0, 5);
        const overlap = evaluateTimeOverlapSeverity(
          targetStartTime,
          targetEndTime,
          bStart,
          bEnd,
          60
        );

        conflicts.push({
          gearId,
          gearName,
          conflictingBookingId: b.id,
          conflictingClientName: b.clientName || b.client_name || 'Khách hàng khác',
          conflictingSessionType: (b.sessionType || b.session_type || 'Chụp ảnh').toUpperCase(),
          eventDate: targetDate,
          timeRange: `${bStart} - ${bEnd}`,
          severity: overlap.severity,
          gapMinutes: overlap.gapMinutes,
        });
      }
    }
  }

  return conflicts;
}

// ====================================================================
// BỘ QUÉT XUNG ĐỘT LỊCH NHÂN SỰ (PHOTOGRAPHER, MAKEUP ARTIST & EKIP)
// ====================================================================
export interface StaffConflictDetail {
  staffId: string;
  staffName: string;
  roleLabel: string;
  conflictingBookingId: string;
  conflictingClientName: string;
  conflictingSessionType: string;
  eventDate: string;
  timeRange: string;
  severity: 'hard' | 'soft';
  gapMinutes: number;
}

export function checkAssignedStaffConflicts(
  targetDate: string,
  currentBookingId: string | undefined,
  staffAssignments: Array<{ userId?: string | null; name: string; roleLabel: string }>,
  allBookings: Array<any>,
  targetStartTime?: string,
  targetEndTime?: string
): StaffConflictDetail[] {
  if (!targetDate || !staffAssignments || staffAssignments.length === 0 || !allBookings) {
    return [];
  }

  const sameDayBookings = allBookings.filter(b => {
    const bDate = b.eventDate || b.event_date;
    const bId = b.id;
    const bStatus = b.status;
    return bDate === targetDate && bId !== currentBookingId && !isCancelledStatus(bStatus);
  });

  const conflicts: StaffConflictDetail[] = [];

  for (const staff of staffAssignments) {
    if (!staff.userId) continue;

    for (const b of sameDayBookings) {
      const bPhotoId = b.photographer_id || b.photographer?.id;
      const bMakeupId = b.makeup_artist_id || b.makeup_artist?.id;
      const bCrewIds: string[] = Array.isArray(b.crew_assignments)
        ? b.crew_assignments.map((c: any) => c.user_id).filter(Boolean)
        : [];

      const isAssignedInOtherBooking =
        bPhotoId === staff.userId ||
        bMakeupId === staff.userId ||
        bCrewIds.includes(staff.userId);

      if (isAssignedInOtherBooking) {
        const bStart = (b.startTime || b.start_time || '08:00').substring(0, 5);
        const bEnd = (b.endTime || b.end_time || '12:00').substring(0, 5);
        const overlap = evaluateTimeOverlapSeverity(
          targetStartTime,
          targetEndTime,
          bStart,
          bEnd,
          60
        );

        conflicts.push({
          staffId: staff.userId,
          staffName: staff.name,
          roleLabel: staff.roleLabel,
          conflictingBookingId: b.id,
          conflictingClientName: b.clientName || b.client_name || 'Khách hàng khác',
          conflictingSessionType: (b.sessionType || b.session_type || 'Chụp ảnh').toUpperCase(),
          eventDate: targetDate,
          timeRange: `${bStart} - ${bEnd}`,
          severity: overlap.severity,
          gapMinutes: overlap.gapMinutes,
        });
      }
    }
  }

  return conflicts;
}
