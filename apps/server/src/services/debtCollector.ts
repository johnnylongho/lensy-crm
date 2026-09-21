import { DebtReminder, ReminderTone, Booking } from '@lensflow/shared';
import { mockStore } from '../mockStore';
import { supabase, isSupabaseConfigured } from '../supabase';

export async function getPendingDebtReminders(): Promise<DebtReminder[]> {
  let allBookings: Booking[] = [];

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('workflow_stage', 'delivered')
      .gt('remaining_amount', 0);
    allBookings = (data || []).map((b: any) => ({
      id: b.id,
      clientName: b.client_name,
      clientPhone: b.client_phone,
      clientEmail: b.client_email,
      sessionType: b.session_type,
      eventDate: b.event_date,
      startTime: b.start_time,
      endTime: b.end_time,
      location: b.location,
      packagePrice: Number(b.package_price),
      depositAmount: Number(b.deposit_amount),
      paidAmount: Number(b.paid_amount),
      remainingAmount: Number(b.remaining_amount),
      workflowStage: b.workflow_stage,
      paymentStatus: b.payment_status,
      quoteToken: b.quote_token,
      assignedGearIds: [],
      driveDeliveryLink: b.drive_delivery_link,
      deliveryDate: b.delivery_date,
      notes: b.notes,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  } else {
    allBookings = mockStore.getBookings().filter(
      b => b.workflowStage === 'delivered' && b.remainingAmount > 0
    );
  }

  const now = new Date();

  return allBookings.map(b => {
    const deliveryDate = b.deliveryDate ? new Date(b.deliveryDate) : new Date(b.updatedAt);
    const diffTime = Math.abs(now.getTime() - deliveryDate.getTime());
    const daysSinceDelivery = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let recommendedTone: ReminderTone = 'gentle';
    if (daysSinceDelivery >= 7) {
      recommendedTone = 'firm_invoice';
    } else if (daysSinceDelivery >= 3) {
      recommendedTone = 'professional';
    }

    const formattedRemaining = b.remainingAmount.toLocaleString('vi-VN');
    let messageContent = '';

    if (recommendedTone === 'gentle') {
      messageContent = `Dạ em chào anh/chị ${b.clientName} ạ! Em gửi anh/chị link ảnh hoàn thiện rồi nhé ạ: ${b.driveDeliveryLink || '[Link Driver]'}. Anh/chị xem qua hình nếu cần chỉnh thêm gì cứ nhắn em nhé. Tiện thể hợp đồng còn lại khoản quyết toán là ${formattedRemaining}đ, anh/chị xem gửi sớm giúp em qua STK để em chốt sổ lưu file gốc nha. Cảm ơn anh/chị nhiều ạ!`;
    } else if (recommendedTone === 'professional') {
      messageContent = `Chào anh/chị ${b.clientName}, em kiểm tra thấy album ảnh ngày ${b.eventDate} đã bàn giao được ${daysSinceDelivery} ngày rồi ạ. Hy vọng anh/chị hài lòng với sản phẩm! Hợp đồng của mình hiện còn số dư chưa quyết toán là ${formattedRemaining}đ. Anh/chị vui lòng sắp xếp chuyển khoản giúp em trong hôm nay hoặc ngày mai để em hoàn tất thủ tục bàn giao file độ phân giải cao nhất nhé. Em cảm ơn anh/chị!`;
    } else {
      messageContent = `[LENSFLOW NOTICE - THÔNG BÁO QUYẾT TOÁN] Kính gửi anh/chị ${b.clientName}, theo điều khoản hợp đồng buổi chụp ${b.sessionType.toUpperCase()} ngày ${b.eventDate}, thời hạn thanh toán đợt cuối đã quá hạn ${daysSinceDelivery} ngày kể từ ngày bàn giao ảnh. Số tiền cần quyết toán: ${formattedRemaining}đ. Anh/chị vui lòng hoàn tất chuyển khoản trước 18:00 hôm nay để hệ thống tự động duy trì thời hạn lưu trữ file trên Cloud Drive. Xin trân trọng cảm ơn!`;
    }

    // Zalo messaging link format (ready for 1-click interaction on mobile)
    const zaloDeeplink = `https://zalo.me/${b.clientPhone.replace(/^0/, '84')}?text=${encodeURIComponent(messageContent)}`;

    return {
      bookingId: b.id,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      eventDate: b.eventDate,
      remainingAmount: b.remainingAmount,
      daysSinceDelivery,
      recommendedTone,
      messageContent,
      zaloDeeplink,
    };
  });
}
