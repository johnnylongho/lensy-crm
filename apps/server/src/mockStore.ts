import { Gear, Booking } from '@lensflow/shared';

export const INITIAL_GEARS: Gear[] = [
  {
    id: 'gear-sony-a74-1',
    name: 'Body Sony A7 IV #1',
    category: 'body',
    model: 'Sony Alpha 7 IV',
    serialNumber: 'SN-SNY-0982',
    estimatedRentalCost: 450000,
    status: 'available',
  },
  {
    id: 'gear-sony-a74-2',
    name: 'Body Sony A7 IV #2 (Backup)',
    category: 'body',
    model: 'Sony Alpha 7 IV',
    serialNumber: 'SN-SNY-0983',
    estimatedRentalCost: 450000,
    status: 'available',
  },
  {
    id: 'gear-canon-r62',
    name: 'Body Canon EOS R6 Mark II',
    category: 'body',
    model: 'Canon EOS R6 II',
    serialNumber: 'SN-CAN-5541',
    estimatedRentalCost: 500000,
    status: 'available',
  },
  {
    id: 'gear-lens-2470gm2',
    name: 'Lens Sony FE 24-70mm F2.8 GM II',
    category: 'lens',
    model: 'SEL2470GM2',
    serialNumber: 'SN-LNS-2470',
    estimatedRentalCost: 350000,
    status: 'available',
  },
  {
    id: 'gear-lens-70200gm2',
    name: 'Lens Sony FE 70-200mm F2.8 GM OSS II',
    category: 'lens',
    model: 'SEL70200GM2',
    serialNumber: 'SN-LNS-70200',
    estimatedRentalCost: 450000,
    status: 'available',
  },
  {
    id: 'gear-lens-50f12',
    name: 'Lens Sony FE 50mm F1.2 GM',
    category: 'lens',
    model: 'SEL50F12GM',
    serialNumber: 'SN-LNS-5012',
    estimatedRentalCost: 300000,
    status: 'available',
  },
  {
    id: 'gear-lens-rf2870',
    name: 'Lens Canon RF 28-70mm F2L USM',
    category: 'lens',
    model: 'RF 28-70 F2',
    serialNumber: 'SN-LNS-RF2870',
    estimatedRentalCost: 600000,
    status: 'available',
  },
  {
    id: 'gear-flash-v1',
    name: 'Đèn Flash Godox V1 (Sony mount)',
    category: 'lighting',
    model: 'Godox V1-S',
    serialNumber: 'SN-FL-GDXV1',
    estimatedRentalCost: 150000,
    status: 'available',
  },
  {
    id: 'gear-flash-ad200',
    name: 'Đèn Flash Godox AD200 Pro + Trigger',
    category: 'lighting',
    model: 'Godox AD200Pro',
    serialNumber: 'SN-FL-AD200',
    estimatedRentalCost: 250000,
    status: 'available',
  },
  {
    id: 'crew-second-shooter',
    name: 'Thợ phụ / Trợ lý chụp (Second Shooter)',
    category: 'crew',
    model: 'Assistant / Lighting Guy',
    serialNumber: 'CREW-01',
    estimatedRentalCost: 500000,
    status: 'available',
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'booking-sample-wedding-1',
    clientName: 'Anh Tuấn & Chị Mai',
    clientPhone: '0901234567',
    clientEmail: 'tuanmai@gmail.com',
    sessionType: 'wedding',
    eventDate: '2026-09-25',
    startTime: '07:30',
    endTime: '13:30',
    location: 'White Palace Hoàng Văn Thụ, Q. Phú Nhuận',
    packagePrice: 12000000,
    depositAmount: 3000000,
    paidAmount: 3000000,
    remainingAmount: 9000000,
    workflowStage: 'booked',
    paymentStatus: 'deposit_paid',
    quoteToken: 'quote-tuanmai-wedding',
    assignedGearIds: ['gear-sony-a74-1', 'gear-lens-2470gm2'],
    notes: 'Gói phóng sự tiệc cưới 1 thợ chính + 1 thợ phụ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'booking-sample-lookbook-2',
    clientName: 'Nguyễn Hoàng Oanh',
    clientPhone: '0918765432',
    clientEmail: 'hoangoanh.lookbook@gmail.com',
    sessionType: 'lookbook',
    eventDate: '2026-09-17',
    startTime: '14:00',
    endTime: '18:00',
    location: 'Studio Lam Vũ, Q. 3',
    packagePrice: 8000000,
    depositAmount: 3000000,
    paidAmount: 3000000,
    remainingAmount: 5000000,
    workflowStage: 'delivered',
    paymentStatus: 'deposit_paid',
    quoteToken: 'quote-hoangoanh-lookbook',
    assignedGearIds: ['gear-sony-a74-2', 'gear-lens-50f12'],
    driveDeliveryLink: 'https://drive.google.com/drive/folders/sample-lookbook-link',
    deliveryDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    notes: 'Chụp BST Thu Đông 15 set đồ',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'booking-sample-commercial-3',
    clientName: 'Công ty Truyền thông BrandX',
    clientPhone: '0989112233',
    clientEmail: 'marketing@brandx.vn',
    sessionType: 'commercial',
    eventDate: '2026-09-10',
    startTime: '09:00',
    endTime: '17:00',
    location: 'Showroom VinFast Landmark 81',
    packagePrice: 20000000,
    depositAmount: 10000000,
    paidAmount: 10000000,
    remainingAmount: 10000000,
    workflowStage: 'delivered',
    paymentStatus: 'deposit_paid',
    quoteToken: 'quote-brandx-event',
    assignedGearIds: ['gear-canon-r62', 'gear-lens-rf2870', 'crew-second-shooter'],
    driveDeliveryLink: 'https://pixieset.com/sample/brandx-event',
    deliveryDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago
    notes: 'Quay chụp event ra mắt xe',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

class MockStore {
  private gears: Gear[] = [...INITIAL_GEARS];
  private bookings: Booking[] = [...INITIAL_BOOKINGS];

  getGears(): Gear[] {
    return [...this.gears];
  }

  getGearById(id: string): Gear | undefined {
    return this.gears.find(g => g.id === id);
  }

  getBookings(): Booking[] {
    return [...this.bookings];
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  getBookingByQuoteToken(token: string): Booking | undefined {
    return this.bookings.find(b => b.quoteToken === token);
  }

  createBooking(booking: Booking): Booking {
    this.bookings.push(booking);
    return booking;
  }

  updateBooking(id: string, updates: Partial<Booking>): Booking | undefined {
    const idx = this.bookings.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    this.bookings[idx] = {
      ...this.bookings[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.bookings[idx];
  }
}

export const mockStore = new MockStore();
