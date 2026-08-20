'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

async function logAction(adminId: string, adminEmail: string, actionType: string, dealId: string, reason?: string) {
  const { error } = await supabaseAdmin.from('admin_actions').insert({
    admin_id: adminId,
    admin_email: adminEmail,
    action_type: actionType,
    target_type: 'deal',
    target_id: dealId,
    reason: reason || null,
  });
  if (error) {
    console.error('[CRITICAL AUDIT LOG ERROR] Failed to write audit log for deal action:', error);
  }
}

export async function adminSetDealPublished(dealId: string, isPublished: boolean) {
  try {
    const { id: adminId, email: adminEmail } = await requireSuperadmin();

    const { error } = await supabaseAdmin
      .from('deals')
      .update({ is_published: isPublished })
      .eq('id', dealId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAction(adminId, adminEmail, isPublished ? 'deal_publish' : 'deal_unpublish', dealId);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update deal.' };
  }
}

export async function adminDeleteDeal(dealId: string, reason: string) {
  try {
    if (!reason || reason.trim() === '') {
      return { success: false, error: 'A reason is required to delete a deal.' };
    }

    const { id: adminId, email: adminEmail } = await requireSuperadmin();

    const { error } = await supabaseAdmin.from('deals').delete().eq('id', dealId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logAction(adminId, adminEmail, 'deal_delete', dealId, reason);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to delete deal.' };
  }
}
