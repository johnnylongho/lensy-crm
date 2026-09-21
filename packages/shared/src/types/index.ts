// Gear & Inventory Types
export type GearCategory = 'body' | 'lens' | 'lighting' | 'audio' | 'accessory' | 'crew';

export interface Gear {
  id: string;
  name: string;
  category: GearCategory;
  model: string;
  serialNumber?: string;
  estimatedRentalCost: number; // Cost if outsourced (VND)
  status: 'available' | 'in_use' | 'maintenance';
}

// Workflow Stages matching photographer real-world workflow
export type WorkflowStage =
  | 'lead'           // Báo giá vừa tạo
  | 'deposit_pending'// Chờ cọc
  | 'booked'         // Đã cọc, chuẩn bị shoot
  | 'shooting'       // Đang chụp
  | 'culling'        // Chọn ảnh / Khách lọc ảnh
  | 'retouching'     // Đang hậu kỳ
  | 'delivered'      // Đã trả link ảnh (Google Drive / Pixieset)
  | 'completed';     // Đã thanh toán 100% & đóng job

// Payment Status
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid' | 'overdue';

// Booking & Job Information
export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  sessionType: 'wedding' | 'prewedding' | 'portrait' | 'event' | 'lookbook' | 'commercial';
  eventDate: string; // ISO string (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  location: string;
  packagePrice: number;
  depositAmount: number;
  paidAmount: number;
  remainingAmount: number;
  workflowStage: WorkflowStage;
  paymentStatus: PaymentStatus;
  quoteToken: string; // Unique URL token for client quote view
  assignedGearIds: string[];
  assignedGears?: Gear[];
  driveDeliveryLink?: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Gear & Resource Conflict Types (USP 1)
export interface ConflictItem {
  gear: Gear;
  conflictWithBookingId: string;
  conflictWithClientName: string;
  suggestedRentalCost: number;
}

export interface ConflictReport {
  hasConflict: boolean;
  eventDate: string;
  conflictingGears: ConflictItem[];
  totalSuggestedRentalCost: number;
  warningMessage: string;
}

// AI Auto-Debt Collector Types (USP 2)
export type ReminderTone = 'gentle' | 'professional' | 'firm_invoice';

export interface DebtReminder {
  bookingId: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  remainingAmount: number;
  daysSinceDelivery: number;
  recommendedTone: ReminderTone;
  messageContent: string;
  zaloDeeplink?: string;
}
