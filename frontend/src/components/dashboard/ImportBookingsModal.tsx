import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Info,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { BookingStatus, CalendarEvent } from '../../types';
import { getCategoryConfig } from '../../utils/categoryConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  events?: CalendarEvent[];
}

export interface ParsedBookingRow {
  rowNumber: number;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  sessionType: string;
  bookingDate: string; // ISO 8601 Timestamp
  eventDate: string;   // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  location: string;
  packagePrice: number;
  depositAmount: number;
  paidAmount: number;
  status: BookingStatus;
  notes?: string;
}

export interface FailedRowInfo {
  rowNumber: number;
  reason: string;
  rawSnippet?: string;
}

// ====================================================================
// 2. LÀM SẠCH DỮ LIỆU SỐ (DATA SANITIZATION)
// ====================================================================
/**
 * Trước khi insert các cột Tài chính (Giá, Cọc), loại bỏ toàn bộ khoảng trắng,
 * chữ cái (như "đ", "VNĐ", "tr", "k") và dấu phân cách (chấm, phẩy).
 * Convert chuỗi còn lại thành kiểu Number. Nếu rỗng, gán = 0.
 */
export const sanitizeMoneyNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const str = String(val).trim().toLowerCase();
  if (!str) return 0;

  // Xử lý đơn vị triệu ("tr", "triệu", "trieu")
  if (str.includes('tr') || str.includes('triệu') || str.includes('trieu')) {
    const cleanDecimal = str.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleanDecimal);
    return isNaN(num) ? 0 : Math.round(num * 1_000_000);
  }

  // Xử lý đơn vị nghìn ("k", "nghìn", "ngàn")
  if (str.includes('k') || str.includes('nghìn') || str.includes('ngan')) {
    const cleanDecimal = str.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleanDecimal);
    return isNaN(num) ? 0 : Math.round(num * 1_000);
  }

  // RegExp loại bỏ toàn bộ khoảng trắng, chữ cái (đ, vnđ...) và dấu phân cách (chấm, phẩy)
  const digitsOnly = str.replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;

  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// ====================================================================
// 3. MAPPING TRẠNG THÁI (STATUS TRANSLATION)
// ====================================================================
/**
 * Dictionary để tự động dịch trạng thái tiếng Việt sang Enum hệ thống:
 * - "Mới hỏi", "Chưa cọc", "Lead" -> 'lead'
 * - "Đã cọc", "Deposit" -> 'deposited'
 * - "Đã chụp", "Chụp xong" -> 'shot'
 * - "Đang sửa", "Hậu kỳ" -> 'editing'
 * - "Hoàn tất", "Đã trả ảnh", "Xong" -> 'done'
 * - "Hủy", "Cancel" -> 'cancelled'
 * Nếu dữ liệu không khớp bất kỳ case nào, gán mặc định là 'lead'.
 */
export const STATUS_TRANSLATION_MAP: Record<string, BookingStatus> = {
  // Mới hỏi
  'mới hỏi': 'lead',
  'moi hoi': 'lead',
  'chưa cọc': 'lead',
  'chua coc': 'lead',
  'lead': 'lead',
  'cho_coc': 'lead',
  'chờ cọc': 'lead',
  'inquiry': 'lead',

  // Đã cọc
  'đã cọc': 'deposited',
  'da coc': 'deposited',
  'deposit': 'deposited',
  'deposited': 'deposited',
  'da_chot': 'deposited',
  'đã chốt': 'deposited',
  'cọc': 'deposited',

  // Đã chụp
  'đã chụp': 'shot',
  'da chup': 'shot',
  'chụp xong': 'shot',
  'chup xong': 'shot',
  'shot': 'shot',

  // Đang sửa
  'đang sửa': 'editing',
  'dang sua': 'editing',
  'đang sửa ảnh': 'editing',
  'hậu kỳ': 'editing',
  'hau ky': 'editing',
  'editing': 'editing',
  'retouch': 'editing',
  'da_tra_file': 'editing',

  // Hoàn tất
  'hoàn tất': 'done',
  'hoan tat': 'done',
  'đã trả ảnh': 'done',
  'da tra anh': 'done',
  'xong': 'done',
  'done': 'done',
  'hoan_thanh': 'done',
  'hoàn thành': 'done',
  'finished': 'done',

  // Hủy
  'hủy': 'cancelled',
  'huy': 'cancelled',
  'cancel': 'cancelled',
  'cancelled': 'cancelled',
  'da_huy': 'cancelled',
};

