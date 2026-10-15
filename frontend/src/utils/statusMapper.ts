import { BookingStatus } from '../types';

export type CanonicalKanbanStatus = 'lead' | 'deposited' | 'shot' | 'editing' | 'done' | 'cancelled';

/**
 * Ánh xạ mọi trạng thái Booking (bao gồm cả trạng thái từ SePAY Webhook 'da_chot'
 * và trạng thái bàn giao 'da_tra_file') về 5 cột chuẩn của bảng Kanban.
 */
export function normalizeToKanbanStatus(status?: BookingStatus | string | null): CanonicalKanbanStatus {
  if (!status) return 'lead';
  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case 'lead':
    case 'cho_coc':
    case 'cho_xac_nhan_coc':
      return 'lead';

    case 'deposited':
    case 'da_chot':
    case 'confirmed':
      return 'deposited';

    case 'shot':
      return 'shot';

    case 'editing':
      return 'editing';

    case 'done':
    case 'da_tra_file':
    case 'hoan_thanh':
      return 'done';

    case 'cancelled':
    case 'da_huy':
      return 'cancelled';

    default:
      return 'lead';
  }
}

/**
 * Kiểm tra xem một booking đã thu cọc hoặc hoàn tất chưa (dùng để tính Doanh thu & Tier)
 */
export function isRevenueRecognizedStatus(status?: BookingStatus | string | null): boolean {
  const canonical = normalizeToKanbanStatus(status);
  return canonical === 'deposited' || canonical === 'shot' || canonical === 'editing' || canonical === 'done';
}
