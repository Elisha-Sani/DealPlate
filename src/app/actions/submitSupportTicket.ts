'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { SupportTicketCategory, SupportUserRole } from '@/types/support';

interface SubmitSupportTicketParams {
  subject: string;
  category: SupportTicketCategory;
  message: string;
}

export async function submitSupportTicket(params: SubmitSupportTicketParams): Promise<{
  success: boolean;
  ticketId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be signed in to contact support.' };
    }

    const trimmedSubject = (params.subject || '').trim();
    const trimmedMessage = (params.message || '').trim();
    const category = params.category || 'general';

    if (!trimmedSubject || trimmedSubject.length < 3) {
      return { success: false, error: 'Please provide a descriptive subject (at least 3 characters).' };
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      return { success: false, error: 'Please provide a detailed message (at least 10 characters).' };
    }

    if (trimmedMessage.length > 5000) {
      return { success: false, error: 'Message is too long (maximum 5000 characters).' };
    }

    // Determine user role and name from database profiles
    let userRole: SupportUserRole = (user.app_metadata?.role === 'vendor' ? 'vendor' : 'student') as SupportUserRole;
    let userName = user.user_metadata?.full_name || user.user_metadata?.business_name || user.email || 'User';

    if (userRole === 'vendor') {
      const { data: vendorProfile } = await supabaseAdmin
        .from('vendors')
        .select('business_name, contact_name')
        .eq('id', user.id)
        .single();
      if (vendorProfile) {
        userName = vendorProfile.business_name || vendorProfile.contact_name || userName;
      }
    } else {
      const { data: studentProfile } = await supabaseAdmin
        .from('student_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (studentProfile?.full_name) {
        userName = studentProfile.full_name;
      }
    }

    const { data: insertedTicket, error: insertError } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: user.id,
        user_role: userRole,
        user_name: userName,
        user_email: user.email || '',
        subject: trimmedSubject,
        category: category,
        message: trimmedMessage,
        status: 'open',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[submitSupportTicket] Insert error:', insertError.message);
      return { success: false, error: 'Failed to send support message. Please try again.' };
    }

    return {
      success: true,
      ticketId: insertedTicket?.id,
    };
  } catch (err: any) {
    console.error('[submitSupportTicket] Unexpected error:', err);
    return { success: false, error: err?.message || 'An unexpected error occurred.' };
  }
}
