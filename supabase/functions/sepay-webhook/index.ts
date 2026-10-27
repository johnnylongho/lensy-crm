// ====================================================================
// LENSY CRM - SEPAY / CASSO PAYMENT WEBHOOK (SUPABASE EDGE FUNCTION)
// File: supabase/functions/sepay-webhook/index.ts
// Runtime: Deno / TypeScript
// ====================================================================

/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Trích xuất mã token hoặc booking ID từ nội dung chuyển khoản
function extractQuoteTokenFromContent(content: string): string | null {
  if (!content) return null;
  const clean = content.toUpperCase();

  const matchToken = clean.match(/(?:LENSY|COC|MIRMIA|BOOKING)[\s_-]*([A-Z0-9_-]{4,20})/);
  if (matchToken && matchToken[1]) {
    return matchToken[1].toLowerCase();
  }

  const matchHex = clean.match(/[0-9A-F]{8}-[0-9A-F]{4}/i);
  if (matchHex) {
    return matchHex[0].toLowerCase();
  }

  const parts = clean.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'COC' && parts[i + 1]) {
      return parts[i + 1].toLowerCase();
    }
  }

  return null;
}

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ success: false, message: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Xác thực SePAY API Key nếu có cài đặt trong Deno Secret
  const expectedApiKey = Deno.env.get('SEPAY_API_KEY');
  if (expectedApiKey) {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Apikey\s+/i, '').trim();
    if (token !== expectedApiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const payload = await req.json();
    console.log('[SePAY Edge Function] Received payload:', JSON.stringify(payload));

    const amount = Number(payload.transferAmount || payload.amountIn || payload.amount || 0);
    const content = String(payload.content || payload.transactionContent || payload.body || '').trim();
    const gateway = String(payload.gateway || 'SePAY');
    const transactionDate = payload.transactionDate || new Date().toISOString();
    const referenceNumber = payload.referenceCode || payload.referenceNumber || String(payload.id || '');

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid transfer amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      return new Response(
        JSON.stringify({
          success: false,
          message: `Không tìm thấy booking khớp với nội dung: "${content}"`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1.1. Chống trùng lặp giao dịch (Idempotency check)
    if (referenceNumber) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, amount, status')
        .eq('reference_code', referenceNumber)
        .maybeSingle();

      if (existingTx) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Giao dịch ${referenceNumber} đã được xử lý trước đó.`,
            bookingId: targetBooking.id,
            amount,
            status: targetBooking.status,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
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
    const updatePayload: any = {
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
    const txPayload: any = {
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Xác nhận thanh toán thành công ${amount}đ cho khách ${targetBooking.client_name}!`,
        bookingId: targetBooking.id,
        quoteToken: targetBooking.quote_token,
        amount,
        status: nextStatus,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[SePAY Edge Function] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
