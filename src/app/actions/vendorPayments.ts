'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export interface PendingPaymentRow {
  id: string;
  amount: number;
  phone: string;
  created_at: string;
  deal_title: string;
}

async function requireVendor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('You must be signed in as a vendor.');
  }
  return user;
}

export async function vendorGetPendingPayments(): Promise<{
  success: boolean;
  payments?: PendingPaymentRow[];
  error?: string;
}> {
  try {
    const user = await requireVendor();

    // Payments RLS only lets the buyer read their own row — vendors need a
    // service-role read here, scoped explicitly to deals they own below.
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('id, amount, phone, created_at, deal_id, deals!inner(title, vendor_id)')
      .eq('status', 'pending')
      .eq('deals.vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const payments: PendingPaymentRow[] = (data || []).map((row: any) => ({
      id: row.id,
      amount: Number(row.amount),
      phone: row.phone,
      created_at: row.created_at,
      deal_title: row.deals?.title || 'Unknown deal',
    }));

    return { success: true, payments };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load pending payments.' };
  }
}

/**
 * Manual fallback for when the M-Pesa webhook never arrives (or is delayed)
 * but the vendor can see the payment landed on their own till/phone. Only
 * confirmable by the vendor who owns the deal the payment is for — verified
 * explicitly here since this bypasses RLS via the service-role client.
 */
export async function vendorConfirmPayment(paymentId: string, mpesaReceipt: string) {
  try {
    const user = await requireVendor();

    if (!mpesaReceipt || mpesaReceipt.trim().length < 4) {
      return { success: false, error: 'Enter the M-Pesa confirmation code shown on your till/phone.' };
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, deal_id, amount, status, deals!inner(vendor_id)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return { success: false, error: 'Payment not found.' };
    }

    if ((payment as any).deals.vendor_id !== user.id) {
      return { success: false, error: 'You can only confirm payments for your own deals.' };
    }

    // Atomic guarded transition — same pattern as the webhook, so a vendor
    // double-clicking confirm (or the real webhook landing moments later)
    // can't create two orders for the same payment.
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        mpesa_receipt: mpesaReceipt.trim(),
        result_code: 0,
        result_description: `Manually confirmed by vendor (${user.email})`,
      })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .select('id, user_id, deal_id, amount');

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const confirmed = updatedRows?.[0];
    if (!confirmed) {
      return { success: false, error: 'This payment was already processed.' };
    }

    const now = new Date();
    const orderDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const orderTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const { data: order, error: orderError } = await supabaseAdmin
      .rpc('create_order_after_payment', {
        p_user_id: confirmed.user_id,
        p_deal_id: confirmed.deal_id,
        p_order_date: orderDate,
        p_order_time: orderTime,
        p_total_paid: confirmed.amount,
      })
      .single();

    if (orderError || !order) {
      console.error('[vendorConfirmPayment] Payment marked completed but order creation failed:', orderError);
      return { success: false, error: 'Payment confirmed, but the order could not be created. Contact support.' };
    }

    await supabaseAdmin.from('payments').update({ order_id: (order as any).id }).eq('id', confirmed.id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Could not confirm payment.' };
  }
}
