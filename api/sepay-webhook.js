// ====================================================================
// LENSY CRM - SEPAY / CASSO PAYMENT WEBHOOK (VERCEL SERVERLESS FUNCTION)
// Endpoint: POST /api/sepay-webhook
// ====================================================================

const { createClient } = require('@supabase/supabase-js');

// Trích xuất mã quote_token hoặc booking ID từ nội dung chuyển khoản
function extractQuoteTokenFromContent(content) {
  if (!content) return null;
  const clean = content.toUpperCase();

  // Pattern 1: Tìm token sau từ khóa LENSY / COC / MIRMIA / BOOKING
  const matchToken = clean.match(/(?:LENSY|COC|MIRMIA|BOOKING)[\s_-]*([A-Z0-9_-]{4,20})/);
  if (matchToken && matchToken[1]) {
    return matchToken[1].toLowerCase();
  }

  // Pattern 2: Tìm token dạng UUID hoặc chuỗi định danh hex 8 ký tự
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

module.exports = async function handler(req, res) {
  // Chỉ nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Only POST requests are supported.',
    });
  }

  // Lấy các biến môi trường Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[SePAY Webhook] Thiếu cấu hình Supabase URL hoặc Service Role Key');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Missing Supabase credentials.',
    });
  }

  // Kiểm tra SePAY API Token bảo mật (nếu có cấu hình SEPAY_API_KEY)
  const expectedApiKey = process.env.SEPAY_API_KEY;
  if (expectedApiKey) {
    const authHeader = req.headers['authorization'] || '';
    const apiKeyMatch = authHeader.replace(/^Apikey\s+/i, '').trim();
    if (apiKeyMatch !== expectedApiKey) {
      console.warn('[SePAY Webhook] Không đúng API Key xác thực');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid SePAY API key.',
      });
    }
  }

  try {
    const payload = req.body || {};
    console.log('[SePAY Webhook] Nhận dữ liệu giao dịch:', JSON.stringify(payload));

    // Chuẩn hóa trường dữ liệu từ SePAY hoặc Casso
    // SePAY gửi: transferAmount, content, gateway, transactionDate, referenceCode, id
    const amount = Number(payload.transferAmount || payload.amountIn || payload.amount || 0);
    const content = String(payload.content || payload.transactionContent || payload.body || '').trim();
    const gateway = String(payload.gateway || 'SePAY');
    const transactionDate = payload.transactionDate || new Date().toISOString();
    const referenceNumber = payload.referenceCode || payload.referenceNumber || String(payload.id || '');

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer amount (must be greater than 0).',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Phân tích nội dung tìm kiếm booking
    const extractedToken = extractQuoteTokenFromContent(content);
    let targetBooking = null;

    if (extractedToken) {
      const { data: matchedBookings, error: searchError } = await supabase
        .from('bookings')
        .select('*')
        .or(`quote_token.ilike.%${extractedToken}%,id.eq.${extractedToken}`)
        .limit(1);

      if (!searchError && matchedBookings && matchedBookings.length > 0) {
        targetBooking = matchedBookings[0];
      }
    }

    // Nếu không khớp token cụ thể, tìm booking đang ở trạng thái 'cho_coc' hoặc 'lead' có tiền cọc khớp
    if (!targetBooking) {
      const { data: matchedAmount, error: amountError } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['cho_coc', 'lead'])
        .gte('deposit_amount', amount - 50000)
        .lte('deposit_amount', amount + 50000)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!amountError && matchedAmount && matchedAmount.length > 0) {
        targetBooking = matchedAmount[0];
      }
    }

    if (!targetBooking) {
      console.warn(`[SePAY Webhook] Không tìm thấy booking phù hợp: "${content}" (${amount}đ)`);
      return res.status(200).json({
        success: false,
        message: `Đã nhận giao dịch nhưng chưa khớp với booking nào: "${content}"`,
      });
    }

    // 1.1. Chống trùng lặp giao dịch (Idempotency check)
    if (referenceNumber) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, amount, status')
        .eq('reference_code', referenceNumber)
        .maybeSingle();

      if (existingTx) {
        console.log(`[SePAY Webhook] Giao dịch ${referenceNumber} đã được xử lý trước đó. Bỏ qua trùng lặp.`);
        return res.status(200).json({
          success: true,
          message: `Giao dịch ${referenceNumber} đã được xử lý trước đó.`,
          bookingId: targetBooking.id,
          amount,
          status: targetBooking.status,
        });
      }
    }

    // 1.2. Tính toán cộng dồn tiền thực thu (paid_amount) & công nợ còn lại (remaining_amount)
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

    // 1.3. Điều hướng trạng thái thông minh (Không làm tụt tiến độ show)
    let nextStatus = targetBooking.status;
    let transactionType = 'deposit';

    const isInitialPhase = ['lead', 'cho_coc', 'cho_xac_nhan_coc'].includes(targetBooking.status);

    if (isInitialPhase) {
      nextStatus = 'da_chot';
      transactionType = 'deposit';
    } else {
      nextStatus = targetBooking.status;
      transactionType = 'final_settlement';
    }

    // 2. Cập nhật booking (cộng dồn paid_amount, cập nhật deposit_amount nếu là cọc đầu)
    const updatePayload = {
      status: nextStatus,
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      updated_at: new Date().toISOString(),
    };

    if (isInitialPhase && !targetBooking.deposit_amount) {
      updatePayload.deposit_amount = amount;
    }

    let { error: updateError } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', targetBooking.id);

    if (updateError) {
      delete updatePayload.remaining_amount;
      const retry = await supabase.from('bookings').update(updatePayload).eq('id', targetBooking.id);
      if (retry.error) throw retry.error;
    }

    // 3. Ghi nhận dòng tiền vào bảng transactions kèm reference_code
    const txPayload = {
      booking_id: targetBooking.id,
      photographer_id: targetBooking.photographer_id || null,
      studio_id: targetBooking.studio_id || null,
      type: transactionType,
      amount: amount,
      payment_method: 'bank_transfer',
      status: 'completed',
      notes: `Tự động nhận thanh toán qua Webhook (${gateway}). Cú pháp: "${content}". Mã GD: ${referenceNumber}`,
      transaction_date: transactionDate,
      reference_code: referenceNumber || null,
    };

    let { error: txError } = await supabase.from('transactions').insert([txPayload]);

    if (txError && txError.message && txError.message.includes('type')) {
      txPayload.type = 'deposit';
      delete txPayload.reference_code;
      const retryTx = await supabase.from('transactions').insert([txPayload]);
      txError = retryTx.error;
    }

    if (txError) {
      console.warn('[SePAY Webhook] Cảnh báo ghi log transaction:', txError.message);
    }

    console.log(`[SePAY Webhook] ✅ Ghi nhận thanh toán thành công cho Booking ${targetBooking.id} (${targetBooking.client_name}) - ${amount}đ (${nextStatus})`);

    return res.status(200).json({
      success: true,
      message: `Xác nhận thanh toán thành công ${amount.toLocaleString('vi-VN')}đ cho khách ${targetBooking.client_name}!`,
      bookingId: targetBooking.id,
      quoteToken: targetBooking.quote_token,
      amount,
      status: nextStatus,
    });
  } catch (error) {
    console.error('[SePAY Webhook] Lỗi xử lý:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook: ' + error.message,
    });
  }
};
