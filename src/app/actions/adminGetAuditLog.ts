'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

export interface AdminActionRow {
  id: string;
  admin_email: string;
  action_type: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
}

export async function adminGetAuditLog(): Promise<{ success: boolean; actions?: AdminActionRow[]; error?: string }> {
  try {
    await requireSuperadmin();

    const { data, error } = await supabaseAdmin
      .from('admin_actions')
      .select('id, admin_email, action_type, target_type, target_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, actions: (data || []) as AdminActionRow[] };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load audit log.' };
  }
}
