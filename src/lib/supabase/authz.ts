import { createClient } from '@/lib/supabase/server';

export interface VerifiedAdmin {
  id: string;
  email: string;
}

/**
 * Verifies the current request's cookie session belongs to a signed-in
 * superadmin. Never trust admin id/email passed as plain arguments from
 * the client — always derive them from the server-side session.
 */
export async function requireSuperadmin(): Promise<VerifiedAdmin> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHORIZED: You must be signed in.');
  }

  if (user.app_metadata?.role !== 'superadmin') {
    throw new Error('FORBIDDEN: Superadmin privileges required.');
  }

  return { id: user.id, email: user.email ?? 'unknown_admin_email' };
}