export const translateStatus = (rawStatus?: any): BookingStatus => {
  if (!rawStatus) return 'lead';
  const clean = String(rawStatus).trim().toLowerCase();
  return STATUS_TRANSLATION_MAP[clean] || 'lead';
};

// ====================================================================
// 1. MAPPING TIÊU ĐỀ CỘT & THỜI GIAN ISO 8601 (SMART DATA MAPPER)
// ====================================================================
/**
 * Tìm giá trị trong row dựa trên danh sách các tên cột ứng viên
 */
export const smartFindValue = (row: Record<string, any>, candidates: string[]): any => {
  const rowKeys = Object.keys(row);
  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase().trim();
    // 1. Khớp chính xác
    const exactKey = rowKeys.find(k => k.toLowerCase().trim() === candidateLower);
    if (exactKey && row[exactKey] !== undefined && row[exactKey] !== null) {
      return row[exactKey];
    }
    // 2. Khớp chuỗi con
    const subKey = rowKeys.find(k => k.toLowerCase().trim().includes(candidateLower));
    if (subKey && row[subKey] !== undefined && row[subKey] !== null) {
      return row[subKey];
    }
  }
  return undefined;
};

/**
 * Nối "Ngày chụp" & "Thời gian" và parse thành định dạng timestamp (ISO 8601) cho booking_date
 */
export const combineDateAndTimeIso = (
  rawDate?: any,
  rawTime?: any
): { isoTimestamp: string; eventDate: string; startTime: string; endTime: string } => {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();

  if (rawDate) {
    const trimmed = String(rawDate).trim();
    // YYYY-MM-DD hoặc YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    } else {
      // DD/MM/YYYY hoặc DD-MM-YYYY
      const vnMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (vnMatch) {
        day = parseInt(vnMatch[1], 10);
        month = parseInt(vnMatch[2], 10);
        year = parseInt(vnMatch[3], 10);
      }
    }
  }

  // Parse thời gian
  let startHour = 9;
  let startMinute = 0;
  let endHour = 12;
  let endMinute = 0;

  if (rawTime) {
    const t = String(rawTime).trim().toLowerCase();
    // Dạng dải giờ: "09:00 - 11:30" hoặc "9h - 11h30"
    const rangeMatch = t.match(/(\d{1,2})[:h](\d{2})?\s*[-~–]\s*(\d{1,2})[:h](\d{2})?/);
    if (rangeMatch) {
      startHour = parseInt(rangeMatch[1], 10);
      startMinute = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
      endHour = parseInt(rangeMatch[3], 10);
      endMinute = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
    } else {
      // Dạng đơn: "09:00" hoặc "9h30" hoặc "14h"
      const singleMatch = t.match(/(\d{1,2})[:h](\d{2})?/);
      if (singleMatch) {
        startHour = parseInt(singleMatch[1], 10);
        startMinute = singleMatch[2] ? parseInt(singleMatch[2], 10) : 0;
        endHour = Math.min(23, startHour + 3);
        endMinute = startMinute;
      }
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const eventDate = `${year}-${pad(month)}-${pad(day)}`;
  const startTime = `${pad(startHour)}:${pad(startMinute)}`;
  const endTime = `${pad(endHour)}:${pad(endMinute)}`;

  // Timestamp ISO 8601
  const dateObj = new Date(year, month - 1, day, startHour, startMinute, 0);
  const isoTimestamp = !isNaN(dateObj.getTime())
    ? dateObj.toISOString()
    : `${eventDate}T${startTime}:00.000Z`;

  return { isoTimestamp, eventDate, startTime, endTime };
};

// Chuẩn hóa loại hình chụp tự động bằng smart category detector
const normalizeSessionType = (rawType?: any): string => {
  if (!rawType) return 'portrait';
  return getCategoryConfig(rawType).id;
};

/**
 * 1. Tiền xử lý File CSV (Pre-processing):
 * Tách chuỗi thành mảng các dòng (array of lines).
 * Quét từ trên xuống dưới, tìm ra dòng ĐẦU TIÊN có chứa chuỗi "Khách hàng" hoặc "client_name" (không phân biệt hoa thường).
 * Cắt bỏ (slice) toàn bộ các dòng nằm phía trên dòng này (như dòng trống, dòng title merge "BOOKING SCHEDULE"...).
 * Nối (join) các dòng còn lại thành một chuỗi CSV chuẩn, trong đó dòng Header thực sự giờ đã nằm ở dòng số 1.
 */
export const preprocessCsvText = (rawText: string): { cleanedCsv: string; headerIndex: number; error?: string } => {
  if (!rawText || !rawText.trim()) {
    return {
      cleanedCsv: '',
      headerIndex: -1,
      error: 'File CSV rỗng hoặc không có dữ liệu.',
    };
  }

  // Loại bỏ ký tự BOM nếu có
  const cleanText = rawText.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/);
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (
      lineLower.includes('khách hàng') ||
      lineLower.includes('khach hang') ||
      lineLower.includes('client_name')
    ) {
      headerIndex = i;
      break;
    }
  }

  // Nếu không tìm thấy bất kỳ dòng nào chứa chữ "Khách hàng"
  if (headerIndex === -1) {
    return {
      cleanedCsv: '',
      headerIndex: -1,
      error: "File không đúng định dạng. Không tìm thấy cột 'Khách hàng'.",
    };
  }

  // Cắt bỏ toàn bộ các dòng nằm phía trên dòng này
  const cleanedLines = lines.slice(headerIndex);
  const cleanedCsv = cleanedLines.join('\n');
  return { cleanedCsv, headerIndex };
};

