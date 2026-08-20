'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

interface VendorApplicationRow {
  id: string;
  auth_user_id: string | null;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  campus_proximity: string;
}

export async function reviewVendorApplicationSecure(
  applicationId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
) {
  try {
    const { id: adminId, email: adminEmail } = await requireSuperadmin();

    // 1. Call RPC to update DB and write audit log
    const { error: rpcError } = await supabaseAdmin.rpc('review_vendor_application', {
      p_application_id: applicationId,
      p_status: status,
      p_admin_notes: adminNotes || (status === 'approved' ? 'Approved from superadmin dashboard.' : 'Rejected from superadmin dashboard.'),
      p_admin_id: adminId,
      p_admin_email: adminEmail
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    // 2. Fetch the updated application to get the auth_user_id
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('vendor_applications')
      .select('*')
      .eq('id', applicationId)
      .single<VendorApplicationRow>();

    if (applicationError || !application) {
      return { success: false, error: applicationError?.message || 'Vendor application not found after update.' };
    }

    const authUserId = application.auth_user_id;

    if (status === 'approved' && !authUserId) {
      return {
        success: false,
        error: 'No Supabase Auth user exists for this vendor email. Ask the vendor to sign up so their login account is created.',
      };
    }

    if (authUserId) {
      // 3. Sync Auth metadata
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        email_confirm: status === 'approved' ? true : undefined,
        user_metadata: {
          role: 'vendor',
          vendor_status: status,
          business_name: application.business_name,
        },
        app_metadata: {
          role: 'vendor',
          vendor_status: status,
        },
      });

      if (updateUserError) {
        console.error(`[CRITICAL DESYNC] Vendor DB status updated but Auth metadata sync failed for ID: ${authUserId}. Manual reconciliation required.`, updateUserError);
        return { success: false, error: 'METADATA_SYNC_FAILED', message: updateUserError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Vendor review failed.' };
  }
}
