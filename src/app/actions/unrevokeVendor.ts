'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

export async function unrevokeVendor(
  vendorId: string, // This is auth.users.id
  applicationId: string,
  reason: string
) {
  try {
    if (!reason || reason.trim() === '') {
      return { success: false, error: 'A reason is required to reinstate a vendor.' };
    }

    const { id: adminId, email: adminEmail } = await requireSuperadmin();

    // 1. Update app_metadata to account_status: 'active' via Auth API
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(vendorId, {
      app_metadata: {
        account_status: 'active',
        vendor_status: 'approved',
      },
    });

    if (updateUserError) {
      console.error('[CRITICAL DESYNC] Vendor Auth metadata sync failed for ID:', vendorId, updateUserError);
      return { success: false, error: 'METADATA_SYNC_FAILED', message: updateUserError.message };
    }

    // 2. Update DB state
    const { error: vendorError } = await supabaseAdmin
      .from('vendors')
      .update({ status: 'approved' })
      .eq('id', vendorId);

    if (vendorError) {
       console.error('[CRITICAL DB ERROR] Vendor status update failed:', vendorError);
    }

    let applicationError = null;
    if (applicationId) {
      const { error } = await supabaseAdmin
        .from('vendor_applications')
        .update({ status: 'approved', admin_notes: reason, reviewed_at: new Date().toISOString() })
        .eq('id', applicationId);
      applicationError = error;
      if (applicationError) {
        console.error('[CRITICAL DB ERROR] Vendor application update failed:', applicationError);
      }
    }

    // 3. Insert Audit Log
    const { error: auditError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        admin_email: adminEmail,
        action_type: 'unrevoke',
        target_type: 'vendor',
        target_id: vendorId,
        reason: reason,
      });

    if (auditError) {
       console.error('[CRITICAL AUDIT LOG ERROR] Failed to write audit log for vendor unrevoke:', auditError);
    }

    if (vendorError || applicationError || auditError) {
      return {
        success: false,
        error: 'PARTIAL_FAILURE',
        message: 'Vendor access was reinstated, but some records failed to update. Check server logs and reconcile manually.',
      };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Vendor reinstatement failed.' };
  }
}
