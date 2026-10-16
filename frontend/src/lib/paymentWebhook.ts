import { supabase, isSupabaseConfigured } from './supabase';

export interface BankTransactionWebhook {
  id?: string | number;
  gateway?: string; // 'sepay' | 'casso' | 'vietqr' | 'manual'
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string;
  amountIn: number;
  amountOut?: number;
  accumulated?: number;
  code?: string;
  transactionContent: string;
  referenceNumber?: string;
  body?: string;
}

export interface WebhookProcessResult {
  success: boolean;
  message: string;
  bookingId?: string;
  quoteToken?: string;
  amount?: number;
  newStatus?: string;
}

/**
 * Trích xuất mã quote_token hoặc booking ID từ nội dung chuyển khoản ngân hàng
 * Ví dụ nội dung: "LENSY WED-2026-904 MIRMIA" hoặc "COC MIRMIA-QT-904"
 */
export function extractQuoteTokenFromContent(content: string): string | null {
  if (!content) return null;
  const clean = content.toUpperCase();

  // Pattern 1: Tìm token dạng QT-... hoặc WED-... hoặc mã bất kỳ sau LENSY/COC/MIRMIA
  const matchToken = clean.match(/(?:LENSY|COC|MIRMIA|BOOKING)[\s_-]*([A-Z0-9_-]{4,20})/);
  if (matchToken && matchToken[1]) {
    return matchToken[1].toLowerCase();
  }

  // Pattern 2: Tìm token dạng UUID hoặc chuỗi định danh hex/alphanumeric dài 8+ ký tự
  const matchHex = clean.match(/[0-9A-F]{8}-[0-9A-F]{4}/i);
  if (matchHex) {
    return matchHex[0].toLowerCase();
  }

  // Pattern 3: Lấy từ khóa sau chữ "COC "
  const parts = clean.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'COC' && parts[i + 1]) {
      return parts[i + 1].toLowerCase();
    }
  }

  return null;
}

/**
 * Xử lý webhook biến động số dư từ SePAY / Casso / Ngân hàng
 */
