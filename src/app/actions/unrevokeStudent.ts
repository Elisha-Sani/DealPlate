'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

export async function unrevokeStudent(studentId: string, reason: string) {
  try {
    if (!reason || reason.trim() === '') {
      return { success: false, error: 'A reason is required to reinstate a student.' };
    }

    const { id: adminId, email: adminEmail } = await requireSuperadmin();

    // 1. Update app_metadata to account_status: 'active' via Auth API
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(studentId, {
      app_metadata: {
        account_status: 'active',
      },
    });

    if (updateUserError) {
      console.error('[CRITICAL DESYNC] Student Auth metadata sync failed for ID:', studentId, updateUserError);
      return { success: false, error: 'METADATA_SYNC_FAILED', message: updateUserError.message };
    }

    // 2. Update DB state
    const { error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .update({ is_verified: true })
      .eq('id', studentId);

    if (profileError) {
       console.error('[CRITICAL DB ERROR] Student profile update failed:', profileError);
    }

    const { error: kycError } = await supabaseAdmin
      .from('student_kyc_applications')
      .update({ status: 'approved', admin_notes: reason, reviewed_at: new Date().toISOString() })
      .eq('student_id', studentId);

    if (kycError) {
       console.error('[CRITICAL DB ERROR] Student KYC application update failed:', kycError);
    }

    // 3. Insert Audit Log
    const { error: auditError } = await supabaseAdmin
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        admin_email: adminEmail,
        action_type: 'unrevoke',
        target_type: 'student',
        target_id: studentId,
        reason: reason,
      });

    if (auditError) {
       console.error('[CRITICAL AUDIT LOG ERROR] Failed to write audit log for student unrevoke:', auditError);
    }

    if (profileError || kycError || auditError) {
      return {
        success: false,
        error: 'PARTIAL_FAILURE',
        message: 'Account access was reinstated, but some records failed to update. Check server logs and reconcile manually.',
      };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Student reinstatement failed.' };
  }
}
