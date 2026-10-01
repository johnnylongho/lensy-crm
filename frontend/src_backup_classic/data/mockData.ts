import { QuoteData, CalendarEvent } from '../types';

export const MOCK_QUOTE: QuoteData = {
  id: 'quote-luxury-wedding-2026',
  quoteToken: 'q-minh-thao-wedding',
  studioName: 'MIRMIA STUDIO & ACADEMY',
  studioLogoText: 'MIRMIA',
  photographerName: 'Mirmia Creative Team (Lead Photographer)',
  photographerPhone: '0901234567',
  photographerEmail: 'contact@mirmia.vn',
  clientName: 'Anh Minh & Chị Thảo',
  clientPhone: '0987654321',
  clientEmail: 'minhthao.wedding@gmail.com',
  sessionType: 'wedding',
  sessionTitle: 'Gói Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)',
  eventDate: '2026-10-18',
  startTime: '07:00',
  endTime: '14:00',
  location: 'Trung tâm Hội nghị White Palace, TP. Hồ Chí Minh',
  packagePrice: 18000000,
  depositPercentage: 30,
  depositAmount: 5400000,
  remainingAmount: 12600000,
  status: 'cho_coc',
  inclusions: [
    {
      id: 'inc-1',
      title: '02 Thợ Chụp Chuyên Nghiệp',
      description: '01 Thợ chính dẫn dắt khoảnh khắc cảm xúc + 01 Thợ phụ bắt góc toàn cảnh & hậu trường.'
    },
    {
      id: 'inc-2',
      title: 'Thiết Bị Full-Frame Cao Cấp',
      description: 'Hệ máy Sony A7 IV & A7R V cùng hệ ống kính GM chuyên dụng chụp thiếu sáng.'
    },
    {
      id: 'inc-3',
      title: 'Hậu Kỳ Màu Độc Quyền',
      description: 'Toàn bộ file ảnh được blend màu Fine-art tone màu điện ảnh sang trọng.'
    },
    {
      id: 'inc-4',
      title: 'Bàn Giao Siêu Tốc',
      description: 'Trả 30-50 ảnh Highlight trong 24h để đăng mạng xã hội. Trả toàn bộ link Drive trong 7 ngày.'
    }
  ],
  equipmentList: [
    'Body Sony Alpha 7 IV (Primary)',
    'Body Sony Alpha 7R V (Backup/Secondary)',
    'Lens FE 24-70mm F2.8 GM II',
    'Lens FE 70-200mm F2.8 GM OSS II',
    'Lens FE 50mm F1.2 GM (Chuyên chân dung cảm xúc)',
    'Hệ thống Đèn Flash Godox V1 + AD200 Pro'
  ],
  deliverables: [
    'Toàn bộ 800 - 1.200 file gốc chất lượng cao',
    '120 file chỉnh sửa màu sắc chi tiết',
    '01 Album Photobook siêu sắc nét 30x30cm (30 trang)',
    '01 USB gỗ khắc tên cô dâu chú rể lưu trữ trọn đời',
    'Link Online Gallery lưu trữ riêng tư trong 1 năm'
  ],
  specialNotes: 'Báo giá đã bao gồm chi phí di chuyển nội thành TP.HCM. Ekip có mặt trước giờ làm lễ 45 phút để set up thiết bị.',
  validUntil: '2026-10-05',
  bankInfo: {
    bankName: 'MB Bank (Ngân Hàng Quân Đội)',
    accountNumber: '0901234567',
    accountName: 'NGUYEN THE HOANG'
  }
};

