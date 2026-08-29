'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';
import type { SupportTicket } from '@/types/support';

export async function adminGetSupportTickets(): Promise<{
  success: boolean;
  tickets?: SupportTicket[];
  error?: string;
}> {
  try {
    await requireSuperadmin();

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[adminGetSupportTickets] Fetch error:', error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      tickets: (data || []) as SupportTicket[],
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch support tickets.' };
  }
}
