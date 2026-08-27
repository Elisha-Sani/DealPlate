'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { initiateStkPush } from '@/lib/mpesa/stkPush';
import { SERVICE_FEE } from '@/lib/constants';

export async function initiateMpesaPayment(dealId: string, phone: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to pay.' };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Could not fetch your profile.' };
    }

    if (!profile.is_verified) {
      return { success: false, error: 'You must complete KYC verification before purchasing meals.' };
    }

    // Recompute the price server-side from the deal row — never trust a
    // client-supplied amount for anything that triggers a real payment.
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('id, title, deal_price, stock_count')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return { success: false, error: 'Deal not found.' };
    }

    if (deal.stock_count <= 0) {
      return { success: false, error: 'This deal just sold out.' };
    }

    const amount = Number(deal.deal_price) + SERVICE_FEE;

    const stkResult = await initiateStkPush({
      phone,
      amount,
      accountReference: 'DealPlate',
      transactionDesc: deal.title,
    });

    const { error: insertError } = await supabaseAdmin.from('payments').insert({
      user_id: user.id,
      deal_id: dealId,
      checkout_request_id: stkResult.checkoutRequestId,
      merchant_request_id: stkResult.merchantRequestId,
      amount,
      phone,
      status: 'pending',
    });

    if (insertError) {
      console.error('[CRITICAL] Failed to record pending M-Pesa payment:', insertError);
      return { success: false, error: 'Could not start payment. Please try again.' };
    }

    return {
      success: true,
      checkoutRequestId: stkResult.checkoutRequestId,
      customerMessage: stkResult.customerMessage,
    };
  } catch (error: any) {
    console.error('[initiateMpesaPayment] error:', error);
    return { success: false, error: error?.message || 'Payment could not be started.' };
  }
}
