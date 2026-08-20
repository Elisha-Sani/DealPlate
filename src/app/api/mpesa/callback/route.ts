import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Safaricom's STK Push callback. This endpoint is unauthenticated by
// necessity (it's called by Safaricom's servers, not a logged-in browser) —
// see docs/DARAJA_INTEGRATION_GUIDE.md for the full threat model. The
// safeguards here:
//   1. Only act on a CheckoutRequestID that matches a 'pending' row WE
//      created — an attacker would need to already know a live, in-flight
//      transaction ID, not just guess at this URL.
//   2. The status transition is a single atomic UPDATE ... WHERE
//      status = 'pending', so a retried/duplicate callback is a safe no-op
//      instead of double-creating an order or double-decrementing stock.
//   3. The order amount/user/deal are read back from our own `payments`
//      row (written server-side from the real deal price), never trusted
//      from the callback body itself.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const callback = body?.Body?.stkCallback;

  if (!callback?.CheckoutRequestID) {
    // Not a shape we recognize — acknowledge anyway so Safaricom doesn't
    // retry a request that will never make sense to us.
    return NextResponse.json({ ok: true });
  }

  const checkoutRequestId: string = callback.CheckoutRequestID;
  const resultCode: number = callback.ResultCode;
  const resultDescription: string = callback.ResultDesc || '';

  if (resultCode !== 0) {
    // Payment failed/cancelled/timed out on the user's phone. Guard the
    // transition the same way as success, in case of a duplicate callback.
    await supabaseAdmin
      .from('payments')
      .update({ status: 'failed', result_code: resultCode, result_description: resultDescription })
      .eq('checkout_request_id', checkoutRequestId)
      .eq('status', 'pending');

    return NextResponse.json({ ok: true });
  }

  const items: Array<{ Name: string; Value: unknown }> = callback.CallbackMetadata?.Item || [];
  const getItem = (name: string) => items.find((item) => item.Name === name)?.Value;
  const mpesaReceipt = String(getItem('MpesaReceiptNumber') || '');

  // Atomic guarded transition — if this affects zero rows, the payment was
  // already processed by an earlier (retried) callback delivery. Do nothing
  // further in that case, in particular never create a second order.
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('payments')
    .update({ status: 'completed', mpesa_receipt: mpesaReceipt, result_code: resultCode, result_description: resultDescription })
    .eq('checkout_request_id', checkoutRequestId)
    .eq('status', 'pending')
    .select('id, user_id, deal_id, amount');

  if (updateError) {
    console.error('[mpesa callback] Failed to update payment status:', updateError);
    return NextResponse.json({ ok: true });
  }

  const payment = updatedRows?.[0];
  if (!payment) {
    // Either an unknown CheckoutRequestID or already processed — no-op.
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  const orderDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const orderTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const { data: order, error: orderError } = await supabaseAdmin
    .rpc('create_order_after_payment', {
      p_user_id: payment.user_id,
      p_deal_id: payment.deal_id,
      p_order_date: orderDate,
      p_order_time: orderTime,
      p_total_paid: payment.amount,
    })
    .single();

  if (orderError || !order) {
    console.error('[mpesa callback] Payment succeeded but order creation failed:', orderError);
    // The payment is marked completed but has no order — surface this for
    // manual reconciliation rather than silently losing the payment.
    await supabaseAdmin
      .from('payments')
      .update({ result_description: `PAID_BUT_ORDER_FAILED: ${orderError?.message || 'unknown error'}` })
      .eq('id', payment.id);
    return NextResponse.json({ ok: true });
  }

  await supabaseAdmin.from('payments').update({ order_id: (order as any).id }).eq('id', payment.id);

  return NextResponse.json({ ok: true });
}
