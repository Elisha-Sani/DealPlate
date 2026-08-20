'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireSuperadmin } from '@/lib/supabase/authz';

export interface AdminDealRow {
  id: string;
  title: string;
  vendor: string;
  vendor_id: string;
  campus: string;
  deal_price: number;
  original_price: number;
  stock_count: number;
  is_published: boolean;
  created_at: string;
}

export async function adminGetDeals(): Promise<{ success: boolean; deals?: AdminDealRow[]; error?: string }> {
  try {
    await requireSuperadmin();

    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('id, title, vendor, vendor_id, campus, deal_price, original_price, stock_count, is_published, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, deals: (data || []) as AdminDealRow[] };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load deals.' };
  }
}