export async function processPaymentWebhook(
  payload: BankTransactionWebhook
): Promise<WebhookProcessResult> {
  const content = payload.transactionContent || payload.body || '';
  const amount = Number(payload.amountIn || 0);

  if (amount <= 0) {
    return {
      success: false,
      message: 'Số tiền chuyển khoản không hợp lệ (nhỏ hơn hoặc bằng 0đ).',
    };
  }

  // 1. Phân tích nội dung tìm booking tương ứng
  const extractedToken = extractQuoteTokenFromContent(content);

  if (!isSupabaseConfigured) {
    // Chế độ Demo / Mock Local
    return {
      success: true,
      message: `[Demo] Đã nhận diện cọc ${amount.toLocaleString('vi-VN')}đ cho token "${extractedToken || 'mock'}" thành công.`,
      quoteToken: extractedToken || undefined,
      amount,
      newStatus: 'da_chot',
    };
  }

  try {
    // 2. Tìm booking trong Supabase
    let bookingQuery = supabase.from('bookings').select('*');

    if (extractedToken) {
      bookingQuery = bookingQuery.or(
        `quote_token.ilike.%${extractedToken}%,id.eq.${extractedToken}`
      );
    } else {
      // Nếu không parse được token cụ thể, tìm booking đang ở trạng thái 'cho_coc' có số tiền cọc xấp xỉ
      bookingQuery = bookingQuery
        .eq('status', 'cho_coc')
        .gte('deposit_amount', amount - 50000)
        .lte('deposit_amount', amount + 50000)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    const { data: bookings, error: findError } = await bookingQuery;

    if (findError || !bookings || bookings.length === 0) {
      return {
        success: false,
        message: `Không tìm thấy booking phù hợp với nội dung: "${content}" (${amount.toLocaleString('vi-VN')}đ)`,
      };
    }

    const targetBooking = bookings[0];
    const refCode = payload.referenceNumber || (payload.id ? String(payload.id) : null) || payload.code || null;

    // 2.1. Chống trùng lặp giao dịch (Idempotency check)
    if (refCode) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, amount, status')
        .eq('reference_code', refCode)
        .maybeSingle();

      if (existingTx) {
        return {
          success: true,
          message: `Giao dịch mã ${refCode} đã được xử lý trước đó. Bỏ qua ghi nhận trùng lặp.`,
          bookingId: targetBooking.id,
          quoteToken: targetBooking.quote_token,
          amount,
          newStatus: targetBooking.status,
        };
      }
    }

    // 2.2. Tính toán cộng dồn tiền thực thu (paid_amount) & công nợ còn lại (remaining_amount)
    let currentPaid = Number(targetBooking.paid_amount || 0);
    if (
      currentPaid === 0 &&
      ['deposited', 'da_chot', 'shot', 'editing', 'da_tra_file', 'done', 'hoan_thanh'].includes(
        targetBooking.status
      )
    ) {
      currentPaid = Number(targetBooking.deposit_amount || 0);
    }

    const newPaidAmount = currentPaid + amount;
    const pkgPrice = Number(targetBooking.package_price || 0);
    const newRemainingAmount = Math.max(0, pkgPrice - newPaidAmount);

    // 2.3. Điều hướng trạng thái thông minh (Không làm tụt tiến độ show đã chụp/đang sửa)
    let nextStatus = targetBooking.status;
    let transactionType: 'deposit' | 'final_settlement' = 'deposit';

    const isInitialPhase = ['lead', 'cho_coc', 'cho_xac_nhan_coc'].includes(targetBooking.status);

    if (isInitialPhase) {
      nextStatus = 'da_chot';
      transactionType = 'deposit';
    } else {
      // Đã ở các trạng thái tiến độ sau (shot, editing, da_tra_file, done...), giữ nguyên status
      nextStatus = targetBooking.status;
      transactionType = 'final_settlement';
    }

    // 3. Cập nhật booking (cộng dồn paid_amount, cập nhật deposit_amount nếu là cọc đầu)
    const updatePayload: any = {
      status: nextStatus,
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      updated_at: new Date().toISOString(),
    };

    if (isInitialPhase && !targetBooking.deposit_amount) {
      updatePayload.deposit_amount = amount;
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', targetBooking.id);

    if (updateError) {
      // Fallback nếu schema không có cột remaining_amount
      delete updatePayload.remaining_amount;
      const retry = await supabase.from('bookings').update(updatePayload).eq('id', targetBooking.id);
      if (retry.error) throw retry.error;
    }

    // 4. Tạo bản ghi dòng tiền vào bảng transactions kèm reference_code
    const txPayload: any = {
      booking_id: targetBooking.id,
      photographer_id: targetBooking.photographer_id || null,
      studio_id: targetBooking.studio_id || null,
      type: transactionType,
      amount: amount,
      payment_method: 'bank_transfer',
      status: 'completed',
      notes: `Tự động nhận thanh toán qua Webhook (${payload.gateway || 'SePAY'}). Cú pháp: "${content}". Mã GD: ${refCode || 'N/A'}`,
      transaction_date: payload.transactionDate || new Date().toISOString(),
      reference_code: refCode,
    };

    let { error: txError } = await supabase.from('transactions').insert([txPayload]);

    if (txError && txError.message?.includes('type')) {
      // Fallback nếu DB check constraint transactions_type_check chỉ nhận 'deposit'
      txPayload.type = 'deposit';
      delete txPayload.reference_code;
      const retryTx = await supabase.from('transactions').insert([txPayload]);
      txError = retryTx.error;
    }

    if (txError) {
      console.warn('Cảnh báo ghi log transaction:', txError.message);
    }

    return {
      success: true,
      message: `Đã xác nhận thanh toán thành công ${amount.toLocaleString('vi-VN')}đ cho khách hàng ${targetBooking.client_name}!`,
      bookingId: targetBooking.id,
      quoteToken: targetBooking.quote_token,
      amount,
      newStatus: nextStatus,
    };
  } catch (err: any) {
    console.error('Lỗi khi xử lý payment webhook:', err);
    return {
      success: false,
      message: `Lỗi hệ thống khi cập nhật cọc: ${err.message}`,
    };
  }
}

/**
 * Trợ lý Giả Lập Biến Động Số Dư (SePAY Simulator)
 * Dùng để test 1-chạm xác nhận cọc trên UI mà không cần chuyển khoản ngân hàng thật
 */
export async function simulateDepositPayment(
  bookingId: string,
  depositAmount: number,
  clientName: string,
  quoteToken?: string
): Promise<WebhookProcessResult> {
  const simulatedPayload: BankTransactionWebhook = {
    gateway: 'sepay_simulator',
    transactionDate: new Date().toISOString(),
    amountIn: depositAmount,
    transactionContent: `LENSY COC ${quoteToken || bookingId.substring(0, 8)} ${clientName.toUpperCase()}`,
    referenceNumber: `SIM-${Date.now().toString().slice(-6)}`,
  };

  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: `[Giả Lập Demo] Đã kích hoạt chốt cọc ${depositAmount.toLocaleString('vi-VN')}đ cho khách ${clientName}!`,
      bookingId,
      quoteToken,
      amount: depositAmount,
      newStatus: 'da_chot',
    };
  }

  return processPaymentWebhook(simulatedPayload);
}
