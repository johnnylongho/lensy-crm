export type BookingStatus = 'cho_coc' | 'da_chot' | 'da_tra_file' | 'hoan_thanh' | 'da_huy';

export type SessionType = 'wedding' | 'prewedding' | 'portrait' | 'lookbook' | 'event' | 'commercial';

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
}

export interface CalendarEvent {
  id: string;
  clientName: string;
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
}
