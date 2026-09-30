// ====================================================================
// LENSY CRM - SEPAY / CASSO PAYMENT WEBHOOK (SUPABASE EDGE FUNCTION)
// File: supabase/functions/sepay-webhook/index.ts
// Runtime: Deno / TypeScript
// ====================================================================

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

    const newPaidAmount = Number(targetBooking.paid_amount || 0) + amount;

    // 2. Cập nhật booking sang trạng thái 'da_chot'
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'da_chot',
        paid_amount: newPaidAmount,
        deposit_amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetBooking.id);

    if (updateError) throw updateError;

    // 3. Ghi nhận dòng tiền vào bảng transactions
    await supabase.from('transactions').insert([
      {
        booking_id: targetBooking.id,
        photographer_id: targetBooking.photographer_id || null,
        studio_id: targetBooking.studio_id || null,
        type: 'deposit',
        amount: amount,
        payment_method: 'bank_transfer',
        status: 'completed',
        notes: `Tự động nhận cọc qua Webhook (${gateway}). Cú pháp: "${content}". Mã GD: ${referenceNumber}`,
        transaction_date: transactionDate,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Xác nhận cọc thành công ${amount}đ cho khách ${targetBooking.client_name}!`,
        bookingId: targetBooking.id,
        quoteToken: targetBooking.quote_token,
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
