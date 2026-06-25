import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the service role key.
 * Only use this in API routes or server components — never expose to the browser.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Server Supabase credentials missing.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}
