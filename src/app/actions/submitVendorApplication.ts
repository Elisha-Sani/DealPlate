'use server';

import { createClient } from '@supabase/supabase-js';

interface VendorApplicationInput {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  campusProximity: string;
  password: string;
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

export async function submitVendorApplication(input: VendorApplicationInput) {
  try {
    const supabaseAdmin = createAdminClient();
    const email = input.email.trim().toLowerCase();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        role: 'vendor',
        vendor_status: 'pending_review',
        business_name: input.businessName,
      },
      app_metadata: {
        role: 'vendor',
        vendor_status: 'pending_review',
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message.includes('already')
          ? 'A user already exists with this email. Ask superadmin to review the existing application or use another email.'
          : authError.message,
      };
    }

    const { error: applicationError } = await supabaseAdmin.from('vendor_applications').insert({
      auth_user_id: authData.user.id,
      business_name: input.businessName,
      contact_name: input.contactName,
      email,
      phone: input.phone,
      address: input.address,
      campus_proximity: input.campusProximity,
      status: 'pending_review',
    });

    if (applicationError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: applicationError.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Vendor application failed.' };
  }
}
