export type BookingStatus =
  | 'lead'             // 1. Mới hỏi (Lead)
  | 'deposited'        // 2. Đã cọc (Deposited)
  | 'shot'             // 3. Đã chụp (Shot)
  | 'editing'          // 4. Đang hậu kỳ (Editing)
  | 'done'             // 5. Hoàn tất (Done)
  | 'cho_coc'
  | 'cho_xac_nhan_coc'
  | 'da_chot'
  | 'da_tra_file'
  | 'hoan_thanh'
  | 'da_huy'
  | 'cancelled';

export type SessionType = 'wedding' | 'prewedding' | 'portrait' | 'lookbook' | 'event' | 'commercial' | 'family' | 'other';

export interface PackageInclusion {
  id: string;
  title: string;
  description: string;
}

export interface QuoteData {
  id: string;
  quoteToken: string;
  studioName: string;
  studioLogoText: string;
  studioAvatarUrl?: string;
  studioCoverUrl?: string;
  photographerName: string;
  photographerPhone: string;
  photographerEmail: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  sessionType: SessionType;
  sessionTitle: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  packagePrice: number;
  depositPercentage: number; // e.g., 30 or 50%
  depositAmount: number;
  remainingAmount: number;
  status: BookingStatus;
  inclusions: PackageInclusion[];
  equipmentList: string[];
  deliverables: string[];
  specialNotes?: string;
  validUntil: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  receiptUrl?: string;
  depositTransferredAt?: string;
}

export interface ExpenseItem {
  id?: string;
  name: string;
  amount: number;
}

export interface CalendarEvent {
  id: string;
  clientName: string;
  clientPhone?: string;
  sessionType: SessionType;
  eventDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  status: BookingStatus;
  packagePrice: number;
  depositAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  quoteToken?: string;
  notes?: string;
  receiptUrl?: string;
  depositTransferredAt?: string;
  assignedGears?: string[]; // Danh sách UUID thiết bị đã gắn
  expenses?: number; // Tổng chi phí phát sinh (Job Costing)
  expenseDetails?: ExpenseItem[]; // Chi tiết các khoản chi
  client_id?: string; // UUID khách hàng trong bảng clients
}

export interface Client {
  id: string;
  photographer_id?: string;
  name: string;
  phone: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export type GearType = 'camera' | 'lens' | 'lighting' | 'audio' | 'accessory' | 'other';
export type GearStatus = 'active' | 'maintenance' | 'retired';

export interface GearItem {
  id: string;
  photographer_id?: string;
  name: string;
  type: GearType;
  status: GearStatus;
  purchase_price?: number;
  created_at?: string;
}

export interface PackageItem {
  id: string;
  photographer_id?: string;
  name: string;
  price: number;
  description?: string | null;
  features: string[];
  image_urls: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// MULTI-TENANT & WORKSPACE TYPES
// ==========================================
export type AccountType = 'freelancer' | 'studio_member';
export type StudioRole = 'admin' | 'photographer';
export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface Studio {
  id: string;
  name: string;
  logo_url?: string | null;
  verified_status: boolean;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudioMember {
  id: string;
  studio_id: string;
  user_id: string;
  role: StudioRole;
  status: MemberStatus;
  created_at?: string;
  updated_at?: string;
  studio?: Studio;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    phone?: string;
  };
}



