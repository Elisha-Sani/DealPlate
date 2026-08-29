'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';
import type { SupportTicketStatus } from '@/types/support';

interface AdminUpdateSupportTicketParams {
  ticketId: string;
  status?: SupportTicketStatus;
  adminNotes?: string;
}

export async function adminUpdateSupportTicket(
  params: AdminUpdateSupportTicketParams
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { id: adminId, email: adminEmail } = await requireSuperadmin();

    const updatePayload: Record<string, any> = {};

    if (params.status) {
      updatePayload.status = params.status;
      if (params.status === 'resolved' || params.status === 'closed') {
        updatePayload.resolved_by = adminId;
        updatePayload.resolved_at = new Date().toISOString();
      } else {
        updatePayload.resolved_by = null;
        updatePayload.resolved_at = null;
      }
    }

    if (params.adminNotes !== undefined) {
      updatePayload.admin_notes = params.adminNotes;
    }

    const { error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', params.ticketId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log admin action in audit log
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action_type: 'UPDATE_SUPPORT_TICKET',
      target_type: 'support_ticket',
      target_id: params.ticketId,
      reason: `Status: ${params.status || 'unchanged'}${params.adminNotes ? ` | Note: ${params.adminNotes}` : ''}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update support ticket.' };
  }
}