export const ImportBookingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  events = [],
}) => {
  const { user } = useAuth();
  const { currentStudio } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedBookingRow[]>([]);
  const [failedRows, setFailedRows] = useState<FailedRowInfo[]>([]);
  const [showFailedDetails, setShowFailedDetails] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Tải file CSV mẫu (Template)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Khách hàng': 'Nguyễn Văn An',
        'SĐT': '0901234567',
        'Email': 'an.nguyen@gmail.com',
        'Loại hình': 'Studio',
        'Ngày chụp': '2026-10-15',
        'Thời gian': '09:00 - 11:30',
        'Địa điểm': 'Studio Mirmia Q.1, TP.HCM',
        'Giá': '3.500.000 đ',
        'Cọc': '1.000.000 đ',
        'Trạng thái': 'Mới hỏi',
        'Ghi chú': 'Chụp ảnh profile doanh nhân 3 set trang phục',
      },
      {
        'Khách hàng': 'Trần Thị Mai',
        'SĐT': '0988776655',
        'Email': 'mai.tran@gmail.com',
        'Loại hình': 'Pre-wedding',
        'Ngày chụp': '20/10/2026',
        'Thời gian': '07:00 - 14:00',
        'Địa điểm': 'Nhà hát Thành Phố & Cầu Ánh Sao',
        'Giá': '12.000.000 VNĐ',
        'Cọc': '4.000.000 đ',
        'Trạng thái': 'Đã cọc',
        'Ghi chú': 'Gói Pre-wedding ngoại cảnh kèm makeup',
      },
      {
        'Khách hàng': 'Lê Hoàng Long',
        'SĐT': '0912345678',
        'Email': 'long.le@company.com',
        'Loại hình': 'Event',
        'Ngày chụp': '25/10/2026',
        'Thời gian': '18:00 - 21:30',
        'Địa điểm': 'GEM Center, Q.1',
        'Giá': '6tr',
        'Cọc': '6tr',
        'Trạng thái': 'Hoàn tất',
        'Ghi chú': 'Chụp sự kiện ra mắt sản phẩm công nghệ',
      },
    ];

    const csvString = Papa.unparse(templateData);
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'mau_lich_chup_lensy.csv');
  };

  // Xuất file CSV từ dữ liệu hiện tại
  const handleExportCurrentBookings = () => {
    if (!events || events.length === 0) {
      alert('Chưa có lịch chụp nào để xuất file.');
      return;
    }

    const exportData = events.map(e => ({
      'Khách hàng': e.clientName,
      'SĐT': e.clientPhone || '',
      'Email': '',
      'Ngày chụp': e.eventDate,
      'Thời gian': `${e.startTime} - ${e.endTime}`,
      'Địa điểm': e.location,
      'Giá': `${e.packagePrice.toLocaleString('vi-VN')} đ`,
      'Cọc': `${e.depositAmount.toLocaleString('vi-VN')} đ`,
      'Trạng thái': e.status,
      'Ghi chú': e.notes || '',
    }));

    const csvString = Papa.unparse(exportData);
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const today = new Date().toISOString().split('T')[0];
    saveAs(blob, `lensy_danh_sach_lich_chup_${today}.csv`);
  };

  // ====================================================================
  // PHÂN TÍCH FILE CSV VỚI BỘ CHUYỂN ĐỔI DỮ LIỆU THÔNG MINH
  // ====================================================================
  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Vui lòng chọn file có định dạng .csv');
      return;
    }

    setSelectedFileName(file.name);
    setParseError(null);
    setUploadSuccessCount(null);
    setFailedRows([]);

    // 1. Tiền xử lý File CSV với FileReader trước khi parse
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const rawText = (e.target?.result as string) || '';

        // Tách dòng và quét tìm dòng Header đầu tiên chứa "Khách hàng" hoặc "client_name"
        const { cleanedCsv, headerIndex, error } = preprocessCsvText(rawText);

        // 3. Tối ưu UX Thông báo lỗi: Không tìm thấy cột "Khách hàng"
        if (error || headerIndex === -1) {
          setParseError(error || "File không đúng định dạng. Không tìm thấy cột 'Khách hàng'.");
          setParsedRows([]);
          setFailedRows([]);
          return;
        }

        // 2. Parse an toàn chuỗi CSV đã được làm sạch cắt bỏ dòng thừa/title merge
        Papa.parse(cleanedCsv, {
          header: true,
          skipEmptyLines: 'greedy', // Bỏ qua các dòng trống hoàn toàn
          complete: (results) => {
            const rawData = results.data as Record<string, any>[];

            if (!rawData || rawData.length === 0) {
              setParseError('File CSV rỗng hoặc không có dữ liệu hợp lệ.');
              setParsedRows([]);
              return;
            }

            const validList: ParsedBookingRow[] = [];
            const failedList: FailedRowInfo[] = [];

            rawData.forEach((row, index) => {
              // Số dòng thực tế trong file CSV gốc của người dùng
              const rowNumber = headerIndex + index + 2;

              // 4. Graceful Error Handling: Bỏ qua dòng trống hoàn toàn
              const isRowEmpty = Object.values(row).every(
                v => v === null || v === undefined || String(v).trim() === ''
              );
              if (isRowEmpty) return;

              // 1. Header Mapping: "Khách hàng" -> client_name
              const rawClientName = smartFindValue(row, [
                'khách hàng',
                'khach hang',
                'tên khách hàng',
                'ten khach hang',
                'tên khách',
                'họ và tên',
                'client_name',
                'clientname',
                'name',
              ]);

              const clientName = rawClientName ? String(rawClientName).trim() : '';

              // Kiểm tra thiếu dữ liệu bắt buộc (Tên khách hàng)
              if (!clientName) {
                failedList.push({
                  rowNumber,
                  reason: 'Thiếu Tên khách hàng (cột "Khách hàng" hoặc "client_name")',
                  rawSnippet: JSON.stringify(row),
                });
                return;
              }

              // 1. Header Mapping: "SĐT" -> client_phone
          const rawPhone = smartFindValue(row, [
            'sđt',
            'sdt',
            'số điện thoại',
            'so dien thoai',
            'điện thoại',
            'dien thoai',
            'client_phone',
            'phone',
          ]);
          const clientPhone = rawPhone ? String(rawPhone).trim() : '0900000000';

          const rawEmail = smartFindValue(row, ['email', 'client_email', 'thư điện tử']);
          const clientEmail = rawEmail ? String(rawEmail).trim() : undefined;

          // 1. Header Mapping: "Ngày chụp" & "Thời gian" -> Nối lại & parse ISO 8601
          const rawDate = smartFindValue(row, [
            'ngày chụp',
            'ngay chup',
            'ngày',
            'ngay',
            'booking_date',
            'event_date',
            'date',
          ]);
          const rawTime = smartFindValue(row, [
            'thời gian',
            'thoi gian',
            'giờ chụp',
            'giờ',
            'gio',
            'time',
            'start_time',
          ]);

          const { isoTimestamp, eventDate, startTime, endTime } = combineDateAndTimeIso(rawDate, rawTime);

          // 1. Header Mapping: "Địa điểm" -> location
          const rawLocation = smartFindValue(row, [
            'địa điểm',
            'dia diem',
            'nơi chụp',
            'địa chỉ',
            'dia chi',
            'location',
            'address',
          ]);
          const location = rawLocation ? String(rawLocation).trim() : 'Tại Studio';

          // 1 & 2. Header Mapping: "Giá" -> total_price & Làm sạch dữ liệu số
          const rawPrice = smartFindValue(row, [
            'giá',
            'gia',
            'giá gói',
            'gia goi',
            'tổng tiền',
            'tong tien',
            'total_price',
            'package_price',
            'price',
          ]);
          const packagePrice = sanitizeMoneyNumber(rawPrice);

          // 1 & 2. Header Mapping: "Cọc" -> deposit_amount & Làm sạch dữ liệu số
          const rawDeposit = smartFindValue(row, [
            'cọc',
            'coc',
            'tiền cọc',
            'đã cọc',
            'deposit_amount',
            'deposit',
          ]);
          const depositAmount = sanitizeMoneyNumber(rawDeposit);

          // 3. Mapping Trạng thái (Status Translation): Tiếng Việt -> Enum hệ thống
          const rawStatus = smartFindValue(row, ['trạng thái', 'trang thai', 'status', 'tình trạng']);
          const status = translateStatus(rawStatus);

          const rawNotes = smartFindValue(row, ['ghi chú', 'ghi chu', 'notes', 'note']);
          const notes = rawNotes ? String(rawNotes).trim() : undefined;

          const rawSessionType = smartFindValue(row, [
            'loại hình',
            'loại hình chụp',
            'loai hinh',
            'category',
            'gói chụp',
            'goi chup',
            'package',
            'package_type',
            'loại',
            'type',
            'session_type',
            'dịch vụ',
            'dich vu',
          ]);
          const sessionType = normalizeSessionType(rawSessionType);

          validList.push({
            rowNumber,
            clientName,
            clientPhone,
            clientEmail,
            sessionType,
            bookingDate: isoTimestamp, // ISO 8601 Timestamp
            eventDate,
            startTime,
            endTime,
            location,
            packagePrice,
            depositAmount,
            paidAmount: status === 'done' ? packagePrice : depositAmount,
            status,
            notes,
          });
        });

        setParsedRows(validList);
        setFailedRows(failedList);

            if (validList.length === 0 && failedList.length > 0) {
              setParseError(`Không tìm thấy dòng nào hợp lệ. Đã phát hiện ${failedList.length} dòng lỗi thiếu dữ liệu.`);
            }
          },
          error: (error: any) => {
            setParseError(`Lỗi đọc file CSV: ${error?.message || 'Không thể đọc nội dung CSV'}`);
          },
        });
      } catch (err: any) {
        setParseError(`Lỗi xử lý file CSV: ${err.message || 'Lỗi không xác định'}`);
      }
    };

    reader.onerror = () => {
      setParseError('Không thể đọc file từ thiết bị. Vui lòng thử lại.');
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Tiến hành Bulk Insert vào Supabase
  const handleBulkInsert = async () => {
    if (parsedRows.length === 0) return;

    setIsSubmitting(true);
    setParseError(null);

    try {
      const photographerId = user?.id || null;
      const studioId = currentStudio?.id || null;

      // Chuẩn bị payload cho Supabase
      const payload = parsedRows.map(row => ({
        photographer_id: photographerId,
        studio_id: studioId,
        client_name: row.clientName,
        client_phone: row.clientPhone || '0900000000',
        client_email: row.clientEmail || null,
        session_type: row.sessionType,
        category: row.sessionType,
        package_type: row.sessionType,
        session_title: `Lịch chụp ${row.clientName}`,
        event_date: row.eventDate, // Date chuẩn YYYY-MM-DD
        start_time: row.startTime || '09:00',
        end_time: row.endTime || '12:00',
        location: row.location || 'Tại Studio',
        package_price: row.packagePrice,
        deposit_amount: row.depositAmount,
        paid_amount: row.paidAmount,
        status: row.status,
        quote_token: `qt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        notes: row.notes || null,
      }));

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('bookings').insert(payload);
        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Mock Store Fallback
        const existingRaw = localStorage.getItem('lensy_mock_bookings');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newMockBookings = payload.map((p, i) => ({
          ...p,
          id: `csv-mock-${Date.now()}-${i}`,
          created_at: new Date().toISOString(),
        }));
        localStorage.setItem('lensy_mock_bookings', JSON.stringify([...existing, ...newMockBookings]));
      }

      setUploadSuccessCount(parsedRows.length);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset state
        setParsedRows([]);
        setFailedRows([]);
        setSelectedFileName(null);
        setUploadSuccessCount(null);
      }, 1200);
    } catch (err: any) {
      setParseError(`Lỗi khi lưu vào cơ sở dữ liệu: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Nhập Lịch Chụp Từ CSV / Google Sheets
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Smart Mapper</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tự động nhận diện cột tiếng Việt, làm sạch số tiền và dịch trạng thái chuẩn Kanban
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Actions Bar: Template & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-500" />
              <span>Hỗ trợ cả file xuất từ Google Sheets ("Khách hàng", "SĐT", "Ngày chụp", "Giá", "Cọc"...)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải CSV Mẫu</span>
              </button>
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCurrentBookings}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Xuất danh sách hiện có ra file CSV"
                >
                  <span>Export ({events.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-gray-200 dark:border-white/10 hover:border-amber-400 bg-gray-50/50 dark:bg-white/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {selectedFileName ? selectedFileName : 'Kéo thả file CSV vào đây, hoặc click để duyệt file'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Smart Mapper tự động xử lý file xuất thô từ Google Sheets / Excel
            </p>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{parseError}</span>
            </div>
          )}

          {/* 4. Graceful Error Handling: Cảnh báo chi tiết các dòng bị thiếu dữ liệu bắt buộc */}
          {failedRows.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Bỏ qua {failedRows.length} dòng thiếu dữ liệu bắt buộc:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowFailedDetails(prev => !prev)}
                  className="text-[11px] underline hover:text-amber-600 dark:hover:text-amber-200 cursor-pointer flex items-center gap-1"
                >
                  <span>{showFailedDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}</span>
                  {showFailedDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showFailedDetails && (
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-700 dark:text-amber-400 font-mono max-h-36 overflow-y-auto">
                  {failedRows.map((err, idx) => (
                    <li key={idx}>
                      <strong>Dòng {err.rowNumber}:</strong> {err.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Success Notification */}
          {uploadSuccessCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <strong className="block text-sm font-bold">Nhập dữ liệu thành công!</strong>
                <span className="text-xs">Đã thêm {uploadSuccessCount} lịch chụp vào Bảng Kanban. Đang làm mới giao diện...</span>
              </div>
            </div>
          )}

          {/* Preview Table: Hiển thị khi đã parse thành công */}
          {parsedRows.length > 0 && uploadSuccessCount === null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Tìm thấy <strong className="text-amber-500 font-bold">{parsedRows.length}</strong> lịch chụp hợp lệ trong file:</span>
                </span>
                <span className="text-gray-400 font-mono text-[11px]">Xem trước 5 dòng đầu</span>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-zinc-950/60 shadow-sm text-xs">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                      <tr>
                        <th className="p-2.5">Khách hàng</th>
                        <th className="p-2.5">Ngày & Giờ (ISO)</th>
                        <th className="p-2.5">Địa điểm</th>
                        <th className="p-2.5 text-right">Tổng tiền</th>
                        <th className="p-2.5 text-right">Đã cọc</th>
                        <th className="p-2.5 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white truncate max-w-[130px]">
                            {row.clientName}
                          </td>
                          <td className="p-2.5 text-gray-600 dark:text-gray-300">
                            <div>{row.eventDate}</div>
                            <div className="text-[10px] text-gray-400">{row.startTime} - {row.endTime}</div>
                          </td>
                          <td className="p-2.5 text-gray-500 dark:text-gray-400 truncate max-w-[130px]">
                            {row.location}
                          </td>
                          <td className="p-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {row.packagePrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-right font-medium text-sky-600 dark:text-sky-400">
                            {row.depositAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-semibold cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleBulkInsert}
            disabled={parsedRows.length === 0 || isSubmitting || uploadSuccessCount !== null}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
              parsedRows.length > 0 && !isSubmitting && uploadSuccessCount === null
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-95'
                : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang nhập dữ liệu...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Nhập {parsedRows.length > 0 ? `${parsedRows.length} Lịch Chụp` : 'Dữ Liệu'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
