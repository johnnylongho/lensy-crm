/**
 * REPORT EXPORTER UTILITY
 * Hỗ trợ xuất dữ liệu Lịch chụp, Bảng lương và Báo cáo tài chính P&L ra file Excel / CSV
 * Tích hợp mã hóa UTF-8 BOM (\uFEFF) giúp mở trực tiếp trên Microsoft Excel tiếng Việt không bao giờ bị lỗi font.
 */

import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { CalendarEvent, CrewAssignmentItem } from '../types';
import { formatCurrencyVND } from './currency';

/**
 * Hàm tải file CSV an toàn với BOM UTF-8
 */
const downloadCsvFile = (csvString: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * 1. XUẤT DANH SÁCH SHOW CHỤP & DOANH THU CHI TIẾT
 */
export const exportBookingsToCsv = (
  bookings: CalendarEvent[],
  options?: { studioName?: string; dateRangeLabel?: string }
) => {
  const studioName = options?.studioName || 'Lensy Studio';
  const timestamp = new Date().toISOString().substring(0, 10);
  const filename = `Lensy_DanhSachLichChup_${timestamp}.csv`;

  const rows = bookings.map((b, idx) => {
    const pkgPrice = Number(b.packagePrice || 0);
    const paid = Number(b.paidAmount || b.depositAmount || 0);
    const remaining = Math.max(0, pkgPrice - paid);
    const expenses = Number(b.expenses || 0);
    const netProfit = pkgPrice - expenses;

    return {
      'STT': idx + 1,
      'Mã Lịch': b.id.substring(0, 8),
      'Khách Hàng': b.clientName || 'N/A',
      'Số Điện Thoại': b.clientPhone ? `'${b.clientPhone}` : '',
      'Ngày Chụp': b.eventDate || '',
      'Giờ Bắt Đầu': b.startTime || '',
      'Giờ Kết Thúc': b.endTime || '',
      'Địa Điểm': b.location || 'Tại Studio',
      'Loại Hình Chụp': b.category || b.sessionType || 'Khác',
      'Gói Chụp': b.package_type || '',
      'Trạng Thái': getStatusLabel(b.status),
      'Giá Trị Gói (VNĐ)': pkgPrice,
      'Đã Thu (VNĐ)': paid,
      'Còn Nợ (VNĐ)': remaining,
      'Chi Phí Show (VNĐ)': expenses,
      'Lợi Nhuận Ròng (VNĐ)': netProfit,
      'Thợ Chụp Chính': b.photographer?.full_name || 'Chưa gán',
      'Makeup Artist': b.makeup_artist?.full_name || 'Chưa gán',
      'Mã Báo Giá': b.quoteToken || '',
      'Ghi Chú': (b.notes || '').replace(/[\r\n]+/g, ' '),
    };
  });

  const csv = Papa.unparse(rows);
  downloadCsvFile(csv, filename);
  return { success: true, count: rows.length, filename };
};

/**
 * 2. XUẤT BẢNG LƯƠNG & THÙ LAO Ê-KÍP (PAYROLL REPORT)
 */
export const exportPayrollToCsv = (
  payrollItems: Array<{
    id?: string;
    bookingId?: string;
    memberName: string;
    roleLabel: string;
    phone?: string;
    clientName: string;
    eventDate: string;
    calculatedFee: number;
    feeType: 'fixed' | 'percent';
    rawFee: number | string;
    isPaid: boolean;
    bankAccount?: string;
    bankName?: string;
  }>,
  options?: { studioName?: string; monthLabel?: string }
) => {
  const timestamp = new Date().toISOString().substring(0, 10);
  const filename = `Lensy_BangLuongEkip_${options?.monthLabel ? options.monthLabel.replace(/\s+/g, '_') : timestamp}.csv`;

  const rows = payrollItems.map((item, idx) => ({
    'STT': idx + 1,
    'Họ Tên Nhân Sự': item.memberName,
    'Vai Trò / Vị Trí': item.roleLabel,
    'Số Điện Thoại': item.phone ? `'${item.phone}` : '',
    'Show Chụp (Khách)': item.clientName,
    'Ngày Show': item.eventDate,
    'Thù Lao Thực Nhận (VNĐ)': item.calculatedFee,
    'Định Mức Thù Lao': item.feeType === 'percent' ? `${item.rawFee}% gói` : `${Number(item.rawFee).toLocaleString('vi-VN')} đ`,
    'Trạng Thái Thanh Toán': item.isPaid ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN',
    'Số Tài Khoản': item.bankAccount ? `'${item.bankAccount}` : '',
    'Ngân Hàng': item.bankName || '',
  }));

  const csv = Papa.unparse(rows);
  downloadCsvFile(csv, filename);
  return { success: true, count: rows.length, filename };
};

/**
 * 3. XUẤT BÁO CÁO TỔNG HỢP TÀI CHÍNH P&L (PROFIT & LOSS SUMMARY)
 */
export const exportFinancialSummaryToCsv = (
  bookings: CalendarEvent[],
  options?: { studioName?: string; periodLabel?: string }
) => {
  const studioName = options?.studioName || 'Lensy Studio & Academy';
  const timestamp = new Date().toISOString().substring(0, 10);
  const filename = `Lensy_BaoCaoTaiChinh_${timestamp}.csv`;

  // Tính toán các chỉ số
  const validBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'da_huy' && !b.is_deleted);
  const totalBookings = validBookings.length;
  const totalContractValue = validBookings.reduce((sum, b) => sum + Number(b.packagePrice || 0), 0);
  const totalCollected = validBookings.reduce((sum, b) => sum + Number(b.paidAmount || b.depositAmount || 0), 0);
  const totalReceivables = Math.max(0, totalContractValue - totalCollected);
  const totalExpenses = validBookings.reduce((sum, b) => sum + Number(b.expenses || 0), 0);
  const netProfit = totalContractValue - totalExpenses;
  const marginPercent = totalContractValue > 0 ? ((netProfit / totalContractValue) * 100).toFixed(1) : '0';

  const summaryRows = [
    { 'Chỉ Số Tài Chính': 'Tên Studio', 'Giá Trị': studioName, 'Đơn Vị / Ghi Chú': '' },
    { 'Chỉ Số Tài Chính': 'Thời Gian Xuất Báo Cáo', 'Giá Trị': new Date().toLocaleString('vi-VN'), 'Đơn Vị / Ghi Chú': '' },
    { 'Chỉ Số Tài Chính': 'Kỳ Báo Cáo', 'Giá Trị': options?.periodLabel || 'Toàn thời gian', 'Đơn Vị / Ghi Chú': '' },
    { 'Chỉ Số Tài Chính': '--------------------------', 'Giá Trị': '--------------------------', 'Đơn Vị / Ghi Chú': '------------' },
    { 'Chỉ Số Tài Chính': '1. Tổng Số Lượng Show Chụp', 'Giá Trị': totalBookings, 'Đơn Vị / Ghi Chú': 'Show' },
    { 'Chỉ Số Tài Chính': '2. Tổng Giá Trị Hợp Đồng (Doanh Thu)', 'Giá Trị': totalContractValue, 'Đơn Vị / Ghi Chú': 'VNĐ' },
    { 'Chỉ Số Tài Chính': '3. Thực Thu Đã Vào Tài Khoản', 'Giá Trị': totalCollected, 'Đơn Vị / Ghi Chú': 'VNĐ' },
    { 'Chỉ Số Tài Chính': '4. Công Nợ Khách Hàng Còn Thiếu', 'Giá Trị': totalReceivables, 'Đơn Vị / Ghi Chú': 'VNĐ (Cần thu hồi)' },
    { 'Chỉ Số Tài Chính': '5. Tổng Chi Phí Vận Hành Show & Ê-kíp', 'Giá Trị': totalExpenses, 'Đơn Vị / Ghi Chú': 'VNĐ (Thù lao + Chi phí ngoài)' },
    { 'Chỉ Số Tài Chính': '6. Lợi Nhuận Ròng (Net Profit)', 'Giá Trị': netProfit, 'Đơn Vị / Ghi Chú': 'VNĐ (Mục 2 trừ Mục 5)' },
    { 'Chỉ Số Tài Chính': '7. Tỷ Suất Lợi Nhuận (Profit Margin)', 'Giá Trị': `${marginPercent}%`, 'Đơn Vị / Ghi Chú': 'Tỷ lệ sinh lời trên doanh thu' },
  ];

  const csv = Papa.unparse(summaryRows);
  downloadCsvFile(csv, filename);
  return { success: true, filename };
};

/**
 * Chuyển đổi mã trạng thái sang tiếng Việt dễ đọc
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'cho_coc':
    case 'lead':
      return 'Chờ cọc / Mới hỏi';
    case 'cho_xac_nhan_coc':
      return 'Chờ duyệt cọc (Bill gửi)';
    case 'da_chot':
    case 'deposited':
    case 'confirmed':
      return 'Đã chốt cọc';
    case 'shot':
      return 'Đã chụp xong';
    case 'editing':
      return 'Đang hậu kỳ / Retouch';
    case 'da_tra_file':
      return 'Đã trả file ảnh';
    case 'hoan_thanh':
    case 'done':
      return 'Hoàn thành trọn gói';
    case 'da_huy':
    case 'cancelled':
      return 'Đã hủy show';
    default:
      return status;
  }
}
