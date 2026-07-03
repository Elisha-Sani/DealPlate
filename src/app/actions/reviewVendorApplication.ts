'use server';

import { createClient } from '@supabase/supabase-js';

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

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL/NEXT_SUPABASE_URL or SUPABASE_SECRET_KEY.');
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findAuthUserIdByEmail(supabaseAdmin: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id || null;
}

export async function reviewVendorApplicationSecure(
  applicationId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
) {
  try {
    const supabaseAdmin = createAdminClient();

    const { data: application, error: applicationError } = await supabaseAdmin
      .from('vendor_applications')
      .select('*')
      .eq('id', applicationId)
      .single<VendorApplicationRow>();

    if (applicationError || !application) {
      return { success: false, error: applicationError?.message || 'Vendor application not found.' };
    }

    let authUserId = application.auth_user_id;
    if (!authUserId) {
      authUserId = await findAuthUserIdByEmail(supabaseAdmin, application.email);
    }

    if (status === 'approved') {
      if (!authUserId) {
        return {
          success: false,
          error: 'No Supabase Auth user exists for this vendor email. Ask the vendor to reapply so their login account is created.',
        };
      }

      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        email_confirm: true,
        user_metadata: {
          role: 'vendor',
          vendor_status: 'approved',
          business_name: application.business_name,
        },
        app_metadata: {
          role: 'vendor',
          vendor_status: 'approved',
        },
      });

      if (updateUserError) return { success: false, error: updateUserError.message };

      const { error: vendorError } = await supabaseAdmin.from('vendors').upsert({
        id: authUserId,
        business_name: application.business_name,
        contact_name: application.contact_name,
        email: application.email,
        phone: application.phone,
        address: application.address,
        campus_proximity: application.campus_proximity,
        status: 'approved',
      });

      if (vendorError) return { success: false, error: vendorError.message };
    } else if (authUserId) {
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          role: 'vendor',
          vendor_status: 'rejected',
          business_name: application.business_name,
        },
        app_metadata: {
          role: 'vendor',
          vendor_status: 'rejected',
        },
      });
    }

    const { error: reviewError } = await supabaseAdmin
      .from('vendor_applications')
      .update({
        auth_user_id: authUserId,
        status,
        admin_notes: adminNotes || (status === 'approved' ? 'Approved from superadmin dashboard.' : 'Rejected from superadmin dashboard.'),
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (reviewError) return { success: false, error: reviewError.message };

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Vendor review failed.' };
  }
}