// Calendar events spread out across the month
export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    clientName: 'Hoàng Oanh Lookbook',
    clientPhone: '0901234567',
    sessionType: 'lookbook',
    eventDate: '2026-09-22',
    startTime: '13:30',
    endTime: '17:30',
    location: 'Studio Lam Vũ, Q.3',
    status: 'da_chot',
    packagePrice: 7500000,
    depositAmount: 3000000,
    paidAmount: 3000000,
    expenses: 1200000,
    expenseDetails: [
      { name: 'Thuê phụ kiện & bàn ủi hơi nước', amount: 400000 },
      { name: 'Trợ lý ánh sáng (nửa ngày)', amount: 800000 },
    ],
  },
  {
    id: 'ev-2',
    clientName: 'Anh Tuấn & Chị Mai',
    clientPhone: '0987654321',
    sessionType: 'wedding',
    eventDate: '2026-09-25',
    startTime: '07:30',
    endTime: '13:30',
    location: 'White Palace Hoàng Văn Thụ',
    status: 'da_chot',
    packagePrice: 12000000,
    depositAmount: 4000000,
    paidAmount: 4000000,
    expenses: 2500000,
    expenseDetails: [
      { name: 'Makeup Artist cô dâu', amount: 1800000 },
      { name: 'Grab di chuyển 2 chiều', amount: 700000 },
    ],
  },
  {
    id: 'ev-3',
    clientName: 'Khai Trương Showroom BrandX',
    clientPhone: '0912345678',
    sessionType: 'event',
    eventDate: '2026-09-28',
    startTime: '09:00',
    endTime: '16:00',
    location: 'Landmark 81, Bình Thạnh',
    status: 'da_chot',
    packagePrice: 15000000,
    depositAmount: 5000000,
    paidAmount: 5000000,
    expenses: 3200000,
    expenseDetails: [
      { name: 'Thuê thêm ống kính tele 70-200 GM', amount: 1200000 },
      { name: 'Thợ phụ quay teaser highlight', amount: 2000000 },
    ],
  },
  {
    id: 'ev-4',
    clientName: 'Cặp Đôi Bảo & Ngọc',
    clientPhone: '0933445566',
    sessionType: 'prewedding',
    eventDate: '2026-10-04',
    startTime: '05:30',
    endTime: '18:00',
    location: 'Ngoại cảnh Đà Lạt',
    status: 'da_chot',
    packagePrice: 22000000,
    depositAmount: 10000000,
    paidAmount: 10000000,
    expenses: 5500000,
    expenseDetails: [
      { name: 'Vé xe khứ hồi & xăng xe Đà Lạt', amount: 2500000 },
      { name: 'Makeup artist đi cùng đoàn', amount: 2000000 },
      { name: 'Phí vào cổng phim trường Secret Garden', amount: 1000000 },
    ],
  },
  {
    id: 'ev-5',
    clientName: 'Chân Dung Profile Doanh Nhân',
    clientPhone: '0977889900',
    sessionType: 'portrait',
    eventDate: '2026-10-10',
    startTime: '10:00',
    endTime: '12:00',
    location: 'The Coffee House Signature, Q.1',
    status: 'cho_coc',
    packagePrice: 4500000,
    depositAmount: 1500000,
    paidAmount: 0,
    expenses: 500000,
    expenseDetails: [
      { name: 'Nước uống & tip địa điểm', amount: 500000 },
    ],
  },
  {
    id: 'ev-6',
    clientName: 'Minh & Thảo (Quote Đang Gửi)',
    clientPhone: '0987654321',
    sessionType: 'wedding',
    eventDate: '2026-10-18',
    startTime: '07:00',
    endTime: '14:00',
    location: 'White Palace, TP.HCM',
    status: 'cho_coc',
    packagePrice: 18000000,
    depositAmount: 5400000,
    paidAmount: 0,
    expenses: 0,
    expenseDetails: [],
  },
  {
    id: 'ev-7',
    clientName: 'Thời Trang Thu Đông ChicMode',
    clientPhone: '0944556677',
    sessionType: 'commercial',
    eventDate: '2026-10-24',
    startTime: '08:00',
    endTime: '17:00',
    location: 'Phim trường Long Island, Q.9',
    status: 'da_tra_file',
    packagePrice: 16000000,
    depositAmount: 8000000,
    paidAmount: 16000000,
    expenses: 4200000,
    expenseDetails: [
      { name: 'Thuê phim trường 1 ngày', amount: 2500000 },
      { name: 'Trợ lý ánh sáng & setup', amount: 1200000 },
      { name: 'Cơm trưa ekip 4 người', amount: 500000 },
    ],
  }
];

export const MOCK_PACKAGES: import('../types').PackageItem[] = [
  {
    id: 'pkg-1',
    name: 'Phóng Sự Cưới Cao Cấp (Luxury Wedding Journalism)',
    price: 18000000,
    description: 'Trọn gói chụp ngày cưới với 2 thợ chính, bắt trọn từng khoảnh khắc cảm xúc thăng hoa và đẳng cấp nghệ thuật.',
    features: [
      '2 Thợ chụp chính máy Sony A7 IV + Lens GM cao cấp',
      'Chụp không giới hạn số lượng file trong buổi lễ & tiệc',
      'Chỉnh sửa màu toàn bộ ảnh gốc (blend màu chuẩn Studio)',
      'Retouch chi tiết 80 ảnh chân dung cô dâu chú rể & gia đình',
      'Tặng 01 photobook mở phẳng 30x30cm (40 trang) bìa da cao cấp',
      'Tặng 02 ảnh cổng ép gỗ pha lê 60x90cm',
      'Bàn giao toàn bộ file gốc & hoàn thiện qua Google Drive vĩnh viễn'
    ],
    image_urls: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80'
    ],
    is_active: true,
    created_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 'pkg-2',
    name: 'Chụp Pre-Wedding Ngoại Cảnh & Phim Trường',
    price: 14500000,
    description: 'Buổi chụp lãng mạn ngoại cảnh hoặc phim trường chuyên nghiệp, hỗ trợ stylist và hướng dẫn tạo dáng tự nhiên.',
    features: [
      '01 Thợ chụp chính + 01 Thợ phụ đánh sáng chuyên nghiệp',
      'Miễn phí 02 trang phục cưới cao cấp & 01 vest chú rể',
      'Trang điểm & làm tóc thay đổi 03 layout theo concept',
      'Retouch chuyên sâu 50 ảnh đẹp nhất',
      'Tặng 01 album phóng sự mở phẳng 25x35cm',
      'Tặng 01 ảnh cổng pha lê cao cấp 60x90cm',
      'Xe di chuyển trong nội thành và vé vào phim trường'
    ],
    image_urls: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80'
    ],
    is_active: true,
    created_at: '2026-08-05T08:00:00Z',
  },
  {
    id: 'pkg-3',
    name: 'Lookbook Thời Trang & Portrait Doanh Nhân',
    price: 8500000,
    description: 'Chuyên nghiệp cho các thương hiệu thời trang, lookbook bộ sưu tập hoặc bộ ảnh xây dựng thương hiệu cá nhân doanh nhân.',
    features: [
      'Chụp tại studio với hệ thống đèn Profoto / Godox chuyên dụng',
      'Chụp tối đa 4 concept hoặc 15 bộ trang phục',
      'Retouch chi tiết chuẩn tạp chí cho 25 ảnh xuất sắc nhất',
      'Bàn giao file nén tối ưu hiển thị web & social media',
      'Hỗ trợ chỉnh sửa nhanh lấy gấp trong 48h'
    ],
    image_urls: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'
    ],
    is_active: true,
    created_at: '2026-08-10T08:00:00Z',
  }
];

